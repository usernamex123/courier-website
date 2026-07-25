import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173', // Adjust to your frontend URL if different
  credentials: true
}));

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Nodemailer Transporter (Safe to configure; will skip or log safely if credentials are blank)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==========================================
// ADMIN AUTHENTICATION ROUTES
// ==========================================

// Login route
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // Fallback or set in .env

  if (password === adminPassword) {
    // Set a secure HttpOnly cookie for session validation
    res.cookie('jb_admin_session', 'authenticated_true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    return res.status(200).json({ success: true, message: 'Authenticated successfully' });
  }

  return res.status(401).json({ success: false, message: 'Invalid passkey' });
});

// Verify session route
app.get('/api/admin/verify', (req, res) => {
  const session = req.cookies.jb_admin_session;
  if (session === 'authenticated_true') {
    return res.status(200).json({ isAuthenticated: true });
  }
  return res.status(200).json({ isAuthenticated: false });
});

// Logout route
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('jb_admin_session');
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// ADMIN PROTECTED DATA ENDPOINTS
// ==========================================

// Middleware to protect admin endpoints
const requireAdminAuth = (req, res, next) => {
  const session = req.cookies.jb_admin_session;
  if (session === 'authenticated_true') {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized request session' });
};

// Fetch all messages/quotes for the admin dashboard
app.get('/api/admin/messages', requireAdminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error('Failed to fetch messages from Supabase:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SHIPMENTS & FLEET MANAGEMENT API ENDPOINTS
// ==========================================

// Get all shipments
app.get('/api/admin/shipments', requireAdminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update shipment status / assign driver
app.patch('/api/admin/shipments/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, driver_name } = req.body;
    
    const { data, error } = await supabase
      .from('shipments')
      .update({ status, driver_name })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all live driver locations
app.get('/api/admin/drivers', requireAdminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('driver_locations')
      .select('*');
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PUBLIC FORM SUBMISSION & AUTO-REPLY ENDPOINT
// ==========================================
app.post('/api/messages', async (req, res) => {
  try {
    const { client_name, name, email, message, service } = req.body;
    const clientName = client_name || name || 'Valued Client';
    const clientMessage = message || service || 'No message content provided.';

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    // 1. Save submission into Supabase database table 'messages'
    const { data, error } = await supabase
      .from('messages')
      .insert([{ client_name: clientName, email, message: clientMessage }])
      .select();

    if (error) throw error;

    // 2. Automated Email Reply Back to the User
    const mailOptions = {
      from: `"JB Logistics" <${process.env.EMAIL_USER || 'noreply@jblogistics.com'}>`,
      to: email, 
      subject: 'We have received your quote request! - JB Logistics',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 30px; border: 1px solid #333;">
          <h2 style="color: #eab308; text-transform: uppercase;">Hello ${clientName},</h2>
          <p style="font-size: 14px; color: #ccc; line-height: 1.6;">
            Thank you for reaching out to <strong>JB Logistics</strong>. We have successfully received your inquiry and our team is reviewing your details.
          </p>
          <div style="background-color: #1c1917; padding: 15px; border-left: 4px solid #eab308; margin: 20px 0;">
            <p style="font-size: 12px; color: #aaa; margin: 0; text-transform: uppercase;">Your Submitted Message:</p>
            <p style="font-size: 14px; color: #fff; margin: 5px 0 0 0;">"${clientMessage}"</p>
          </div>
          <p style="font-size: 14px; color: #ccc; line-height: 1.6;">
            One of our logistics specialists will get back to you via email shortly.
          </p>
          <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px;">
            JB Logistics Automated Dispatch System
          </p>
        </div>
      `,
    };

    // Attempt to send auto-reply (safe if credentials aren't configured yet)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter.sendMail(mailOptions, (mailErr, info) => {
        if (mailErr) {
          console.error('Auto-reply email delivery warning:', mailErr.message);
        } else {
          console.log('Auto-reply sent successfully:', info.response);
        }
      });
    } else {
      console.log('Auto-reply skipped: EMAIL_USER/EMAIL_PASS not configured in .env yet.');
    }

    res.status(200).json({ success: true, message: 'Quote submitted successfully!', data });

  } catch (err) {
    console.error('Submission processing error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`JB Logistics Backend Server running on http://localhost:${PORT}`);
});