import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Trust proxy is required when deployed behind reverse proxies (Render, Heroku, Vercel, etc.)
app.set('trust proxy', 1);

// Configure CORS to allow credentials (cookies) and cross-site requests
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Middleware - Configured for Admin & Driver Auth
app.use(session({
    secret: process.env.SESSION_SECRET || 'jb-logistics-admin-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 2
    }
}));

// ==================== SUPABASE INITIALIZATION ====================
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("CRITICAL ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
}

// 1. Public client used for authentication sign-in
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || supabaseServiceKey || '');

// 2. Admin client using the Service Role Key to completely bypass RLS for all backend queries
const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || supabaseAnonKey || '');

// Admin Credentials read strictly from environment variables
const ADMIN_CREDENTIALS = {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
};

if (!ADMIN_CREDENTIALS.email || !ADMIN_CREDENTIALS.password) {
    console.error("CRITICAL ERROR: ADMIN_EMAIL or ADMIN_PASSWORD missing in environment variables.");
}

// Middleware to protect internal Admin API endpoints
function requireAdminAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized access. Admin session required.' });
}

// Middleware to protect internal Driver API endpoints
function requireDriverAuth(req, res, next) {
    if (req.session && req.session.isDriver) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized access. Driver session required.' });
}

// ==================== ADMIN AUTH ENDPOINTS ====================

app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!ADMIN_CREDENTIALS.email || !ADMIN_CREDENTIALS.password) {
        return res.status(500).json({ error: 'Server admin credentials are not configured.' });
    }

    if (email.trim() !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

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

app.get('/api/admin/session', (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.json({ authenticated: true, email: req.session.adminEmail });
    }
    return res.json({ authenticated: false });
});

app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout.' });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    });
});

// ==================== DRIVER AUTH & PROFILE ENDPOINTS ====================

app.post('/api/driver/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const cleanEmail = email.trim();

        // Authenticate user via Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
        });

        if (error) throw error;

        // Verify driver profile exists using supabaseAdmin (bypasses RLS successfully)
        const { data: driverProfile, error: profileError } = await supabaseAdmin
            .from('driver_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError || !driverProfile) {
            return res.status(403).json({ error: 'Access denied. No active driver profile found for this account.' });
        }

        // Establish Express Driver Session
        req.session.isDriver = true;
        req.session.driverId = driverProfile.id;
        req.session.driverEmail = driverProfile.email;

        req.session.save((err) => {
            if (err) {
                console.error('Driver session save error:', err);
                return res.status(500).json({ error: 'Failed to initialize driver session.' });
            }
            return res.status(200).json({
                success: true,
                session: data.session,
                user: data.user,
                driver: driverProfile
            });
        });
    } catch (err) {
        console.error('Driver login error:', err.message);
        return res.status(401).json({ error: err.message || 'Invalid login credentials.' });
    }
});

app.get('/api/driver/session', (req, res) => {
    if (req.session && req.session.isDriver) {
        return res.json({ 
            authenticated: true, 
            driverId: req.session.driverId, 
            email: req.session.driverEmail 
        });
    }
    return res.json({ authenticated: false });
});

app.get('/api/driver/profile', requireDriverAuth, async (req, res) => {
    try {
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('driver_profiles')
            .select('*')
            .eq('id', req.session.driverId)
            .single();

        if (profileError || !profileData) {
            return res.status(404).json({ error: 'Driver profile not found.' });
        }

        let deliveryCount = 0;
        if (profileData.driver_id) {
            const { count } = await supabaseAdmin
                .from('shipments')
                .select('*', { count: 'exact', head: true })
                .eq('driver_id', profileData.driver_id)
                .eq('current_status', 'delivered');
            if (count !== null) deliveryCount = count;
        }

        return res.json({
            ...profileData,
            totalDeliveries: deliveryCount.toString()
        });
    } catch (err) {
        console.error('Error fetching driver profile:', err);
        return res.status(500).json({ error: 'Failed to fetch driver profile.' });
    }
});

app.put('/api/driver/profile', requireDriverAuth, async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const { data, error } = await supabaseAdmin
            .from('driver_profiles')
            .update({ name, phone, address })
            .eq('id', req.session.driverId)
            .select()
            .single();

        if (error) throw error;
        return res.json({ success: true, driver: data });
    } catch (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ error: err.message || 'Failed to update profile.' });
    }
});

app.put('/api/driver/vehicle', requireDriverAuth, async (req, res) => {
    try {
        const { license_number, vehicle_assigned, vehicle_model } = req.body;
        const { data, error } = await supabaseAdmin
            .from('driver_profiles')
            .update({ license_number, vehicle_assigned, vehicle_model })
            .eq('id', req.session.driverId)
            .select()
            .single();

        if (error) throw error;
        return res.json({ success: true, driver: data });
    } catch (err) {
        console.error('Error updating vehicle:', err);
        return res.status(500).json({ error: err.message || 'Failed to update vehicle.' });
    }
});

app.post('/api/driver/avatar', requireDriverAuth, async (req, res) => {
    try {
        const { avatar } = req.body;
        const { error } = await supabaseAdmin
            .from('driver_profiles')
            .update({ avatar })
            .eq('id', req.session.driverId);

        if (error) throw error;
        return res.json({ success: true });
    } catch (err) {
        console.error('Error updating avatar:', err);
        return res.status(500).json({ error: err.message || 'Failed to update avatar.' });
    }
});

app.post('/api/driver/change-password', requireDriverAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const { data: profile, error: profileErr } = await supabaseAdmin
            .from('driver_profiles')
            .select('email')
            .eq('id', req.session.driverId)
            .single();

        if (profileErr || !profile) {
            return res.status(404).json({ error: 'Driver account not found.' });
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: profile.email,
            password: currentPassword
        });

        if (signInError) {
            return res.status(401).json({ error: "Current password doesn't match." });
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            req.session.driverId,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        return res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
        console.error('Error changing password:', err);
        return res.status(500).json({ error: err.message || 'Failed to change password.' });
    }
});

// ==================== PROTECTED ADMIN API DATA ENDPOINTS ====================

app.get('/api/admin/messages', requireAdminAuth, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('messages').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

app.get('/api/admin/drivers', requireAdminAuth, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('driver_profiles').select('*');
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        console.error('Error fetching drivers:', err);
        return res.status(500).json({ error: 'Failed to fetch drivers.' });
    }
});

app.post('/api/admin/drivers', requireAdminAuth, async (req, res) => {
    try {
        const { email, password, name, phone, license_number, license_type, vehicle_assigned, vehicle_model, status, current_trip } = req.body;

        let authUserId = null;
        if (email && password) {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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

        const { data, error } = await supabaseAdmin
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

        const { data, error } = await supabaseAdmin
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

        const { error } = await supabaseAdmin
            .from('driver_profiles')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await supabaseAdmin.auth.admin.deleteUser(id).catch(() => {});

        return res.json({ success: true, message: 'Driver deleted successfully.' });
    } catch (err) {
        console.error('Error deleting driver:', err);
        return res.status(500).json({ error: err.message || 'Failed to delete driver.' });
    }
});

app.post('/api/admin/reply', requireAdminAuth, async (req, res) => {
    try {
        const { messageId, subject, message, recipient } = req.body;
        
        const edgeFunctionUrl = `${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL}/functions/v1/notify-admin`;
        const edgeRes = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY}`
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

        const { error: updateErr } = await supabaseAdmin
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
        const { data, error } = await supabaseAdmin.from('shipments').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return res.json(data || []);
    } catch (err) {
        console.error('Error fetching shipments:', err);
        return res.status(500).json({ error: 'Failed to fetch shipments.' });
    }
});

// ==================== ASSIGN DRIVER TO SHIPMENT ====================
app.put('/api/admin/shipments/:id/assign-driver', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { driver_id, driver_name } = req.body;

        const { data: updatedShipment, error: updateError } = await supabaseAdmin
            .from('shipments')
            .update({ 
                driver_id: driver_id,
                current_status: 'assigned',
                status: 'assigned'
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        const isValidUUID = (val) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return typeof val === 'string' && uuidRegex.test(val);
        };

        const customerUserId = isValidUUID(updatedShipment.user_id) ? updatedShipment.user_id : null;

        await supabaseAdmin
            .from('tracking_events')
            .insert({
                shipment_id: id,
                customer_user_id: customerUserId,
                status: 'assigned',
                location: updatedShipment.origin || 'Facility',
                description: `Driver ${driver_name || 'assigned'} assigned to shipment.`,
                event_time: new Date().toISOString()
            });

        return res.status(200).json(updatedShipment);
    } catch (err) {
        console.error('Error assigning driver:', err.message);
        return res.status(500).json({ error: err.message || 'Failed to assign driver.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});