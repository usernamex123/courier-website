import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();

// Dynamically allow any origin/port while keeping credentials & cookies safe
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize Supabase client for backend use
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// DIAGNOSTIC CHECK: Print status to your server logs on startup
if (!supabaseUrl || !supabaseKey) {
  console.error('----------------------------------------------------');
  console.error('[ERROR] Supabase credentials missing on backend environment variables!');
  console.error('SUPABASE_URL:', supabaseUrl ? 'FOUND' : 'MISSING');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'FOUND' : 'MISSING');
  console.error('----------------------------------------------------');
} else {
  console.log('[INFO] Supabase credentials successfully loaded.');
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// ==========================================
// CENTRALIZED ADMIN AUTHENTICATION MIDDLEWARE
// ==========================================
const requireAdminAuth = (req, res, next) => {
  const session = req.cookies.jb_admin_session;
  
  if (session !== 'authenticated_true') {
    return res.status(401).json({ success: false, message: 'Unauthorized access. Admin privileges required.' });
  }
  
  next();
};

// ==========================================
// ADMIN AUTHENTICATION ROUTES
// ==========================================

app.post('/api/admin/login', (req, res) => {
  console.log('--- LOGIN ATTEMPT RECEIVED ---');
  console.log('Request Body:', req.body);

  const { password, passkey, pin } = req.body || {};
  const providedSecret = password || passkey || pin;
  
  // Safely check environment variable or fallback to default
  const adminPassword = (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim() !== '') 
    ? process.env.ADMIN_PASSWORD 
    : 'jblogistics@0987';

  console.log('Provided:', providedSecret, '| Expected:', adminPassword);

  if (providedSecret === adminPassword) {
    // FORCE cross-site compatibility for separate frontend/backend hosting environments & private windows
    res.cookie('jb_admin_session', 'authenticated_true', {
      httpOnly: true,
      secure: true,        // Required by modern browsers for cross-site cookies
      sameSite: 'none',    // Required if frontend and backend are on different URLs/domains or strict private contexts
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    console.log('Authentication SUCCESS. Cross-site cookie set.');
    return res.status(200).json({ success: true, message: 'Authenticated successfully' });
  }

  console.log('Authentication FAILED: Password mismatch');
  return res.status(401).json({ success: false, message: 'Invalid admin passcode. Access denied.' });
});

app.get('/api/admin/verify', (req, res) => {
  const session = req.cookies.jb_admin_session;
  if (session === 'authenticated_true') {
    return res.status(200).json({ isAuthenticated: true });
  }
  return res.status(200).json({ isAuthenticated: false });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('jb_admin_session', {
    httpOnly: true,
    sameSite: 'none',
    secure: true
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// ADMIN DATA & MESSAGES ROUTES (Secured with Middleware)
// ==========================================

app.get('/api/admin/messages', requireAdminAuth, async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ success: false, message: 'Supabase credentials missing on backend environment variables' });
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (err) {
    console.error('Server error fetching messages:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running successfully on port ${PORT}`);
});