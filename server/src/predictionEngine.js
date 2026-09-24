/**
 * PulseFlow Real-Time Wait Time & Clinical Triage Prediction Engine
 * Implements Emergency Severity Index (ESI) standard, provider velocity factors,
 * bed saturation multipliers, and manual clinical override prioritization.
 */

/**
 * Calculates priority score (1-100) based on ESI level, waiting time, vitals risk, and overrides
 */
export function calculatePriorityScore(patient, elapsedMinutes) {
  if (patient.isPriorityOverridden) {
    return patient.calculatedPriorityScore;
  }

  let baseScore = 0;
  switch (patient.esiLevel) {
    case 1:
      baseScore = 99; // Resuscitation (Immediate)
      break;
    case 2:
      baseScore = 85; // Emergent (<15m target)
      break;
    case 3:
      baseScore = 65; // Urgent (Multiple resources needed)
      break;
    case 4:
      baseScore = 45; // Less urgent (1 resource needed)
      break;
    case 5:
      baseScore = 25; // Non-urgent
      break;
    default:
      baseScore = 30;
  }

  // Starvation prevention: +0.3 points every 10 min waited (capped at +15 points)
  const waitBoost = Math.min(15, Math.floor(elapsedMinutes / 10) * 0.3);

  // Vital sign instability boost
  let vitalsRiskBoost = 0;
  if (patient.vitals) {
    const { oxygenSaturation, heartRate, bloodPressureSystolic, painScore } = patient.vitals;
    if (oxygenSaturation < 92) vitalsRiskBoost += 8;
    if (heartRate > 120 || heartRate < 50) vitalsRiskBoost += 5;
    if (bloodPressureSystolic > 180 || bloodPressureSystolic < 90) vitalsRiskBoost += 6;
    if (painScore >= 8) vitalsRiskBoost += 3;
  }

  return Math.min(100, Math.round(baseScore + waitBoost + vitalsRiskBoost));
}

/**
 * Predicts the estimated wait time in minutes for a patient
 */
export function predictWaitTimeForPatient(patient, queueAhead, department, activeProviders, roomBays) {
  if (patient.status === 'in_treatment' || patient.status === 'ready_for_discharge' || patient.status === 'discharged') {
    return { estimatedWaitMinutes: 0, trend: 'stable' };
  }

  if (patient.esiLevel === 1) {
    return { estimatedWaitMinutes: 0, trend: 'stable' };
  }

  // Active physician capacity
  const onDutyDocs = Math.max(1, activeProviders.filter(p => p.status === 'on_duty' && p.role.includes('Physician')).length);

  // Bed availability factor
  const totalBeds = Math.max(1, department.totalBeds);
  const occupiedBeds = department.occupiedBeds;
  const bedUtilization = Math.min(1.5, occupiedBeds / totalBeds);

  // Average time a doctor spends with a patient depending on acuity
  const serviceMinutesPerAcuity = {
    1: 45,
    2: 30,
    3: 20,
    4: 12,
    5: 8,
  };

  // Higher or equal priority waiting ahead
  const higherPriorityAhead = queueAhead.filter(
    other => 
      other.id !== patient.id &&
      ['checked_in', 'in_triage', 'triage_completed', 'waiting_for_bed'].includes(other.status) &&
      other.calculatedPriorityScore >= patient.calculatedPriorityScore
  );

  let workLoadMinutesAhead = 0;
  for (const item of higherPriorityAhead) {
    workLoadMinutesAhead += (serviceMinutesPerAcuity[item.esiLevel] || 15);
  }

  const effectiveProcessingRate = onDutyDocs * 0.85;
  let estimatedWait = Math.round(workLoadMinutesAhead / effectiveProcessingRate);

  if (bedUtilization > 0.85) {
    estimatedWait = Math.round(estimatedWait * (1 + (bedUtilization - 0.85) * 1.5));
  }

  const minimumWaitByEsi = {
    1: 0,
    2: 5,
    3: 15,
    4: 25,
    5: 35,
  };

  estimatedWait = Math.max(minimumWaitByEsi[patient.esiLevel], estimatedWait);

  if (patient.isPriorityOverridden && patient.calculatedPriorityScore >= 95) {
    estimatedWait = Math.min(5, estimatedWait);
  }

  let trend = 'stable';
  if (patient.estimatedWaitMinutes !== undefined && patient.estimatedWaitMinutes > 0) {
    const diff = estimatedWait - patient.estimatedWaitMinutes;
    if (diff > 4) trend = 'rising';
    else if (diff < -4) trend = 'falling';
  }

  return { estimatedWaitMinutes: estimatedWait, trend };
}

/**
 * Re-evaluates wait times and priority scores for all patients in a department
 */
export function recalculateDepartmentQueue(patients, department, providers, roomBays) {
  const now = Date.now();
  const deptPatients = patients.filter(p => p.departmentId === department.id && p.status !== 'discharged');

  // Step 1: Update priority scores
  const scoredPatients = deptPatients.map(patient => {
    const arrivalMs = new Date(patient.arrivalTime).getTime();
    const elapsedMinutes = Math.max(0, Math.floor((now - arrivalMs) / 60000));
    const newScore = calculatePriorityScore(patient, elapsedMinutes);
    return {
      ...patient,
      calculatedPriorityScore: newScore,
    };
  });

  // Step 2: Sort by priority score (descending), then arrival time (ascending)
  const sorted = [...scoredPatients].sort((a, b) => {
    if (b.calculatedPriorityScore !== a.calculatedPriorityScore) {
      return b.calculatedPriorityScore - a.calculatedPriorityScore;
    }
    return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
  });

  // Step 3: Compute wait times
  const activeDeptProviders = providers.filter(p => p.departmentId === department.id);
  const activeDeptRooms = roomBays.filter(r => r.departmentId === department.id);

  const updatedPatients = [];
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const ahead = sorted.slice(0, i);
    const { estimatedWaitMinutes, trend } = predictWaitTimeForPatient(
      current,
      ahead,
      department,
      activeDeptProviders,
      activeDeptRooms
    );

    updatedPatients.push({
      ...current,
      estimatedWaitMinutes,
      waitTrend: trend,
    });
  }

  return updatedPatients;
}
