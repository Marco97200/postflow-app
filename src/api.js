// ═══════════════════════════════════════════════════════════════
// PostFlow API Client — Real API calls to the Express backend
// ═══════════════════════════════════════════════════════════════

const API_BASE = '/api';

// Helper: safely parse JSON response, detect HTML errors (Render cold start)
const safeJson = async (res) => {
  const contentType = res.headers.get('content-type') || '';

  // If content-type says JSON, parse it directly
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      throw new Error('Réponse JSON invalide du serveur');
    }
  }

  // Otherwise read as text and check
  const text = await res.text();

  // Detect HTML response (Render loading page or Express 404 fallback)
  if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
    throw new Error('Le serveur est en cours de démarrage, veuillez réessayer dans quelques secondes.');
  }

  // Try to parse as JSON anyway
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Réponse inattendue du serveur (${res.status})`);
  }
};

// Helper: fetch with auto-retry on cold start (HTML response)
const fetchWithRetry = async (url, options = {}, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);
    // Check if response is HTML (cold start)
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') && attempt < retries) {
      // Wait and retry — Render free tier is waking up
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }
    return res;
  }
  // Should not reach here, but return last attempt
  return fetch(url, options);
};

// ── LinkedIn ──
export const linkedinAuth = async () => {
  const res = await fetchWithRetry(`${API_BASE}/linkedin/auth`, { credentials: 'include' });
  const data = await safeJson(res);
  return data.url;
};

export const linkedinProfile = async () => {
  const res = await fetchWithRetry(`${API_BASE}/linkedin/profile`, { credentials: 'include' });
  return safeJson(res);
};

export const linkedinPublish = async (text, imageUrl = null) => {
  const res = await fetchWithRetry(`${API_BASE}/linkedin/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ text, imageUrl }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Erreur de publication');
  return data;
};

export const linkedinDisconnect = async () => {
  await fetchWithRetry(`${API_BASE}/linkedin/disconnect`, {
    method: 'POST',
    credentials: 'include',
  });
};

// ── AI Generation ──
export const generatePost = async (params) => {
  const res = await fetchWithRetry(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Erreur de génération');
  return data;
};

// ── Pexels ──
export const searchPexels = async (query, page = 1) => {
  const res = await fetchWithRetry(`${API_BASE}/pexels/search?query=${encodeURIComponent(query)}&page=${page}&per_page=15`);
  if (!res.ok) throw new Error('Erreur Pexels');
  return safeJson(res);
};

// ── Teamtailor ──
export const fetchTeamtailorJobs = async () => {
  const res = await fetchWithRetry(`${API_BASE}/teamtailor/jobs`);
  if (!res.ok) throw new Error('Erreur Teamtailor');
  return safeJson(res);
};

// ── Auth ──
export const login = async (email, password) => {
  const res = await fetchWithRetry(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Erreur de connexion');
  return data;
};

export const logout = async () => {
  await fetchWithRetry(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
};

export const getMe = async () => {
  const res = await fetchWithRetry(`${API_BASE}/auth/me`, { credentials: 'include' });
  return safeJson(res);
};

export const changePassword = async (newPassword) => {
  const res = await fetchWithRetry(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ newPassword }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

// ── Admin ──
export const getUsers = async () => {
  const res = await fetchWithRetry(`${API_BASE}/admin/users`, { credentials: 'include' });
  if (!res.ok) throw new Error('Accès refusé');
  return safeJson(res);
};

export const createUser = async (email, name, role = 'consultant') => {
  const res = await fetchWithRetry(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, name, role }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Erreur création');
  return data;
};

export const deleteUser = async (id) => {
  const res = await fetchWithRetry(`${API_BASE}/admin/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Erreur suppression');
  return data;
};

export const updateUser = async (id, updates) => {
  const res = await fetchWithRetry(`${API_BASE}/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Erreur modification');
  return data;
};

export const resendInvite = async (id) => {
  const res = await fetchWithRetry(`${API_BASE}/admin/users/${id}/resend-invite`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Erreur renvoi');
  return data;
};

// ── Reset ──
export const resetData = async (resetUsers = true, resetActivity = true) => {
  const res = await fetchWithRetry(`${API_BASE}/admin/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ resetUsers, resetActivity }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Erreur reset');
  return data;
};

// ── Activity ──
export const getActivityStats = async () => {
  const res = await fetchWithRetry(`${API_BASE}/admin/activity/stats`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erreur stats');
  return safeJson(res);
};

export const getActivity = async (userId = null, limit = 50) => {
  const params = new URLSearchParams({ limit });
  if (userId) params.set('userId', userId);
  const res = await fetchWithRetry(`${API_BASE}/admin/activity?${params}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erreur activité');
  return safeJson(res);
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

// ── Scheduled Posts ──
export const getScheduledPosts = async (status = null) => {
  const params = status ? `?status=${status}` : '';
  const res = await fetchWithRetry(`${API_BASE}/scheduled-posts${params}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erreur chargement publications programmées');
  return safeJson(res);
};

export const createScheduledPost = async (post) => {
  const res = await fetchWithRetry(`${API_BASE}/scheduled-posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(post),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Erreur création publication');
  return data;
};

export const updateScheduledPost = async (id, updates) => {
  const res = await fetchWithRetry(`${API_BASE}/scheduled-posts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Erreur modification publication');
  return data;
};

export const deleteScheduledPost = async (id) => {
  const res = await fetchWithRetry(`${API_BASE}/scheduled-posts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Erreur suppression publication');
  return data;
};
