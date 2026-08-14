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

// Express Session Middleware - Configured with a short expiration (e.g., 30 seconds)
app.use(session({
    secret: process.env.SESSION_SECRET || 'jb-logistics-admin-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true on HTTPS production environments
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 30 // Expires after 30 seconds of inactivity/time elapsed
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

// Middleware to protect internal API endpoints
function requireAdminAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized access. Admin session required.' });
}

// ==================== AUTH ENDPOINTS ====================

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
 * Endpoint for checking active session status
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

// ==================== PROTECTED API DATA ENDPOINTS ====================

app.get('/api/admin/messages', requireAdminAuth, async (req, res) => {
    try {
        const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

app.get('/api/admin/drivers', requireAdminAuth, async (req, res) => {
    try {
        const { data, error } = await supabase.from('drivers').select('*');
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        console.error('Error fetching drivers:', err);
        return res.status(500).json({ error: 'Failed to fetch drivers.' });
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