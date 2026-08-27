import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Trust proxy is required when deployed behind reverse proxies (Render, Heroku, Vercel, etc.)
app.set('trust proxy', 1);

// Configure CORS to allow credentials (cookies)
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Middleware - Configured for Admin Auth
app.use(session({
    secret: process.env.SESSION_SECRET || 'jb-logistics-admin-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true on HTTPS production environments
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 2
    }
}));

// Supabase initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("CRITICAL ERROR: SUPABASE_URL or Supabase Key is missing from environment variables.");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Admin Credentials read strictly from environment variables
const ADMIN_CREDENTIALS = {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
};

if (!ADMIN_CREDENTIALS.email || !ADMIN_CREDENTIALS.password) {
    console.error("CRITICAL ERROR: ADMIN_EMAIL or ADMIN_PASSWORD missing in .env file.");
}

// Middleware to protect internal Admin API endpoints
function requireAdminAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized access. Admin session required.' });
}

// ==================== ADMIN AUTH ENDPOINTS ====================

/**
 * Direct Admin Login
 * Validates email/password and sets session directly
 */
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (email.trim() !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    // Set admin session flag
    req.session.isAdmin = true;
    req.session.adminEmail = ADMIN_CREDENTIALS.email;

    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'Failed to save admin session.' });
        }
        return res.status(200).json({
            success: true,
            message: 'Admin authentication successful.',
            adminEmail: ADMIN_CREDENTIALS.email
        });
    });
});

/**
 * Endpoint for checking active admin session status
 */
app.get('/api/admin/session', (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.json({ authenticated: true, email: req.session.adminEmail });
    }
    return res.json({ authenticated: false });
});

/**
 * Admin Logout Endpoint
 */
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout.' });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    });
});

// NOTE: /api/driver/login has been removed. 
// Drivers now authenticate natively on the client using Supabase Auth SDK.

// ==================== PROTECTED ADMIN API DATA ENDPOINTS ====================

app.get('/api/admin/messages', requireAdminAuth, async (req, res) => {
    try {
        console.log("DEBUG - Active Supabase URL:", process.env.SUPABASE_URL);
        console.log("DEBUG - Using Service Role Key:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

        const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
        
        console.log("DEBUG - Supabase Raw Data Result:", data);
        console.log("DEBUG - Supabase Raw Error Result:", error);

        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

app.get('/api/admin/drivers', requireAdminAuth, async (req, res) => {
    try {
        const { data, error } = await supabase.from('driver_profiles').select('*');
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        console.error('Error fetching drivers:', err);
        return res.status(500).json({ error: 'Failed to fetch drivers.' });
    }
});

// ==================== ADDED DRIVER CRUD ENDPOINTS (FIXES 404) ====================

app.post('/api/admin/drivers', requireAdminAuth, async (req, res) => {
    try {
        const { email, password, name, phone, license_number, license_type, vehicle_assigned, vehicle_model, status, current_trip } = req.body;

        let authUserId = null;
        if (email && password) {
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name, role: 'driver' }
            });
            if (authError) throw authError;
            authUserId = authData.user?.id;
        }

        const insertPayload = {
            name,
            phone,
            email,
            license_number,
            license_type,
            vehicle_assigned,
            vehicle_model,
            status: status || 'Active',
            current_trip: current_trip || 'Available'
        };

        if (authUserId) {
            insertPayload.id = authUserId;
        }

        const { data, error } = await supabase
            .from('driver_profiles')
            .insert([insertPayload])
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(data);
    } catch (err) {
        console.error('Error creating driver:', err);
        return res.status(500).json({ error: err.message || 'Failed to create driver.' });
    }
});

app.put('/api/admin/drivers/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, license_number, license_type, vehicle_assigned, vehicle_model, status, current_trip } = req.body;

        const { data, error } = await supabase
            .from('driver_profiles')
            .update({
                name,
                phone,
                license_number,
                license_type,
                vehicle_assigned,
                vehicle_model,
                status,
                current_trip
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.json(data);
    } catch (err) {
        console.error('Error updating driver:', err);
        return res.status(500).json({ error: err.message || 'Failed to update driver.' });
    }
});

app.delete('/api/admin/drivers/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('driver_profiles')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await supabase.auth.admin.deleteUser(id).catch(() => {});

        return res.json({ success: true, message: 'Driver deleted successfully.' });
    } catch (err) {
        console.error('Error deleting driver:', err);
        return res.status(500).json({ error: err.message || 'Failed to delete driver.' });
    }
});

// ==============================================================================

app.post('/api/admin/reply', requireAdminAuth, async (req, res) => {
    try {
        const { messageId, subject, message, recipient } = req.body;
        
        const edgeFunctionUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/notify-admin`;
        const edgeRes = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                type: 'admin_reply',
                messageId,
                subject,
                message,
                recipient
            })
        });

        if (!edgeRes.ok) {
            const errData = await edgeRes.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to send reply through notification service.');
        }

        const { error: updateErr } = await supabase
            .from('messages')
            .update({ status: 'replied' })
            .eq('id', messageId);

        if (updateErr) throw updateErr;

        return res.json({ success: true });
    } catch (err) {
        console.error('Error sending reply:', err);
        return res.status(500).json({ error: err.message || 'Failed to send reply.' });
    }
});

app.get('/api/admin/shipments', requireAdminAuth, async (req, res) => {
    try {
        const { data, error } = await supabase.from('shipments').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        console.error('Error fetching shipments:', err);
        return res.status(500).json({ error: 'Failed to fetch shipments.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});