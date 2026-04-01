import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createHash, randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';
const DB_PATH = join(__dirname, 'data', 'users.json');
const ACTIVITY_PATH = join(__dirname, 'data', 'activity.json');

app.use(cors({
  origin: IS_PROD ? true : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Trust proxy in production (Render.com uses reverse proxy)
if (IS_PROD) app.set('trust proxy', 1);

// In-memory token store (production: use a real DB or session store)
const tokenStore = new Map();

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   USER DATABASE (JSON file-based for simplicity)
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
const hashPassword = (pwd) => createHash('sha256').update(pwd + 'postflow-salt-2026').digest('hex');

const loadUsers = () => {
  try {
    if (existsSync(DB_PATH)) return JSON.parse(readFileSync(DB_PATH, 'utf8'));
  } catch {}
  return [];
};

const saveUsers = (users) => {
  const dir = join(__dirname, 'data');
  if (!existsSync(dir)) { mkdirSync(dir, { recursive: true }); }
  try { writeFileSync(DB_PATH, JSON.stringify(users, null, 2)); } catch(e) { console.error('DB write error:', e); }
};

// Initialize with admin user if DB is empty
const initDB = () => {
  let users = loadUsers();
  if (users.length === 0) {
    users = [{
      id: 'admin-001',
      email: 'marc.beauzile@mobilite-rh-outremer.net',
      name: 'Marco B.',
      role: 'admin',
      password: hashPassword('admin2026'),
      status: 'active',
      createdAt: new Date().toISOString(),
    }];
    saveUsers(users);
  }
  return users;
};

let usersDB = initDB();
const sessionStore = new Map();

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   ACTIVITY TRACKING
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
const loadActivity = () => {
  try { if (existsSync(ACTIVITY_PATH)) return JSON.parse(readFileSync(ACTIVITY_PATH, 'utf8')); } catch {}
  return [];
};

const saveActivity = (logs) => {
  const dir = join(__dirname, 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  // Keep only last 1000 entries
  const trimmed = logs.slice(-1000);
  try { writeFileSync(ACTIVITY_PATH, JSON.stringify(trimmed, null, 2)); } catch(e) { console.error('Activity write error:', e); }
};

const logActivity = (userId, userName, action, details = {}) => {
  const logs = loadActivity();
  logs.push({
    id: randomBytes(8).toString('hex'),
    userId,
    userName,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
  saveActivity(logs);
};

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   AUTH MIDDLEWARE
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
const requireAuth = (req, res, next) => {
  const sessionId = req.cookies.postflow_session;
  if (!sessionId || !sessionStore.has(sessionId)) {
    return res.status(401).json({ error: 'Non authentifiÃ©' });
  }
  req.user = sessionStore.get(sessionId);
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'AccÃ¨s rÃ©servÃ© aux administrateurs' });
  }
  next();
};

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   AUTH ROUTES
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  usersDB = loadUsers();
  const user = usersDB.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });
  if (user.status === 'disabled') return res.status(403).json({ error: 'Compte dÃ©sactivÃ©' });
  if (user.password !== hashPassword(password)) return res.status(401).json({ error: 'Identifiants incorrects' });

  const sessionId = randomBytes(32).toString('hex');
  const sessionData = { id: user.id, email: user.email, name: user.name, role: user.role };
  sessionStore.set(sessionId, sessionData);

  // Check if user needs to change password (first login with temp password)
  const mustChangePassword = user.mustChangePassword || false;

  res.cookie('postflow_session', sessionId, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000, sameSite: 'lax', secure: IS_PROD });
  logActivity(user.id, user.name, 'login', { email: user.email });
  res.json({ success: true, user: sessionData, mustChangePassword });
});

app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.cookies.postflow_session;
  if (sessionId) sessionStore.delete(sessionId);
  res.clearCookie('postflow_session');
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  const sessionId = req.cookies.postflow_session;
  if (!sessionId || !sessionStore.has(sessionId)) return res.json({ authenticated: false });
  res.json({ authenticated: true, user: sessionStore.get(sessionId) });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractÃ¨res' });

  usersDB = loadUsers();
  const user = usersDB.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvÃ©' });

  user.password = hashPassword(newPassword);
  user.mustChangePassword = false;
  saveUsers(usersDB);
  res.json({ success: true });
});

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   ADMIN â USER MANAGEMENT
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  usersDB = loadUsers();
  const safeUsers = usersDB.map(({ password, ...u }) => u);
  res.json({ users: safeUsers });
});

app.post('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  const { email, name, role = 'consultant' } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'Email et nom requis' });

  usersDB = loadUsers();
  if (usersDB.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Cet email est dÃ©jÃ  utilisÃ©' });
  }

  const tempPassword = randomBytes(4).toString('hex');
  const newUser = {
    id: 'user-' + randomBytes(6).toString('hex'),
    email: email.toLowerCase().trim(),
    name: name.trim(),
    role,
    password: hashPassword(tempPassword),
    status: 'active',
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  };

  usersDB.push(newUser);
  saveUsers(usersDB);

  // Send invitation email
  let emailSent = false;
  try {
    emailSent = await sendInvitationEmail(newUser, tempPassword);
  } catch (e) {
    console.error('Email error:', e.message);
  }

  const { password: _, ...safeUser } = newUser;
  logActivity(req.user.id, req.user.name, 'create_user', { newUser: newUser.email, role: newUser.role });
  res.json({ user: safeUser, tempPassword, emailSent });
});

app.delete('/api/admin/users/:id', requireAuth, requireAdmin, (req, res) => {
  usersDB = loadUsers();
  const idx = usersDB.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Utilisateur non trouvÃ©' });
  if (usersDB[idx].role === 'admin' && usersDB.filter(u => u.role === 'admin').length <= 1) {
    return res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' });
  }
  const removed = usersDB.splice(idx, 1)[0];
  saveUsers(usersDB);
  res.json({ success: true, removed: removed.email });
});

app.patch('/api/admin/users/:id', requireAuth, requireAdmin, (req, res) => {
  usersDB = loadUsers();
  const user = usersDB.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvÃ©' });

  const { name, role, status } = req.body;
  if (name) user.name = name.trim();
  if (role && ['admin', 'consultant'].includes(role)) user.role = role;
  if (status && ['active', 'disabled'].includes(status)) user.status = status;
  saveUsers(usersDB);

  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.post('/api/admin/users/:id/resend-invite', requireAuth, requireAdmin, async (req, res) => {
  usersDB = loadUsers();
  const user = usersDB.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvÃ©' });

  const tempPassword = randomBytes(4).toString('hex');
  user.password = hashPassword(tempPassword);
  user.mustChangePassword = true;
  saveUsers(usersDB);

  let emailSent = false;
  try { emailSent = await sendInvitationEmail(user, tempPassword); } catch(e) { console.error('Email error:', e); }
  res.json({ success: true, tempPassword, emailSent });
});

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   ADMIN â RESET DATA (clean slate)
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
app.post('/api/admin/reset', requireAuth, requireAdmin, (req, res) => {
  const { resetUsers, resetActivity } = req.body;

  if (resetActivity !== false) {
    // Clear all activity logs
    saveActivity([]);
  }

  if (resetUsers !== false) {
    // Reset users: keep only the current admin, reset all others
    const currentAdmin = usersDB.find(u => u.id === req.session?.userId);
    const freshAdmin = {
      id: 'admin-001',
      email: currentAdmin?.email || 'marc.beauzile@mobilite-rh-outremer.net',
      name: currentAdmin?.name || 'Marco B.',
      role: 'admin',
      password: currentAdmin?.password || hashPassword('admin2026'),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    usersDB = [freshAdmin];
    saveUsers(usersDB);
  }

  // Clear LinkedIn tokens
  tokenStore.clear();
  // Clear all sessions except current
  const currentSessionId = req.cookies?.postflow_session;
  for (const [sid] of sessionStore) {
    if (sid !== currentSessionId) sessionStore.delete(sid);
  }

  console.log('ð Database reset performed by admin');
  res.json({ success: true, message: 'DonnÃ©es rÃ©initialisÃ©es avec succÃ¨s' });
});

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   ADMIN â ACTIVITY TRACKING API
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
app.get('/api/admin/activity', requireAuth, requireAdmin, (req, res) => {
  const { userId, limit = 100 } = req.query;
  let logs = loadActivity();
  if (userId) logs = logs.filter(l => l.userId === userId);
  logs = logs.slice(-parseInt(limit)).reverse(); // Most recent first
  res.json({ activity: logs });
});

app.get('/api/admin/activity/stats', requireAuth, requireAdmin, (req, res) => {
  const logs = loadActivity();
  const users = loadUsers();

  const stats = users.map(user => {
    const userLogs = logs.filter(l => l.userId === user.id);
    const logins = userLogs.filter(l => l.action === 'login');
    const publications = userLogs.filter(l => l.action === 'publish_linkedin');
    const lastLogin = logins.length > 0 ? logins[logins.length - 1].timestamp : null;
    const lastActivity = userLogs.length > 0 ? userLogs[userLogs.length - 1].timestamp : null;

    // Activity last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const recentLogs = userLogs.filter(l => l.timestamp > sevenDaysAgo);

    return {
      userId: user.id,
      userName: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      totalLogins: logins.length,
      totalPublications: publications.length,
      totalActions: userLogs.length,
      lastLogin,
      lastActivity,
      actionsLast7Days: recentLogs.length,
      publicationsLast7Days: recentLogs.filter(l => l.action === 'publish_linkedin').length,
    };
  });

  res.json({ stats });
});

// Also track post generation and scheduling from frontend
app.post('/api/activity/track', requireAuth, (req, res) => {
  const { action, details } = req.body;
  const allowed = ['generate_post', 'schedule_post', 'use_template', 'search_pexels', 'copy_post', 'upload_image', 'publish_linkedin'];
  if (!allowed.includes(action)) return res.status(400).json({ error: 'Action non autorisÃ©e' });
  logActivity(req.user.id, req.user.name, action, details || {});
  res.json({ success: true });
});

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   EMAIL â INVITATION WITH TUTORIAL
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
const getMailTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Fallback: Gmail
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  return null;
};

const sendInvitationEmail = async (user, tempPassword) => {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.log('â ï¸  No email config â invitation not sent. Temp password:', tempPassword);
    return false;
  }

  const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  const fromName = process.env.SMTP_FROM_NAME || 'PostFlow by Talentys RH';
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@talentysrh.com';

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
    <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
      <span style="font-size:28px;">â¡</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;">Bienvenue sur PostFlow</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">by Talentys RH</p>
  </div>

  <!-- Main Content -->
  <div style="background:#fff;padding:32px 24px;border-left:1px solid #e2e5f0;border-right:1px solid #e2e5f0;">
    <p style="color:#1a1d2e;font-size:16px;margin:0 0 16px;">Bonjour <strong>${user.name}</strong>,</p>
    <p style="color:#5c5f7e;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Marco Beauzile vous invite Ã  rejoindre <strong>PostFlow</strong>, l'outil de gestion et de publication LinkedIn de Talentys RH.
      Votre compte a Ã©tÃ© crÃ©Ã© et est prÃªt Ã  utiliser !
    </p>

    <!-- Credentials Box -->
    <div style="background:#f8f9fc;border:1px solid #e2e5f0;border-radius:12px;padding:20px;margin:0 0 24px;">
      <h3 style="color:#1a1d2e;font-size:14px;margin:0 0 12px;font-weight:700;">ð Vos identifiants de connexion</h3>
      <table style="width:100%;font-size:14px;">
        <tr><td style="color:#5c5f7e;padding:4px 0;">Email :</td><td style="color:#1a1d2e;font-weight:600;">${user.email}</td></tr>
        <tr><td style="color:#5c5f7e;padding:4px 0;">Mot de passe temporaire :</td><td style="color:#6366f1;font-weight:700;font-family:monospace;font-size:16px;">${tempPassword}</td></tr>
      </table>
      <p style="color:#ef4444;font-size:12px;margin:12px 0 0;">â ï¸ Vous devrez changer votre mot de passe lors de votre premiÃ¨re connexion.</p>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin:0 0 32px;">
      <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 15px rgba(99,102,241,0.3);">
        Se connecter Ã  PostFlow â
      </a>
    </div>

    <!-- Tutorial Section -->
    <div style="border-top:1px solid #e2e5f0;padding-top:24px;">
      <h2 style="color:#1a1d2e;font-size:18px;margin:0 0 16px;font-weight:800;">ð Guide de dÃ©marrage rapide</h2>

      <!-- Step 1 -->
      <div style="display:flex;gap:12px;margin:0 0 20px;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="color:#fff;font-weight:800;font-size:16px;">1</span>
        </div>
        <div>
          <h4 style="color:#1a1d2e;margin:0 0 4px;font-size:14px;">Connectez-vous</h4>
          <p style="color:#5c5f7e;font-size:13px;margin:0;line-height:1.5;">
            Rendez-vous sur <a href="${appUrl}" style="color:#6366f1;">${appUrl}</a>, entrez votre email et le mot de passe temporaire ci-dessus.
            Choisissez ensuite votre nouveau mot de passe personnel.
          </p>
        </div>
      </div>

      <!-- Step 2 -->
      <div style="display:flex;gap:12px;margin:0 0 20px;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="color:#fff;font-weight:800;font-size:16px;">2</span>
        </div>
        <div>
          <h4 style="color:#1a1d2e;margin:0 0 4px;font-size:14px;">Liez votre compte LinkedIn</h4>
          <p style="color:#5c5f7e;font-size:13px;margin:0;line-height:1.5;">
            En bas Ã  gauche de l'Ã©cran, cliquez sur <strong>"Non connectÃ©"</strong> puis <strong>"Se connecter avec LinkedIn"</strong>.
            Autorisez PostFlow Ã  publier en votre nom. C'est sÃ©curisÃ© via OAuth 2.0 â nous ne voyons jamais votre mot de passe LinkedIn.
          </p>
        </div>
      </div>

      <!-- Step 3 -->
      <div style="display:flex;gap:12px;margin:0 0 20px;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="color:#fff;font-weight:800;font-size:16px;">3</span>
        </div>
        <div>
          <h4 style="color:#1a1d2e;margin:0 0 4px;font-size:14px;">CrÃ©ez votre premier post</h4>
          <p style="color:#5c5f7e;font-size:13px;margin:0;line-height:1.5;">
            Cliquez sur <strong>"CrÃ©er un post"</strong> dans le menu. Choisissez une catÃ©gorie (offre d'emploi, conseil RH, etc.), sÃ©lectionnez le ton souhaitÃ©, puis cliquez sur <strong>"GÃ©nÃ©rer"</strong>.
            Vous pouvez modifier le texte, ajouter une image Pexels et prÃ©visualiser le rÃ©sultat.
          </p>
        </div>
      </div>

      <!-- Step 4 -->
      <div style="display:flex;gap:12px;margin:0 0 20px;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="color:#fff;font-weight:800;font-size:16px;">4</span>
        </div>
        <div>
          <h4 style="color:#1a1d2e;margin:0 0 4px;font-size:14px;">Publiez ou programmez</h4>
          <p style="color:#5c5f7e;font-size:13px;margin:0;line-height:1.5;">
            Deux options : <strong>"Publier maintenant"</strong> pour poster directement sur LinkedIn, ou <strong>"Programmer"</strong> pour choisir une date et heure.
            Retrouvez toutes vos publications planifiÃ©es dans l'onglet <strong>Calendrier</strong>.
          </p>
        </div>
      </div>

      <!-- Step 5 -->
      <div style="display:flex;gap:12px;margin:0 0 20px;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="color:#fff;font-weight:800;font-size:16px;">5</span>
        </div>
        <div>
          <h4 style="color:#1a1d2e;margin:0 0 4px;font-size:14px;">Explorez les Templates</h4>
          <p style="color:#5c5f7e;font-size:13px;margin:0;line-height:1.5;">
            L'onglet <strong>Templates</strong> contient 20 modÃ¨les prÃªts Ã  l'emploi : offres d'emploi, conseils RH, tÃ©moignages, prospectionâ¦
            Cliquez sur un template pour l'utiliser comme base de votre publication.
          </p>
        </div>
      </div>

      <!-- Tips Box -->
      <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:12px;padding:16px;margin:20px 0 0;">
        <h4 style="color:#4f46e5;font-size:13px;margin:0 0 8px;">ð¡ Astuces pour des posts LinkedIn performants</h4>
        <ul style="color:#5c5f7e;font-size:13px;margin:0;padding-left:16px;line-height:1.8;">
          <li>Postez idÃ©alement entre <strong>8h et 10h</strong> du matin (heure locale)</li>
          <li>Les mardis et jeudis ont le meilleur engagement</li>
          <li>Ajoutez toujours une <strong>image</strong> â les posts avec visuels obtiennent 2x plus de vues</li>
          <li>Terminez par une <strong>question ouverte</strong> pour encourager les commentaires</li>
          <li>Utilisez 3 Ã  5 hashtags maximum, pas plus</li>
          <li>Objectif : <strong>3 posts par semaine</strong> pour une visibilitÃ© optimale</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#f8f9fc;border-radius:0 0 16px 16px;padding:20px 24px;text-align:center;border:1px solid #e2e5f0;border-top:none;">
    <p style="color:#9496b0;font-size:12px;margin:0;">
      PostFlow by Talentys RH â Cabinet de recrutement spÃ©cialisÃ© Outre-Mer<br>
      Martinique â¢ Guadeloupe â¢ Guyane â¢ RÃ©union â¢ Mayotte<br><br>
      Des questions ? Contactez Marco : <a href="mailto:marc.beauzile@mobilite-rh-outremer.net" style="color:#6366f1;">marc.beauzile@mobilite-rh-outremer.net</a>
    </p>
  </div>

</div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: user.email,
    subject: 'ð Bienvenue sur PostFlow â Votre compte est prÃªt !',
    html,
  });

  console.log(`â Invitation email sent to ${user.email}`);
  return true;
};

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   LINKEDIN OAuth 2.0
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

// Step 1: Redirect user to LinkedIn authorization page
app.get('/api/linkedin/auth', (req, res) => {
  const state = Math.random().toString(36).substring(2, 15);
  const scopes = 'openid profile email w_member_social';
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}&state=${state}&scope=${encodeURIComponent(scopes)}`;

  res.cookie('linkedin_state', state, { httpOnly: true, maxAge: 600000, sameSite: 'lax', secure: IS_PROD });
  res.json({ url: authUrl });
});

// Step 2: Handle OAuth callback from LinkedIn
app.get('/api/linkedin/callback', async (req, res) => {
  const { code, state } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!code) {
    return res.redirect(`${frontendUrl}?linkedin_error=no_code`);
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, expires_in } = tokenResponse.data;

    // Get user profile via OpenID userinfo
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = profileResponse.data;
    const userId = profile.sub;

    // Store token
    tokenStore.set(userId, {
      access_token,
      expires_at: Date.now() + expires_in * 1000,
      profile: {
        id: userId,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      },
    });

    // Set a session cookie
    res.cookie('linkedin_user', userId, { httpOnly: true, maxAge: expires_in * 1000, sameSite: 'lax', secure: IS_PROD });

    // Redirect back to frontend
    // Track LinkedIn connection
    const sessId2 = req.cookies.postflow_session;
    const sessUser2 = sessId2 && sessionStore.has(sessId2) ? sessionStore.get(sessId2) : null;
    logActivity(sessUser2?.id || userId, sessUser2?.name || profile.name, 'connect_linkedin', { linkedinName: profile.name });

    res.redirect(`${frontendUrl}?linkedin_connected=true`);
  } catch (error) {
    console.error('LinkedIn OAuth error:', error.response?.data || error.message);
    res.redirect(`${frontendUrl}?linkedin_error=auth_failed`);
  }
});

// Get current LinkedIn profile
app.get('/api/linkedin/profile', (req, res) => {
  const userId = req.cookies.linkedin_user;
  if (!userId || !tokenStore.has(userId)) {
    return res.json({ connected: false });
  }
  const data = tokenStore.get(userId);
  if (Date.now() > data.expires_at) {
    tokenStore.delete(userId);
    return res.json({ connected: false, reason: 'token_expired' });
  }
  res.json({ connected: true, profile: data.profile });
});

// Publish a post to LinkedIn
// Helper: upload image to LinkedIn and return asset URN
async function uploadImageToLinkedIn(access_token, personId, imageBuffer) {
  // Step 1: Register upload
  const registerBody = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner: `urn:li:person:${personId}`,
      serviceRelationships: [{
        relationshipType: 'OWNER',
        identifier: 'urn:li:userGeneratedContent',
      }],
    },
  };

  const registerRes = await axios.post(
    'https://api.linkedin.com/v2/assets?action=registerUpload',
    registerBody,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const uploadUrl = registerRes.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = registerRes.data.value.asset;

  // Step 2: Upload binary image
  await axios.put(uploadUrl, imageBuffer, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/octet-stream',
      'Content-Length': imageBuffer.length,
    },
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 10 * 1024 * 1024,
  });

  return asset; // e.g. "urn:li:digitalmediaAsset:D5622..."
}

// Helper: get image buffer from URL or base64 data URI
async function getImageBuffer(imageUrl) {
  if (imageUrl.startsWith('data:')) {
    // Base64 data URI (uploaded image)
    const base64Data = imageUrl.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  } else {
    // Remote URL (Pexels, etc.) â download it
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
    });
    return Buffer.from(response.data);
  }
}

app.post('/api/linkedin/publish', async (req, res) => {
  const userId = req.cookies.linkedin_user;
  if (!userId || !tokenStore.has(userId)) {
    return res.status(401).json({ error: 'Non connectÃ© Ã  LinkedIn' });
  }

  const { access_token, profile } = tokenStore.get(userId);
  const { text, imageUrl } = req.body;

  try {
    let shareMediaCategory = 'NONE';
    let media = undefined;

    // If we have an image, upload it to LinkedIn first
    if (imageUrl) {
      try {
        console.log('Uploading image to LinkedIn...');
        const imageBuffer = await getImageBuffer(imageUrl);
        const assetUrn = await uploadImageToLinkedIn(access_token, profile.id, imageBuffer);
        console.log('Image uploaded, asset:', assetUrn);

        shareMediaCategory = 'IMAGE';
        media = [{
          status: 'READY',
          media: assetUrn,
          description: { text: 'Publication PostFlow by Talentys RH' },
        }];
      } catch (imgErr) {
        console.error('Image upload failed, publishing without image:', imgErr.message);
        // Fall back to text-only post if image upload fails
      }
    }

    const postBody = {
      author: `urn:li:person:${profile.id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory,
          ...(media && { media }),
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', postBody, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    // Track activity
    const sessId = req.cookies.postflow_session;
    const sessUser = sessId && sessionStore.has(sessId) ? sessionStore.get(sessId) : null;
    logActivity(sessUser?.id || userId, sessUser?.name || 'Unknown', 'publish_linkedin', { textLength: text?.length, hasImage: !!imageUrl, imageUploaded: shareMediaCategory === 'IMAGE' });

    res.json({ success: true, postId: response.data.id });
  } catch (error) {
    console.error('LinkedIn publish error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Erreur lors de la publication',
      details: error.response?.data?.message || error.message,
    });
  }
});

// Disconnect LinkedIn
app.post('/api/linkedin/disconnect', (req, res) => {
  const userId = req.cookies.linkedin_user;
  if (userId) {
    tokenStore.delete(userId);
    res.clearCookie('linkedin_user');
  }
  res.json({ success: true });
});

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   PEXELS API
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

app.get('/api/pexels/search', async (req, res) => {
  const { query, page = 1, per_page = 15 } = req.query;

  if (!process.env.PEXELS_API_KEY) {
    return res.status(500).json({ error: 'ClÃ© API Pexels non configurÃ©e' });
  }

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: { query, page, per_page, locale: 'fr-FR' },
      headers: { Authorization: process.env.PEXELS_API_KEY },
    });

    const photos = response.data.photos.map(p => ({
      id: p.id,
      src: p.src.medium,
      srcLarge: p.src.large,
      alt: p.alt || p.url,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
      width: p.width,
      height: p.height,
    }));

    res.json({ photos, totalResults: response.data.total_results, page: response.data.page });
  } catch (error) {
    console.error('Pexels error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erreur Pexels', details: error.message });
  }
});

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   AI POST GENERATION â Claude Opus 4.6 via Anthropic API
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

const LINKEDIN_EXPERT_PROMPT = `Tu es un ghostwriter LinkedIn d'Ã©lite, spÃ©cialisÃ© dans le personal branding B2B et la gÃ©nÃ©ration d'engagement organique. Tu rÃ©diges pour Marco Beauzile, fondateur de Talentys RH, cabinet de recrutement spÃ©cialisÃ© Outre-Mer (Martinique, Guadeloupe, Guyane, RÃ©union, Mayotte).

RÃGLES DE RÃDACTION ABSOLUES :
1. ACCROCHE IRRÃSISTIBLE (1Ã¨re ligne) â C'est elle qui dÃ©cide si le post sera lu. Provoque la curiositÃ©, utilise une stat percutante, une question rhÃ©torique, une affirmation contre-intuitive ou un storytelling immÃ©diat. JAMAIS de emoji en premiÃ¨re ligne. La premiÃ¨re ligne doit donner envie de cliquer "voir plus".
2. STRUCTURE AÃRÃE â Sauts de ligne frÃ©quents. Maximum 2-3 lignes par paragraphe. Le scroll doit Ãªtre fluide sur mobile.
3. TON HUMAIN ET AUTHENTIQUE â Ãcris comme quelqu'un qui parle Ã  son rÃ©seau, pas comme un communiquÃ© corporate. Ose la 1Ã¨re personne, les anecdotes, les convictions fortes.
4. VALEUR CONCRÃTE â Chaque post doit apporter quelque chose : un insight, un chiffre, une mÃ©thode, un retour d'expÃ©rience. Pas de platitudes.
5. ENGAGEMENT NATIF â Termine par un Ã©lÃ©ment qui gÃ©nÃ¨re des rÃ©actions : question ouverte, sondage implicite, appel au partage d'expÃ©rience, prise de position qui invite au dÃ©bat.
6. ZÃRO LIEN EXTERNE dans le corps du post (LinkedIn pÃ©nalise les liens). Si CTA, utilise "DM ouvert" ou "commentez".
7. HASHTAGS STRATÃGIQUES â 3 Ã  5 max, pertinents, en fin de post. Mix de hashtags populaires et niches.
8. LONGUEUR OPTIMALE â Entre 800 et 1500 caractÃ¨res. Assez long pour apporter de la valeur, assez court pour Ãªtre lu en entier.
9. EMOJIS AVEC PARCIMONIE â 2-4 max par post, jamais en dÃ©but de ligne systÃ©matique. Utilise-les comme ponctuations visuelles, pas comme dÃ©coration.
10. PAS DE FORMAT LISTE SYSTÃMATIQUE â Varie entre storytelling, opinion tranchÃ©e, retour d'expÃ©rience, question, thread mini, analyse.

EXPERTISE DE MARCO :
- 10+ ans dans le recrutement en Outre-Mer
- RÃ©seau de +2000 contacts qualifiÃ©s dans les DOM
- SpÃ©cialiste du recrutement de cadres et profils pÃ©nuriques en territoires ultramarins
- Connaissance intime du tissu Ã©conomique de chaque territoire
- Approche : recrutement par approche directe + rÃ©seau diaspora

OBJECTIF DE CHAQUE POST : Maximiser l'engagement (likes, commentaires, partages, enregistrements) tout en positionnant Marco comme LA rÃ©fÃ©rence recrutement Outre-Mer.`;

app.post('/api/generate', requireAuth, async (req, res) => {
  const { topic, tone, category, includeHashtags, includeCTA, jobInfo } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ClÃ© API Anthropic non configurÃ©e. Ajoutez ANTHROPIC_API_KEY dans les variables d\'environnement.' });
  }

  const toneInstructions = {
    professional: "Ton professionnel et expert. Inspirant confiance et crÃ©dibilitÃ©. Vocabulaire prÃ©cis, structure claire.",
    inspiring: "Ton inspirant et motivant. Storytelling Ã©motionnel, exemples qui font rÃ©flÃ©chir. Donne envie d'agir.",
    storytelling: "Format storytelling pur. Raconte une histoire (vraie ou rÃ©aliste) avec un arc narratif : situation â tension â rÃ©solution â leÃ§on. Le lecteur doit se sentir transportÃ©.",
    educational: "Ton Ã©ducatif et pÃ©dagogique. Partage un savoir-faire, une mÃ©thode, des chiffres. Le lecteur doit repartir avec quelque chose de concret et applicable.",
    casual: "Ton dÃ©contractÃ© et authentique. Comme une conversation entre pros autour d'un cafÃ©. Humour fin bienvenu, proximitÃ©, franc-parler.",
    engaging: "Ton provocateur (bienveillant) et engageant. Prends position, challenge les idÃ©es reÃ§ues, pose des questions qui font dÃ©bat. Objectif : faire rÃ©agir dans les commentaires.",
  };

  const categoryContext = {
    job_offer: "Publication pour promouvoir une offre d'emploi en cours. Objectif : attirer les candidats et encourager le partage.",
    promo_services: "Promotion des services de Talentys RH. Objectif : dÃ©montrer l'expertise et gÃ©nÃ©rer des leads.",
    prospection: "Contenu de prospection B2B ciblant les dirigeants et DRH. Objectif : identifier et attirer des clients potentiels.",
    employer_brand: "Contenu marque employeur. Objectif : aider les entreprises Ã  comprendre l'importance de leur image employeur.",
    hr_news: "Analyse d'actualitÃ© RH. Objectif : positionner Marco comme expert et gÃ©nÃ©rer du dÃ©bat.",
    consultant: "Partage de la vie de consultant en recrutement. Objectif : humaniser la marque et crÃ©er de la proximitÃ©.",
    outremer: "Focus sur l'Ã©conomie et l'emploi en Outre-Mer. Objectif : valoriser les territoires et attirer l'attention.",
    testimony: "TÃ©moignage ou success story. Objectif : prouver par l'exemple et inspirer confiance.",
    motivation: "Post motivationnel et inspirant. Objectif : fÃ©dÃ©rer la communautÃ© et gÃ©nÃ©rer de l'engagement Ã©motionnel.",
    case_study: "Ãtude de cas recrutement. Objectif : dÃ©montrer la mÃ©thode et le ROI concret.",
  };

  const userPrompt = jobInfo
    ? `RÃ©dige une publication LinkedIn pour promouvoir cette offre d'emploi :\n- Poste : ${jobInfo.title}\n- Localisation : ${jobInfo.location}\n- DÃ©partement : ${jobInfo.department}\n- Lien : ${jobInfo.url}\n\nTon : ${toneInstructions[tone] || toneInstructions.professional}\n\nContexte catÃ©gorie : ${categoryContext.job_offer}\n\n${includeCTA ? 'Inclus un call-to-action fort en fin de post (pas de lien, invite au DM ou commentaire).' : 'Pas de call-to-action explicite.'}\n${includeHashtags ? 'Termine par 3-5 hashtags stratÃ©giques.' : 'Pas de hashtags.'}`
    : `RÃ©dige une publication LinkedIn sur le sujet suivant : "${topic}"\n\nTon : ${toneInstructions[tone] || toneInstructions.professional}\n\nContexte catÃ©gorie : ${categoryContext[category] || ''}\n\n${includeCTA ? 'Inclus un call-to-action fort en fin de post (pas de lien, invite au DM ou commentaire).' : 'Pas de call-to-action explicite.'}\n${includeHashtags ? 'Termine par 3-5 hashtags stratÃ©giques.' : 'Pas de hashtags.'}\n\nIMPORTANT : Ãcris UNIQUEMENT le texte du post LinkedIn, rien d'autre. Pas d'introduction, pas d'explication, pas de guillemets autour du post.`;

  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      system: LINKEDIN_EXPERT_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const generatedText = response.data.content[0].text.trim();

    // Track activity
    logActivity(req.user.id, req.user.name, 'generate_post', { category, tone, topic, model: 'claude-opus-4-6', aiGenerated: true });

    res.json({ content: generatedText, model: 'claude-opus-4-6' });
  } catch (error) {
    console.error('AI generation error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Erreur de gÃ©nÃ©ration IA',
      details: error.response?.data?.error?.message || error.message,
    });
  }
});

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   TEAMTAILOR â Fetch real jobs from career site
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

app.get('/api/teamtailor/jobs', async (req, res) => {
  try {
    // Fetch the Teamtailor jobs feed (force no-cache for fresh data)
    const response = await axios.get('https://jobs.talentysrh.com/jobs', {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (compatible; PostFlow/1.0)',
      },
      timeout: 15000,
    });

    // Teamtailor exposes a JSON-LD or HTML page; let's try to parse the embed API
    // Their public API endpoint is usually at /connect/jobs
    let jobs = [];

    try {
      // Try the Teamtailor Connect API format
      const connectResponse = await axios.get('https://jobs.talentysrh.com/connect/jobs', {
        timeout: 10000,
      });

      if (Array.isArray(connectResponse.data)) {
        jobs = connectResponse.data.map(j => ({
          id: j.id,
          title: j.title,
          location: j.location || j.city || 'Non prÃ©cisÃ©',
          department: j.department || '',
          url: j.url || `https://jobs.talentysrh.com/jobs/${j.id}`,
          createdAt: j.created_at || j.createdAt,
        }));
      }
    } catch {
      // Fallback: parse HTML page to extract job listings
      const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

      // Try to find JSON-LD or embedded job data
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          if (jsonLd.itemListElement) {
            jobs = jsonLd.itemListElement.map((item, i) => ({
              id: i + 1,
              title: item.name || item.title,
              location: item.jobLocation?.address?.addressLocality || 'Non prÃ©cisÃ©',
              department: item.industry || '',
              url: item.url || '',
            }));
          }
        } catch {}
      }

      // Try parsing job links from HTML (absolute or relative URLs)
      if (jobs.length === 0) {
        const jobRegex = /href="((?:https?:\/\/jobs\.talentysrh\.com)?\/jobs\/(\d+)-[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        let match;
        const seen = new Set();
        while ((match = jobRegex.exec(html)) !== null) {
          const rawUrl = match[1];
          const jobId = match[2];
          const innerText = match[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/&middot;/g, 'Â·').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/&nbsp;/g, ' ').trim();
          const url = rawUrl.startsWith('http') ? rawUrl : `https://jobs.talentysrh.com${rawUrl}`;
          // Parse "Title  Department Â· Location" pattern
          const parts = innerText.split(/\s*Â·\s*/);
          const titlePart = (parts[0] || '').trim();
          const locationPart = (parts[parts.length - 1] || '').trim();
          const deptPart = parts.length > 2 ? parts[1].trim() : (parts.length > 1 ? parts[1].trim() : '');
          if (!seen.has(jobId) && titlePart.length > 3) {
            seen.add(jobId);
            jobs.push({
              id: parseInt(jobId),
              title: titlePart,
              location: parts.length > 1 ? locationPart : 'Non prÃ©cisÃ©',
              department: parts.length > 2 ? deptPart : (parts.length > 1 ? locationPart : ''),
              url,
            });
          }
        }
      }
    }

    res.json({ jobs, count: jobs.length, fetchedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Teamtailor error:', error.message);
    res.status(500).json({ error: 'Erreur Teamtailor', details: error.message });
  }
});

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
   SERVE FRONTEND IN PRODUCTION
   ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '..', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n  ð PostFlow API server running on http://localhost:${PORT}`);
  console.log(`  ð¡ LinkedIn OAuth:  ${process.env.LINKEDIN_CLIENT_ID ? 'â Configured' : 'â ï¸  Missing LINKEDIN_CLIENT_ID'}`);
  console.log(`  ð¼ï¸  Pexels API:     ${process.env.PEXELS_API_KEY ? 'â Configured' : 'â ï¸  M
