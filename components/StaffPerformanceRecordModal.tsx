import React, { useState } from 'react';
import type { StaffPerformanceRecord, Staff, StaffKpi, PerformanceRecordStatus, Line, ProductionEntry, InLineAudit, EndLineCheck, Order, DailyLinePlan, NonConformanceReport, Employee } from '../types';
import { XIcon } from './IconComponents';

interface AllData {
    currentUser: Staff;
    lines: Line[];
    staff: Staff[];
    employees: Employee[];
    staffPerformanceRecords: StaffPerformanceRecord[];
    staffKpis: StaffKpi[];
    productionEntries: ProductionEntry[];
    inLineAudits: InLineAudit[];
    endLineChecks: EndLineCheck[];
    orders: Order[];
    dailyLinePlans: DailyLinePlan[];
    nonConformanceReports: NonConformanceReport[];
}

interface StaffPerformanceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: StaffPerformanceRecord) => void;
  record: StaffPerformanceRecord;
  allData: AllData;
}

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
);

export const StaffPerformanceRecordModal = ({ isOpen, onClose, onSave, record, allData }: StaffPerformanceRecordModalProps) => {
  const { currentUser, staff, staffKpis } = allData;
  const [currentRecord, setCurrentRecord] = useState(record);
  
  const staffMember = staff.find(s => s.id === record.staffId);

  const myKpis = staffKpis.filter(k => k.role === staffMember?.role);

  // Check user permissions for editing fields
  const isSelf = currentUser.id === record.staffId;
  const isSupervisor = (currentUser.role === 'Supervisor' || currentUser.role === 'Production Manager' || currentUser.role === 'Admin');
  
  const canEditSelfRating = isSelf && (record.status === 'Pending Self-Rating' || record.status === 'Rejected');
  const canEditSupervisorReview = isSupervisor && (record.status === 'Pending Supervisor Approval' || record.status === 'Pending Manager Approval');

  const handleChange = (field: keyof StaffPerformanceRecord, value: any) => {
    setCurrentRecord(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCapaChange = (field: 'reasonForShortfall' | 'actionPlan' | 'dueDate', value: string) => {
    setCurrentRecord(prev => ({
        ...prev,
        capa: { ...(prev.capa || { reasonForShortfall: '', actionPlan: '', dueDate: ''}), [field]: value }
    }));
  };

  const handleSubmit = (newStatus: PerformanceRecordStatus) => {
    let finalRecord = { ...currentRecord, status: newStatus, lastUpdated: new Date().toISOString() };
    if (newStatus === 'Pending Supervisor Approval') {
        // Self-submission logic
    }
    if (newStatus === 'Approved' || newStatus === 'Rejected') {
        finalRecord.supervisorId = currentUser.id;
        finalRecord.supervisorActionDate = new Date().toISOString();
    }
    onSave(finalRecord);
  };
  
  if (!isOpen || !staffMember) return null;
  
  const getOverallPerformance = () => {
      let score = 0;
      let totalWeight = 0;
      myKpis.forEach(kpi => {
        const value = record.autoMetrics[kpi.id] || 0;
        if(kpi.target > 0) { // Avoid division by zero
            // For 'Down is good' KPIs, higher value is worse. Invert the performance score.
            const isDownGood = (kpi.kpi.toLowerCase().includes('cost') || kpi.kpi.toLowerCase().includes('downtime'));
            const performanceRatio = isDownGood ? kpi.target / (value || 1) : value / kpi.target;
            score += performanceRatio * kpi.weight;
        }
        totalWeight += kpi.weight;
      });
      return totalWeight > 0 ? (score / totalWeight) * 100 : 100; // Default to 100 if no weighted KPIs
  }

  const requiresCapa = getOverallPerformance() < 90; // CAPA if overall score is below 90%

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex-shrink-0 p-4 border-b dark:border-slate-700 flex justify-between items-center">
            <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Performance Review: {staffMember.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Date: {record.date}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-6 h-6"/></button>
        </header>
        
        <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
            {/* Left Column: Data & CAPA */}
            <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Key Performance Indicators (Auto-Tracked)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {myKpis.filter(k=>k.source === 'Automatic').map(kpi => {
                            const value = record.autoMetrics[kpi.id] || 0;
                            const isDownGood = (kpi.kpi.toLowerCase().includes('cost') || kpi.kpi.toLowerCase().includes('downtime'));
                            const isBelowThreshold = isDownGood ? value > kpi.threshold : value < kpi.threshold;
                            const performanceRatio = Math.min(100, isDownGood ? (kpi.target / (value || 1)) * 100 : (value / kpi.target) * 100);
                            const thresholdRatio = (kpi.threshold / kpi.target) * 100;

                            return (
                                <div key={kpi.id} className={`p-3 rounded-lg border ${isBelowThreshold ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'}`}>
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate" title={kpi.kpi}>{kpi.kpi}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">T: {kpi.target}{kpi.unit === 'currency' ? '' : kpi.unit}</p>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                        {kpi.unit === 'currency' && '₹'}{value.toLocaleString(undefined, {maximumFractionDigits: 2})}{kpi.unit !== 'currency' && kpi.unit}
                                    </p>
                                     <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 relative mt-1" title={`Value: ${value} | Threshold: ${kpi.threshold} | Target: ${kpi.target}`}>
                                        <div className="bg-slate-300 dark:bg-slate-500 h-2.5 rounded-l-full" style={{ width: `${isDownGood ? 100 - thresholdRatio : thresholdRatio}%` }}></div>
                                        <div className={`absolute top-0 left-0 h-2.5 rounded-full ${isBelowThreshold ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${performanceRatio}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {requiresCapa && (
                    <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                        <h3 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">Corrective Action Plan (CAPA) Required</h3>
                        <div className="space-y-2">
                            <textarea value={currentRecord.capa?.reasonForShortfall || ''} onChange={e => handleCapaChange('reasonForShortfall', e.target.value)} placeholder="Reason for shortfall..." rows={2} className="w-full p-2 text-sm border-amber-300 rounded" disabled={!canEditSelfRating}/>
                            <textarea value={currentRecord.capa?.actionPlan || ''} onChange={e => handleCapaChange('actionPlan', e.target.value)} placeholder="Corrective action plan..." rows={3} className="w-full p-2 text-sm border-amber-300 rounded" disabled={!canEditSelfRating}/>
                             <input type="date" value={currentRecord.capa?.dueDate || ''} onChange={e => handleCapaChange('dueDate', e.target.value)} className="w-full p-2 text-sm border-amber-300 rounded" disabled={!canEditSelfRating}/>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Right Column: Reviews */}
            <div className="md:col-span-1 space-y-4">
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Self-Rating & Comments</h3>
                    <div className="flex items-center justify-center gap-2 my-3">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} type="button" onClick={() => canEditSelfRating && handleChange('selfRating', star)} disabled={!canEditSelfRating} className="text-3xl text-amber-400 disabled:text-slate-300">
                                {star <= (currentRecord.selfRating || 0) ? '★' : '☆'}
                            </button>
                        ))}
                    </div>
                    <textarea value={currentRecord.selfComments} onChange={e => handleChange('selfComments', e.target.value)} placeholder="Enter self-comments..." rows={4} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 rounded" disabled={!canEditSelfRating} />
                     {canEditSelfRating && (
                        <button onClick={() => handleSubmit('Pending Supervisor Approval')} className="mt-2 w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md text-sm">Submit for Review</button>
                    )}
                </div>

                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Supervisor's Review</h3>
                    {record.supervisorId && <p className="text-xs text-slate-500">By: {staff.find(s=>s.id === record.supervisorId)?.name}</p>}
                    <textarea value={currentRecord.supervisorComments || ''} onChange={e => handleChange('supervisorComments', e.target.value)} placeholder="Supervisor comments..." rows={4} className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 rounded mt-2" disabled={!canEditSupervisorReview} />
                    {canEditSupervisorReview && (
                        <div className="mt-2 flex gap-2">
                           <button onClick={() => handleSubmit('Rejected')} className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-md text-sm">Reject</button>
                           <button onClick={() => handleSubmit('Approved')} className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md text-sm">Approve</button>
                        </div>
                    )}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};