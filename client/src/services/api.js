export async function fetchDepartments() {
  const res = await fetch('/api/departments');
  const json = await res.json();
  return json.data;
}

export async function updateDepartmentSettings(id, updates) {
  const res = await fetch(`/api/departments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to update department');
  return json.data;
}

export async function fetchQueue(params = {}) {
  const query = new URLSearchParams();
  if (params.role) query.set('role', params.role);
  if (params.departmentId) query.set('departmentId', params.departmentId);

  const res = await fetch(`/api/queue?${query.toString()}`);
  const json = await res.json();
  return json;
}

export async function checkInPatient(payload) {
  const res = await fetch('/api/queue/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to check in patient');
  return json.data;
}

export async function updatePatientStatus(patientId, payload) {
  const res = await fetch(`/api/queue/${patientId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to update patient status');
  return json.data;
}

export async function overridePatientPriority(patientId, payload) {
  const res = await fetch(`/api/queue/${patientId}/override-priority`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Priority override failed');
  return json.data;
}

export async function fetchPatientByToken(token) {
  const res = await fetch(`/api/patient/${encodeURIComponent(token)}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Patient ticket not found');
  return json.data;
}

export async function fetchProviders() {
  const res = await fetch('/api/providers');
  const json = await res.json();
  return json.data;
}

export async function fetchRooms() {
  const res = await fetch('/api/rooms');
  const json = await res.json();
  return json.data;
}

export async function fetchAnalytics() {
  const res = await fetch('/api/analytics');
  const json = await res.json();
  return json.data;
}

export async function fetchAuditLogs() {
  const res = await fetch('/api/audit-logs');
  const json = await res.json();
  return json.data;
}

export async function simulateArrival(type, departmentId) {
  const res = await fetch('/api/simulate-arrival', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, departmentId }),
  });
  return res.json();
}

export async function resetDatabase() {
  const res = await fetch('/api/reset-data', { method: 'POST' });
  return res.json();
}
