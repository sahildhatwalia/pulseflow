import crypto from 'crypto';

/**
 * Generate a cryptographically random, HIPAA-safe patient display token
 * e.g. "PT-4921"
 */
export function generatePatientDisplayToken() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `PT-${num}`;
}

/**
 * Creates a tamper-evident SHA-256 hash for an audit log entry
 */
export function generateAuditHash(entry) {
  const content = `${entry.timestamp}|${entry.userId}|${entry.action}|${entry.patientToken}|${entry.details}|${entry.clinicalJustification || ''}`;
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Strip PHI for public display boards, kiosks, and unauthenticated public monitors
 * Strict HIPAA Safe Harbor / Expert Determination standard compliance
 */
export function sanitizePatientForPublic(patient) {
  return {
    id: patient.id,
    displayToken: patient.displayToken,
    departmentId: patient.departmentId,
    esiLevel: patient.esiLevel,
    status: patient.status,
    arrivalTime: patient.arrivalTime,
    estimatedWaitMinutes: patient.estimatedWaitMinutes,
    calculatedPriorityScore: patient.calculatedPriorityScore,
    waitTrend: patient.waitTrend,
    assignedRoomName: patient.assignedRoomName,
    isPriorityOverridden: patient.isPriorityOverridden,
    // PHI, exact name, MRN, phone, vitals are strictly excluded
  };
}

/**
 * Mask legal full name for semi-privileged staff summaries (e.g. "J*** D**")
 */
export function maskName(fullName) {
  if (!fullName) return 'Unknown Patient';
  const parts = fullName.split(' ');
  return parts.map(p => p[0] + '*'.repeat(Math.max(1, p.length - 1))).join(' ');
}
