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

/* ════════════════════════════════════════════════════════════════════
   USER DATABASE (JSON file-based for simplicity)
   ════════════════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════════════════
   ACTIVITY TRACKING
   ════════════════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════════════════
   AUTH MIDDLEWARE
   ════════════════════════════════════════════════════════════════════ */
const requireAuth = (req, res, next) => {
  const sessionId = req.cookies.postflow_session;
  if (!sessionId || !sessionStore.has(sessionId)) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  req.user = sessionStore.get(sessionId);
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

/* ════════════════════════════════════════════════════════════════════
   AUTH ROUTES
   ════════════════════════════════════════════════════════════════════ */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  usersDB = loadUsers();
  const user = usersDB.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });
  if (user.status === 'disabled') return res.status(403).json({ error: 'Compte désactivé' });
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
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });

  usersDB = loadUsers();
  const user = usersDB.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

  user.password = hashPassword(newPassword);
  user.mustChangePassword = false;
  saveUsers(usersDB);
  res.json({ success: true });
});

/* ════════════════════════════════════════════════════════════════════
   ADMIN — USER MANAGEMENT
   ════════════════════════════════════════════════════════════════════ */
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
    return res.status(409).json({ error: 'Cet email est déjà utilisé' });
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
  if (idx === -1) return res.status(404).json({ error: 'Utilisateur non trouvé' });
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
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

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
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

  const tempPassword = randomBytes(4).toString('hex');
  user.password = hashPassword(tempPassword);
  user.mustChangePassword = true;
  saveUsers(usersDB);

  let emailSent = false;
  try { emailSent = await sendInvitationEmail(user, tempPassword); } catch(e) { console.error('Email error:', e); }
  res.json({ success: true, tempPassword, emailSent });
});

/* ════════════════════════════════════════════════════════════════════
   ADMIN — RESET DATA (clean slate)
   ════════════════════════════════════════════════════════════════════ */
app.post('/api/admin/reset', requireAuth, requireAdmin, (req, res) => {
  const { resetUsers, resetActivity } = req.body;

  if (resetActivity !== false) {
    saveActivity([]);
  }

  if (resetUsers !== false) {
    const currentAdmin = usersDB.find(u => u.id === req.user?.id);
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

  tokenStore.clear();
  const currentSessionId = req.cookies?.postflow_session;
  for (const [sid] of sessionStore) {
    if (sid !== currentSessionId) sessionStore.delete(sid);
  }

  console.log('Database reset performed by admin');
  res.json({ success: true, message: 'Données réinitialisées avec succès' });
});

/* ════════════════════════════════════════════════════════════════════
   ADMIN — ACTIVITY TRACKING API
   ════════════════════════════════════════════════════════════════════ */
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
  if (!allowed.includes(action)) return res.status(400).json({ error: 'Action non autorisée' });
  logActivity(req.user.id, req.user.name, action, details || {});
  res.json({ success: true });
});

/* ════════════════════════════════════════════════════════════════════
   EMAIL — INVITATION WITH TUTORIAL
   ════════════════════════════════════════════════════════════════════ */
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
    console.log('⚠️  No email config — invitation not sent. Temp password:', tempPassword);
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
      <span style="font-size:28px;">⚡</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;">Bienvenue sur PostFlow</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">by Talentys RH</p>
  </div>

  <!-- Main Content -->
  <div style="background:#fff;padding:32px 24px;border-left:1px solid #e2e5f0;border-right:1px solid #e2e5f0;">
    <p style="color:#1a1d2e;font-size:16px;margin:0 0 16px;">Bonjour <strong>${user.name}</strong>,</p>
    <p style="color:#5c5f7e;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Marco Beauzile vous invite à rejoindre <strong>PostFlow</strong>, l'outil de gestion et de publication LinkedIn de Talentys RH.
      Votre compte a été créé et est prêt à utiliser !
    </p>

    <!-- Credentials Box -->
    <div style="background:#f8f9fc;border:1px solid #e2e5f0;border-radius:12px;padding:20px;margin:0 0 24px;">
      <h3 style="color:#1a1d2e;font-size:14px;margin:0 0 12px;font-weight:700;">🔑 Vos identifiants de connexion</h3>
      <table style="width:100%;font-size:14px;">
        <tr><td style="color:#5c5f7e;padding:4px 0;">Email :</td><td style="color:#1a1d2e;font-weight:600;">${user.email}</td></tr>
        <tr><td style="color:#5c5f7e;padding:4px 0;">Mot de passe temporaire :</td><td style="color:#6366f1;font-weight:700;font-family:monospace;font-size:16px;">${tempPassword}</td></tr>
      </table>
      <p style="color:#ef4444;font-size:12px;margin:12px 0 0;">⚠️ Vous devrez changer votre mot de passe lors de votre première connexion.</p>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin:0 0 32px;">
      <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 15px rgba(99,102,241,0.3);">
        Se connecter à PostFlow →
      </a>
    </div>

    <!-- Tutorial Section -->
    <div style="border-top:1px solid #e2e5f0;padding-top:24px;">
      <h2 style="color:#1a1d2e;font-size:18px;margin:0 0 16px;font-weight:800;">📖 Guide de démarrage rapide</h2>

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
            En bas à gauche de l'écran, cliquez sur <strong>"Non connecté"</strong> puis <strong>"Se connecter avec LinkedIn"</strong>.
            Autorisez PostFlow à publier en votre nom. C'est sécurisé via OAuth 2.0 — nous ne voyons jamais votre mot de passe LinkedIn.
          </p>
        </div>
      </div>

      <!-- Step 3 -->
      <div style="display:flex;gap:12px;margin:0 0 20px;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="color:#fff;font-weight:800;font-size:16px;">3</span>
        </div>
        <div>
          <h4 style="color:#1a1d2e;margin:0 0 4px;font-size:14px;">Créez votre premier post</h4>
          <p style="color:#5c5f7e;font-size:13px;margin:0;line-height:1.5;">
            Cliquez sur <strong>"Créer un post"</strong> dans le menu. Choisissez une catégorie (offre d'emploi, conseil RH, etc.), sélectionnez le ton souhaité, puis cliquez sur <strong>"Générer"</strong>.
            Vous pouvez modifier le texte, ajouter une image Pexels et prévisualiser le résultat.
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
            Retrouvez toutes vos publications planifiées dans l'onglet <strong>Calendrier</strong>.
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
            L'onglet <strong>Templates</strong> contient 20 modèles prêts à l'emploi : offres d'emploi, conseils RH, témoignages, prospection…
            Cliquez sur un template pour l'utiliser comme base de votre publication.
          </p>
        </div>
      </div>

      <!-- Tips Box -->
      <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:12px;padding:16px;margin:20px 0 0;">
        <h4 style="color:#4f46e5;font-size:13px;margin:0 0 8px;">💡 Astuces pour des posts LinkedIn performants</h4>
        <ul style="color:#5c5f7e;font-size:13px;margin:0;padding-left:16px;line-height:1.8;">
          <li>Postez idéalement entre <strong>8h et 10h</strong> du matin (heure locale)</li>
          <li>Les mardis et jeudis ont le meilleur engagement</li>
          <li>Ajoutez toujours une <strong>image</strong> — les posts avec visuels obtiennent 2x plus de vues</li>
          <li>Terminez par une <strong>question ouverte</strong> pour encourager les commentaires</li>
          <li>Utilisez 3 à 5 hashtags maximum, pas plus</li>
          <li>Objectif : <strong>3 posts par semaine</strong> pour une visibilité optimale</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#f8f9fc;border-radius:0 0 16px 16px;padding:20px 24px;text-align:center;border:1px solid #e2e5f0;border-top:none;">
    <p style="color:#9496b0;font-size:12px;margin:0;">
      PostFlow by Talentys RH — Cabinet de recrutement spécialisé Outre-Mer<br>
      Martinique • Guadeloupe • Guyane • Réunion • Mayotte<br><br>
      Des questions ? Contactez Marco : <a href="mailto:marc.beauzile@mobilite-rh-outremer.net" style="color:#6366f1;">marc.beauzile@mobilite-rh-outremer.net</a>
    </p>
  </div>

</div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: user.email,
    subject: '🚀 Bienvenue sur PostFlow — Votre compte est prêt !',
    html,
  });

  console.log(`✅ Invitation email sent to ${user.email}`);
  return true;
};

/* ════════════════════════════════════════════════════════════════════
   LINKEDIN OAuth 2.0
   ════════════════════════════════════════════════════════════════════ */

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
app.post('/api/linkedin/publish', async (req, res) => {
  const userId = req.cookies.linkedin_user;
  if (!userId || !tokenStore.has(userId)) {
    return res.status(401).json({ error: 'Non connecté à LinkedIn' });
  }

  const { access_token, profile } = tokenStore.get(userId);
  const { text, imageUrl } = req.body;

  try {
    const postBody = {
      author: `urn:li:person:${profile.id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: imageUrl ? 'ARTICLE' : 'NONE',
          ...(imageUrl && {
            media: [{
              status: 'READY',
              originalUrl: imageUrl,
              description: { text: 'Publication PostFlow by Talentys RH' },
            }],
          }),
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

    // Track activity — find auth user from session
    const sessId = req.cookies.postflow_session;
    const sessUser = sessId && sessionStore.has(sessId) ? sessionStore.get(sessId) : null;
    logActivity(sessUser?.id || userId, sessUser?.name || 'Unknown', 'publish_linkedin', { textLength: text?.length, hasImage: !!imageUrl });

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

/* ════════════════════════════════════════════════════════════════════
   PEXELS API
   ════════════════════════════════════════════════════════════════════ */

app.get('/api/pexels/search', async (req, res) => {
  const { query, page = 1, per_page = 15 } = req.query;

  if (!process.env.PEXELS_API_KEY) {
    return res.status(500).json({ error: 'Clé API Pexels non configurée' });
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

/* ════════════════════════════════════════════════════════════════════
   TEAMTAILOR — Fetch real jobs from career site
   ════════════════════════════════════════════════════════════════════ */

app.get('/api/teamtailor/jobs', async (req, res) => {
  try {
    // Fetch the Teamtailor jobs feed (JSON API)
    const response = await axios.get('https://jobs.talentysrh.com/jobs', {
      headers: { Accept: 'application/json' },
      timeout: 10000,
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
          location: j.location || j.city || 'Non précisé',
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
              location: item.jobLocation?.address?.addressLocality || 'Non précisé',
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
          const innerText = match[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/&middot;/g, '\u00B7').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/&nbsp;/g, ' ').trim();
          const url = rawUrl.startsWith('http') ? rawUrl : `https://jobs.talentysrh.com${rawUrl}`;
          const parts = innerText.split(/\s*·\s*/);
          const titlePart = (parts[0] || '').trim();
          const locationPart = (parts[parts.length - 1] || '').trim();
          const deptPart = parts.length > 2 ? parts[1].trim() : (parts.length > 1 ? parts[1].trim() : '');
          if (!seen.has(jobId) && titlePart.length > 3) {
            seen.add(jobId);
            jobs.push({
              id: parseInt(jobId),
              title: titlePart,
              location: parts.length > 1 ? locationPart : 'Non précisé',
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

/* ════════════════════════════════════════════════════════════════════
   SERVE FRONTEND IN PRODUCTION
   ════════════════════════════════════════════════════════════════════ */

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '..', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n  🚀 PostFlow API server running on http://localhost:${PORT}`);
  console.log(`  📡 LinkedIn OAuth:  ${process.env.LINKEDIN_CLIENT_ID ? '✅ Configured' : '⚠️  Missing LINKEDIN_CLIENT_ID'}`);
  console.log(`  🖼️  Pexels API:     ${process.env.PEXELS_API_KEY ? '✅ Configured' : '⚠️  Missing PEXELS_API_KEY'}`);
  console.log(`  🌐 Frontend URL:   ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});
