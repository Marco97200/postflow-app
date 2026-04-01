// ═══════════════════════════════════════════════════════════════
// PostFlow API Client — Real API calls to the Express backend
// ═══════════════════════════════════════════════════════════════

const API_BASE = '/api';

// ── LinkedIn ──
export const linkedinAuth = async () => {
  const res = await fetch(`${API_BASE}/linkedin/auth`, { credentials: 'include' });
  const data = await res.json();
  return data.url;
};

export const linkedinProfile = async () => {
  const res = await fetch(`${API_BASE}/linkedin/profile`, { credentials: 'include' });
  return res.json();
};

export const linkedinPublish = async (text, imageUrl = null) => {
  const res = await fetch(`${API_BASE}/linkedin/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ text, imageUrl }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur de publication');
  }
  return res.json();
};

export const linkedinDisconnect = async () => {
  await fetch(`${API_BASE}/linkedin/disconnect`, {
    method: 'POST',
    credentials: 'include',
  });
};

// ── AI Generation ──
export const generatePost = async (params) => {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur de génération');
  }
  return res.json();
};

// ── Pexels ──
export const searchPexels = async (query, page = 1) => {
  const res = await fetch(`${API_BASE}/pexels/search?query=${encodeURIComponent(query)}&page=${page}&per_page=15`);
  if (!res.ok) throw new Error('Erreur Pexels');
  return res.json();
};

// ── Teamtailor ──
export const fetchTeamtailorJobs = async () => {
  const res = await fetch(`${API_BASE}/teamtailor/jobs`);
  if (!res.ok) throw new Error('Erreur Teamtailor');
  return res.json();
};

// ── Auth ──
export const login = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur de connexion');
  return data;
};

export const logout = async () => {
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
};

export const getMe = async () => {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
  return res.json();
};

export const changePassword = async (newPassword) => {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

// ── Admin ──
export const getUsers = async () => {
  const res = await fetch(`${API_BASE}/admin/users`, { credentials: 'include' });
  if (!res.ok) throw new Error('Accès refusé');
  return res.json();
};

export const createUser = async (email, name, role = 'consultant') => {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, name, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur création');
  return data;
};

export const deleteUser = async (id) => {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur suppression');
  return data;
};

export const updateUser = async (id, updates) => {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur modification');
  return data;
};

export const resendInvite = async (id) => {
  const res = await fetch(`${API_BASE}/admin/users/${id}/resend-invite`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur renvoi');
  return data;
};

// ── Reset ──
export const resetData = async (resetUsers = true, resetActivity = true) => {
  const res = await fetch(`${API_BASE}/admin/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ resetUsers, resetActivity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur reset');
  return data;
};

// ── Activity ──
export const getActivityStats = async () => {
  const res = await fetch(`${API_BASE}/admin/activity/stats`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erreur stats');
  return res.json();
};

export const getActivity = async (userId = null, limit = 50) => {
  const params = new URLSearchParams({ limit });
  if (userId) params.set('userId', userId);
  const res = await fetch(`${API_BASE}/admin/activity?${params}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erreur activité');
  return res.json();
};

export const trackActivity = async (action, details = {}) => {
  try {
    await fetch(`${API_BASE}/activity/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action, details }),
    });
  } catch {}
};
