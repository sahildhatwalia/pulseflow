const getAuthHeader = () => {
  const token = localStorage.getItem('pulseflow_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('pulseflow_token');
    localStorage.removeItem('pulseflow_user');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }
  const json = await res.json();
  if (!json.success && !json.data) throw new Error(json.error || 'API request failed');
  return json.data || json;
};

export async function fetchDepartments() {
  const res = await fetch('/api/departments', { headers: { ...getAuthHeader() } });
  return handleResponse(res);
}

export async function updateDepartmentSettings(id, updates) {
  const res = await fetch(`/api/departments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ updates }),
  });
  return handleResponse(res);
}

export async function fetchQueue(params = {}) {
  const query = new URLSearchParams();
  if (params.role) query.set('role', params.role);
  if (params.departmentId) query.set('departmentId', params.departmentId);

  const res = await fetch(`/api/queue?${query.toString()}`, { headers: { ...getAuthHeader() } });
  return handleResponse(res);
}

export async function checkInPatient(payload) {
  const res = await fetch('/api/queue/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updatePatientStatus(patientId, payload) {
  const res = await fetch(`/api/queue/${patientId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function overridePatientPriority(patientId, payload) {
  const res = await fetch(`/api/queue/${patientId}/override-priority`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function fetchPatientByToken(token) {
  const res = await fetch(`/api/patient/${encodeURIComponent(token)}`, { headers: { ...getAuthHeader() } });
  return handleResponse(res);
}

export async function fetchProviders() {
  const res = await fetch('/api/providers', { headers: { ...getAuthHeader() } });
  return handleResponse(res);
}

export async function fetchRooms() {
  const res = await fetch('/api/rooms', { headers: { ...getAuthHeader() } });
  return handleResponse(res);
}

export async function fetchAnalytics() {
  const res = await fetch('/api/analytics', { headers: { ...getAuthHeader() } });
  return handleResponse(res);
}

export async function fetchAuditLogs() {
  const res = await fetch('/api/audit-logs', { headers: { ...getAuthHeader() } });
  return handleResponse(res);
}

export async function simulateArrival(type, departmentId) {
  const res = await fetch('/api/simulate-arrival', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ type, departmentId }),
  });
  return handleResponse(res);
}

export async function resetDatabase() {
  const res = await fetch('/api/reset-data', { method: 'POST', headers: { ...getAuthHeader() } });
  return handleResponse(res);
}

export async function loginUser(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Login failed');
  localStorage.setItem('pulseflow_token', json.data.token);
  localStorage.setItem('pulseflow_user', JSON.stringify(json.data.user));
  return json.data;
}

export async function registerUser(userData) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Registration failed');
  localStorage.setItem('pulseflow_token', json.data.token);
  localStorage.setItem('pulseflow_user', JSON.stringify(json.data.user));
  return json.data;
}

export function logoutUser() {
  localStorage.removeItem('pulseflow_token');
  localStorage.removeItem('pulseflow_user');
  window.location.href = '/login';
}
