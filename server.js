import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();

// CORS configuration for multi-hosting/all-host environments
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'jb_logistics_secure_jwt_secret_key';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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
// TOKEN AUTHENTICATION MIDDLEWARE
// ==========================================
const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized access. Admin privileges required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    console.error('Admin token verification failed:', err.message);
    return res.status(401).json({ success: false, message: 'Session expired or invalid token.' });
  }
};

// ==========================================
// ADMIN AUTHENTICATION ROUTES
// ==========================================

app.post('/api/admin/request-ticket', (req, res) => {
  console.log('--- ADMIN TICKET REQUESTED ---');
  try {
    const tempTicket = jwt.sign({ access: 'login_gate' }, JWT_SECRET, { expiresIn: '60s' });
    return res.status(200).json({ success: true, ticket: tempTicket });
  } catch (err) {
    console.error('Error generating ticket:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate security ticket.' });
  }
});

app.post('/api/admin/verify-ticket', (req, res) => {
  const { ticket } = req.body || {};
  
  if (!ticket) {
    return res.status(401).json({ success: false, message: 'No security ticket detected.' });
  }

  try {
    jwt.verify(ticket, JWT_SECRET);
    return res.status(200).json({ success: true, message: 'Ticket verified' });
  } catch (err) {
    console.log('Ticket verification failed:', err.message);
    return res.status(401).json({ success: false, message: 'Security ticket has expired or is invalid.' });
  }
});

app.post('/api/admin/login', (req, res) => {
  console.log('--- LOGIN ATTEMPT RECEIVED ---');
  const { password, passkey, pin } = req.body || {};
  const providedSecret = password || passkey || pin;
  
  const adminPassword = (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim() !== '') 
    ? process.env.ADMIN_PASSWORD 
    : 'jblogistics@0987';

  if (providedSecret === adminPassword) {
    console.log('Authentication SUCCESS. Generating secure JWT session token.');
    const adminSessionToken = jwt.sign({ role: 'admin', email: 'admin@jblogisticsservices.com' }, JWT_SECRET, { expiresIn: '8h' });

    return res.status(200).json({ 
      success: true, 
      token: adminSessionToken,
      message: 'Authenticated successfully' 
    });
  }

  console.log('Authentication FAILED: Password mismatch');
  return res.status(401).json({ success: false, message: 'Invalid admin passcode. Access denied.' });
});

app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
      return res.status(200).json({ isAuthenticated: true });
    } catch {
      return res.status(200).json({ isAuthenticated: false });
    }
  }
  return res.status(200).json({ isAuthenticated: false });
});

app.post('/api/admin/logout', (req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// ADMIN DATA & MESSAGES ROUTES
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

// ==========================================
// ADMIN SHIPMENTS ROUTES
// ==========================================

app.get('/api/admin/shipments', requireAdminAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ success: false, message: 'Supabase credentials missing' });

  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.patch('/api/admin/shipments/:id', requireAdminAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ success: false, message: 'Supabase credentials missing' });

  const { id } = req.params;
  const { status } = req.body;

  try {
    const { error } = await supabase
      .from('shipments')
      .update({ status })
      .eq('id', id);

    if (error) return res.status(400).json({ success: false, message: error.message });
    return res.status(200).json({ success: true, message: 'Shipment updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==========================================
// ADMIN DRIVERS ROUTES
// ==========================================

app.get('/api/admin/drivers', requireAdminAuth, async (req, res) => {
  if (!supabase) return res.status(500).json({ success: false, message: 'Supabase credentials missing' });

  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*');

    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.status(200).json(data || []);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
// Bound to '0.0.0.0' to accept multi-host / all-network device connections
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running successfully on all hosts, port ${PORT}`);
});