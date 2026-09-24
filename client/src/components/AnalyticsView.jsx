import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  ArrowDownRight, 
  Lightbulb, 
  Download 
} from 'lucide-react';
import { fetchAnalytics } from '../services/api.js';

export function AnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Analytics load error', err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm font-medium">Synthesizing clinical throughput metrics...</p>
      </div>
    );
  }

  const { kpis, departmentThroughput, hourlySurgeData, acuityDistribution } = data;
  const maxArrivals = Math.max(...hourlySurgeData.map(h => h.arrivals));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Hospital Throughput & Resource Allocation Analytics</span>
            </h2>
            <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-0.5 rounded font-mono border border-indigo-200 dark:border-indigo-800 font-semibold">
              Executive Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data-driven clinical efficiency metrics, length of stay (LOS), left-without-being-seen (LWBS) rate, and predictive staffing models.
          </p>
        </div>

        <button
          onClick={() => alert('Exporting HIPAA-compliant de-identified throughput summary (CSV)...')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors self-start md:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Export Analytics Report</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm transition-colors">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Door-to-Doctor</div>
          <div className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            {kpis.averageDoorToDoctor} <span className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">min</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5 font-semibold">
            <ArrowDownRight className="w-3 h-3" />
            <span>-4m vs Benchmark</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm transition-colors">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Length of Stay</div>
          <div className="text-2xl font-extrabold font-mono text-teal-600 dark:text-cyan-400 mt-1">
            {kpis.averageLengthOfStay} <span className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">min</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
            Admit to discharge
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm transition-colors">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">LWBS Rate</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {kpis.lwbsRate}%
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            Benchmark: &lt;2.0%
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm transition-colors">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Treated Today</div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
            {kpis.totalPatientsTreated}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
            Across 4 Units
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm transition-colors">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bed Turnover</div>
          <div className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {kpis.bedTurnoverVelocity}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
            Patients / Bed / Day
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm transition-colors">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">HIPAA Audit Score</div>
          <div className="text-2xl font-extrabold font-mono text-teal-600 dark:text-teal-400 mt-1">
            {kpis.hipaaComplianceScore}%
          </div>
          <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-1 font-semibold">
            Zero Unlogged PHI
          </div>
        </div>
      </div>

      {/* Hourly Surge & Clearance Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Hourly Intake Influx vs Discharge Clearance</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visualizes arrival waves and identifies critical bottleneck hours.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
              <span className="w-3 h-3 rounded bg-indigo-500 inline-block"></span> New Arrivals
            </span>
            <span className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400">
              <span className="w-3 h-3 rounded bg-teal-500 inline-block"></span> Discharges
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> Avg Wait (min)
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="grid grid-cols-9 gap-2 pt-6 items-end h-64 border-b border-slate-200 dark:border-slate-800 pb-2">
          {hourlySurgeData.map((item, idx) => {
            const arrivalHeightPct = Math.round((item.arrivals / maxArrivals) * 100);
            const dischargeHeightPct = Math.round((item.discharges / maxArrivals) * 100);
            const isPeak = item.arrivals >= 25;

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                  {item.arrivals} arr / {item.discharges} dis
                </div>

                <div className="flex items-end gap-1 w-full max-w-[40px] h-48 justify-center">
                  <div
                    style={{ height: `${arrivalHeightPct}%` }}
                    className={`w-1/2 rounded-t transition-all ${
                      isPeak 
                        ? 'bg-gradient-to-t from-indigo-600 to-rose-500 shadow-sm shadow-rose-500/20' 
                        : 'bg-indigo-500/80 hover:bg-indigo-600'
                    }`}
                    title={`${item.hour}: ${item.arrivals} Arrivals`}
                  />

                  <div
                    style={{ height: `${dischargeHeightPct}%` }}
                    className="w-1/2 rounded-t bg-teal-500/80 hover:bg-teal-600 transition-all"
                    title={`${item.hour}: ${item.discharges} Discharges`}
                  />
                </div>

                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-2 font-semibold">
                  {item.hour}
                </div>
                <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {item.averageWait}m
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>Morning Shift (06:00 - 14:00)</span>
          <span className="font-bold text-amber-600 dark:text-amber-300">Peak Surge Influx Window (16:00 - 20:00)</span>
          <span>Night Stabilization (20:00 - 00:00)</span>
        </div>
      </div>

      {/* Middle Row: Department Throughput Table + Acuity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-transparent">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Department Throughput & SLA Benchmarks</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Door-to-doctor compliance and bed turnover rates</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-right">Patients Today</th>
                  <th className="px-4 py-3 text-right">Avg Door-to-MD</th>
                  <th className="px-4 py-3 text-right">Avg LOS</th>
                  <th className="px-4 py-3 text-right">Turnover</th>
                  <th className="px-4 py-3 text-right">Target Met</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {departmentThroughput.map(dept => (
                  <tr key={dept.departmentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-850">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {dept.name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-200">
                      {dept.totalPatientsToday}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-teal-700 dark:text-cyan-300 font-bold">
                      {dept.doorToDoctorAvg}m
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      {dept.lengthOfStayAvg}m
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      {dept.bedTurnoverRate}x
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                        {dept.targetMetPercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acuity Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4 transition-colors">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Acuity Distribution (ESI 1-5)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Current active queue volume and wait times</p>
          </div>

          <div className="space-y-3">
            {acuityDistribution.map(item => (
              <div key={item.esiLevel} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-300">{item.label}</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    <strong className="text-slate-900 dark:text-white">{item.count} pts</strong> • ~{item.averageWaitMinutes}m wait
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div
                    style={{
                      width: `${Math.min(100, item.count * 8)}%`,
                      backgroundColor: item.color,
                    }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prescriptive Resource Allocation Advisor */}
      <div className="bg-gradient-to-r from-indigo-50 via-teal-50 to-slate-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/50 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Predictive Resource Allocation & Staffing Advisor
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-indigo-200 dark:border-indigo-700/50 space-y-2 shadow-2xs">
            <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
              <span>Peak Shift Reallocation</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200 text-[10px] font-mono font-bold">High Priority</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Intake forecast predicts 28 arrivals between 18:00-20:00. Recommend shifting 1 Physician Assistant from Urgent Care to Main ED Fast-Track to prevent wait times exceeding 35 min.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
            <div className="font-bold text-teal-700 dark:text-teal-300 flex items-center justify-between">
              <span>Pediatric Wing Capacity</span>
              <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200 text-[10px] font-mono font-bold">Optimal</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Pediatric ED bed utilization is at 64% with 0 LWBS and 22 min average door-to-doctor time. Staffing levels are currently balanced with clinical load.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
            <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center justify-between">
              <span>Bed Turnover Velocity</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200 text-[10px] font-mono font-bold">Actionable</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Exam bays 3 and 6 undergoing sanitation. Expediting room turnaround by 6 minutes will increase ED hourly capacity by +3 patients during the 16:00 surge window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
