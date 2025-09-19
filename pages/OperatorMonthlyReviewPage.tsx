import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, Staff, OperatorMonthlyReview, DailyAttendance, ProductionEntry, InLineAudit, EndLineCheck, Style, Operation, GamificationSettings, LevelDefinition, KpiSetting, OperatorGrade, Machine } from '../types';
// FIX: Import icons from IconComponents file
import { ArrowLeftIcon, StarIcon, AwardIcon } from '../components/IconComponents';
import { DonutChart } from '../components/DonutChart';
import { CoinIcon } from '../components/GamificationIcons';


interface OperatorMonthlyReviewPageProps {
  context: { employeeId: string, monthYear: string };
  allData: {
    employees: Employee[];
    staff: Staff[];
    operatorGrades: OperatorGrade[];
    machines: Machine[];
    operatorMonthlyReviews: OperatorMonthlyReview[];
    dailyAttendances: DailyAttendance[];
    productionEntries: ProductionEntry[];
    inLineAudits: InLineAudit[];
    endLineChecks: EndLineCheck[];
    styles: Style[];
    operations: Operation[];
    gamificationSettings: GamificationSettings;
    levelDefinitions: LevelDefinition[];
    kpiSettings: KpiSetting[];
  };
  currentUser: Staff;
  onSave: (review: OperatorMonthlyReview) => void;
  onBack: () => void;
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const KpiRadialChart = ({ title, value, kpi, format = 'percent', totalPointsData }: { title: string, value: number, kpi?: KpiSetting, format?: 'percent' | 'number', totalPointsData?: { progress: number } }) => {
    const isPointsChart = title === "Total Points" && totalPointsData;
    const displayPercentage = isPointsChart ? totalPointsData.progress : Math.min(value, 100);
    
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (displayPercentage / 100) * circumference;

    const getColor = () => {
        if (isPointsChart) return '#8b5cf6'; // purple-500
        if (!kpi) return '#4f46e5'; // indigo-600
        if (kpi.direction === 'Up') {
            if (value >= kpi.targetStretch) return '#16a34a'; // green-600
            if (value >= kpi.targetStart) return '#f59e0b'; // amber-500
            return '#dc2626'; // red-600
        } else { // Down is good
            if (value <= kpi.targetStretch) return '#16a34a';
            if (value <= kpi.targetStart) return '#f59e0b';
            return '#dc2626';
        }
    };
    const color = getColor();

    return (
        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center flex flex-col items-center justify-center h-full">
            <div className="relative w-24 h-24">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} stroke="#e5e7eb" strokeWidth="10" fill="transparent" />
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke={color}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    {format === 'percent' ? (
                        <span className="text-3xl font-bold" style={{ color }}>
                            {value.toFixed(0)}<span className="text-xl">%</span>
                        </span>
                    ) : (
                         <span className="text-2xl font-bold" style={{ color }}>
                            {Math.round(value).toLocaleString()}
                        </span>
                    )}
                </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold truncate">{title}</div>
        </div>
    );
};


const InfoCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-slate-50 dark:bg-slate-800 p-4 rounded-lg h-full ${className || ''}`}>
        {children}
    </div>
);

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
);


const OperatorMonthlyReviewPage = ({ context, allData, currentUser, onSave, onBack }: OperatorMonthlyReviewPageProps) => {
  const { employeeId, monthYear } = context;
  const { employees = [], staff = [], operatorMonthlyReviews = [], dailyAttendances = [], productionEntries = [], inLineAudits = [], endLineChecks = [], styles = [], operations = [], gamificationSettings, levelDefinitions = [], operatorGrades = [], machines = [], kpiSettings = [] } = allData;

  const employee = useMemo(() => employees.find(e => e.id === employeeId), [employeeId, employees]);
  const review = useMemo(() => operatorMonthlyReviews.find(r => r.id === `${employeeId}-${monthYear}`), [employeeId, monthYear, operatorMonthlyReviews]);
  
  const [supervisorComments, setSupervisorComments] = useState('');
  const [managerComments, setManagerComments] = useState('');
  
  useEffect(() => {
    setSupervisorComments(review?.supervisorComments || '');
    setManagerComments(review?.managerComments || '');
  }, [review]);

  const [year, month] = useMemo(() => {
    if (!monthYear) {
        const today = new Date();
        return [today.getFullYear(), today.getMonth()];
    }
    const [y, m] = monthYear.split('-');
    return [parseInt(y, 10), parseInt(m, 10) - 1];
  }, [monthYear]);
  
  const stylesMap = useMemo(() => new Map(styles.map(s => [s.id, s])), [styles]);
  const machinesMap = useMemo(() => new Map(machines.map(m => [m.id, m.name])), [machines]);
  const operationsMap = useMemo(() => new Map(operations.map(o => [o.id, o.name])), [operations]);
  
  const efficiencyKpi = useMemo(() => kpiSettings.find(k => k.kpi === 'Average Line Efficiency'), [kpiSettings]);
  const rftKpi = useMemo(() => kpiSettings.find(k => k.kpi === 'RFT%'), [kpiSettings]);

  const monthlySummaryData = useMemo(() => {
      if(!employee) return null;
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const empProdEntries = (productionEntries || []).filter(p => p.employeeId === employee.id && new Date(p.timestamp) >= startDate && new Date(p.timestamp) <= endDate);
      const uniqueHoursWorked = new Set(empProdEntries.map(p => `${p.timestamp.split('T')[0]}-${p.hourCounter}`)).size;
      const totalSmvProduced = empProdEntries.reduce((sum, entry) => {
        const style = stylesMap.get(entry.styleNumber);
        const op = style?.operationBulletin?.find(ob => ob.operationId === entry.operation);
        const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
        return sum + (smv * entry.productionQuantity);
      }, 0);
      const efficiency = uniqueHoursWorked > 0 ? (totalSmvProduced / (uniqueHoursWorked * 60)) * 100 : 0;

      const totalUnits = empProdEntries.reduce((sum, p) => sum + p.productionQuantity, 0);
      const totalDefects = (endLineChecks || []).filter(c => c.responsibleEmpId === employee.id && new Date(c.timestamp) >= startDate && new Date(c.timestamp) <= endDate).length;
      const rft = totalUnits > 0 ? ((totalUnits - totalDefects) / totalUnits) * 100 : 100;

      const presentDays = (dailyAttendances || []).filter(d => new Date(d.date) >= startDate && new Date(d.date) <= endDate && d.presentEmployeeIds.includes(employee.id)).length;
      const workingDays = Array.from({length: getDaysInMonth(year, month)}, (_, i) => new Date(year, month, i+1)).filter(d => d.getDay() !== 0).length;

      let points = 0;
      points += presentDays * gamificationSettings.pointsForAttendance;
      points += (totalUnits / 1000) * gamificationSettings.pointsPerProductionUnit;
      if (efficiency > gamificationSettings.efficiencyBaseline) points += (efficiency - gamificationSettings.efficiencyBaseline) * gamificationSettings.pointsPerEfficiencyPercent;
      points += rft * gamificationSettings.pointsPerRFTPercent;
      
      const sortedLevels = [...(levelDefinitions || [])].sort((a,b) => b.level - a.level);
      const currentLevel = sortedLevels.find(l => points >= l.pointsRequired) || sortedLevels[sortedLevels.length - 1];
      const nextLevel = (levelDefinitions || []).find(l => l.level === currentLevel.level + 1);
      
      let progressToNext = 100;
      if (nextLevel && currentLevel) {
          const pointsForLevel = nextLevel.pointsRequired - currentLevel.pointsRequired;
          const pointsInLevel = points - currentLevel.pointsRequired;
          progressToNext = pointsForLevel > 0 ? (pointsInLevel / pointsForLevel) * 100 : 100;
      }

      const machineContribution = empProdEntries.reduce((acc, entry) => {
        const style = stylesMap.get(entry.styleNumber);
        const machineId = style?.operationBulletin?.find(ob => ob.operationId === entry.operation)?.machineId;
        const machineName = machineId ? machinesMap.get(machineId) : 'Unknown';
        if(machineName) acc.set(machineName, (acc.get(machineName) || 0) + entry.productionQuantity);
        return acc;
      }, new Map<string, number>());
      
      const tenure = (new Date().getTime() - new Date(employee.doj).getTime()) / (1000 * 3600 * 24 * 365.25);

      return {
          efficiency, rft, points, presentDays, workingDays, tenure, currentLevel, progressToNext,
          machineContribution: Array.from(machineContribution.entries()).sort((a,b) => b[1] - a[1]),
      };
  }, [employee, year, month, productionEntries, dailyAttendances, endLineChecks, gamificationSettings, stylesMap, machinesMap, levelDefinitions]);
  
  const operationSummary = useMemo(() => {
    if (!monthlySummaryData) return [];
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    const empProdEntries = (productionEntries || []).filter(p => p.employeeId === employeeId && new Date(p.timestamp) >= startDate && new Date(p.timestamp) <= endDate);

    const summary = new Map<string, { totalOutput: number; totalSmv: number; hours: Set<string> }>();
    empProdEntries.forEach(p => {
        if (!summary.has(p.operation)) summary.set(p.operation, { totalOutput: 0, totalSmv: 0, hours: new Set() });
        const data = summary.get(p.operation)!;
        data.totalOutput += p.productionQuantity;
        const style = stylesMap.get(p.styleNumber);
        const op = style?.operationBulletin?.find(ob => ob.operationId === p.operation);
        const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
        data.totalSmv += p.productionQuantity * smv;
        data.hours.add(`${p.timestamp.split('T')[0]}-${p.hourCounter}`);
    });

    return Array.from(summary.entries()).map(([operationId, data]) => {
        const efficiency = data.hours.size > 0 ? (data.totalSmv / (data.hours.size * 60)) * 100 : 0;
        const totalDefects = (endLineChecks || []).filter(c => c.responsibleEmpId === employeeId && c.responsibleOpId === operationId && new Date(c.timestamp) >= startDate && new Date(c.timestamp) <= endDate).length;
        const rft = data.totalOutput > 0 ? ((data.totalOutput - totalDefects) / data.totalOutput) * 100 : 100;
        return { operationName: operationsMap.get(operationId) || 'Unknown', ...data, efficiency, rft };
    }).sort((a,b) => b.totalOutput - a.totalOutput);
  }, [monthlySummaryData, year, month, employeeId, productionEntries, endLineChecks, stylesMap, operationsMap]);
  
  const calendarData = useMemo(() => {
    if (!employee || !monthYear) return { days: [], blanks: 0 };
    const [calYear, calMonth] = monthYear.split('-').map(Number);
    const yearNum = calYear;
    const monthNum = calMonth -1;

    const daysInMonth = getDaysInMonth(yearNum, monthNum);
    const firstDayOfMonth = new Date(yearNum, monthNum, 1).getDay();
    const blanks = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const sortedLevels = [...(levelDefinitions || [])].sort((a,b) => a.level - b.level);

    // Calculate total points up to the start of the current month
    const monthStartDate = new Date(yearNum, monthNum, 1);
    const allPastProduction = (productionEntries || []).filter(p => p.employeeId === employee.id && new Date(p.timestamp) < monthStartDate);
    const allPastAttendance = (dailyAttendances || []).filter(d => new Date(d.date) < monthStartDate && d.presentEmployeeIds.includes(employee.id));
    const allPastDefects = (endLineChecks || []).filter(c => c.responsibleEmpId === employee.id && new Date(c.timestamp) < monthStartDate);
    
    let pointsBeforeMonth = 0;
    pointsBeforeMonth += allPastAttendance.length * gamificationSettings.pointsForAttendance;
    const { totalUnits, totalSmv, hours } = allPastProduction.reduce((acc, p) => {
        acc.totalUnits += p.productionQuantity;
        const style = stylesMap.get(p.styleNumber);
        const op = style?.operationBulletin?.find(ob => ob.operationId === p.operation);
        const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
        acc.totalSmv += p.productionQuantity * smv;
        acc.hours.add(`${p.timestamp.split('T')[0]}-${p.hourCounter}`);
        return acc;
    }, { totalUnits: 0, totalSmv: 0, hours: new Set<string>() });
    pointsBeforeMonth += (totalUnits / 1000) * gamificationSettings.pointsPerProductionUnit;
    const pastEfficiency = hours.size > 0 ? (totalSmv / (hours.size * 60)) * 100 : 0;
    if (pastEfficiency > gamificationSettings.efficiencyBaseline) pointsBeforeMonth += (pastEfficiency - gamificationSettings.efficiencyBaseline) * gamificationSettings.pointsPerEfficiencyPercent;
    const pastRft = totalUnits > 0 ? ((totalUnits - allPastDefects.length) / totalUnits) * 100 : 100;
    pointsBeforeMonth += pastRft * gamificationSettings.pointsPerRFTPercent;
    
    let cumulativePoints = pointsBeforeMonth;

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(yearNum, monthNum, day);
      const dateStr = date.toISOString().split('T')[0];

      const isPresent = (dailyAttendances || []).find(d => d.date === dateStr)?.presentEmployeeIds.includes(employee.id) ?? false;
      const dayProd = (productionEntries || []).filter(p => p.employeeId === employee.id && p.timestamp.startsWith(dateStr));
      const dayAudits = (inLineAudits || []).filter(a => a.timestamp.startsWith(dateStr) && a.records.some(r => r.employeeId === employee.id));
      const dayDefects = (endLineChecks || []).filter(c => c.responsibleEmpId === employee.id && c.timestamp.startsWith(dateStr));

      const totalOutput = dayProd.reduce((sum, p) => sum + p.productionQuantity, 0);
      const uniqueHours = new Set(dayProd.map(p => p.hourCounter)).size;
      const smvProduced = dayProd.reduce((sum, p) => {
        const style = stylesMap.get(p.styleNumber);
        const op = style?.operationBulletin?.find(ob => ob.operationId === p.operation);
        const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
        return sum + p.productionQuantity * smv;
      }, 0);
      
      const efficiency = uniqueHours > 0 ? (smvProduced / (uniqueHours * 60)) * 100 : 0;
      const rft = totalOutput > 0 ? ((totalOutput - dayDefects.length) / totalOutput) * 100 : 100;
      const auditSignals = dayAudits.flatMap(a => a.records.filter(r => r.employeeId === employee.id).map(r => r.status));
      
      const dailyPoints = (isPresent ? gamificationSettings.pointsForAttendance : 0) + 
                         (totalOutput / 1000 * gamificationSettings.pointsPerProductionUnit) + 
                         (efficiency > gamificationSettings.efficiencyBaseline ? (efficiency - gamificationSettings.efficiencyBaseline) * gamificationSettings.pointsPerEfficiencyPercent : 0) + 
                         (rft * gamificationSettings.pointsPerRFTPercent);
                         
      const levelBefore = sortedLevels.slice().reverse().find(l => cumulativePoints >= l.pointsRequired);
      cumulativePoints += dailyPoints;
      const levelAfter = sortedLevels.slice().reverse().find(l => cumulativePoints >= l.pointsRequired);
      const levelUpToday = levelAfter && levelBefore && levelAfter.level > levelBefore.level;

      const milestones: string[] = [];
      if (totalOutput > 1000) milestones.push(`High Output: ${totalOutput} units!`);
      const operationsPerformed = Array.from(new Set(dayProd.map(p => operationsMap.get(p.operation) || ''))).filter(Boolean);

      return { day, dateStr, isPresent, totalOutput, efficiency, rft, auditSignals, milestones, operationsPerformed, dailyPoints, levelUpToday };
    });
    return { days, blanks };
  }, [employee, monthYear, dailyAttendances, productionEntries, endLineChecks, inLineAudits, stylesMap, operationsMap, gamificationSettings, levelDefinitions]);
  
  const handleSupervisorApprove = () => {
    const newReview: OperatorMonthlyReview = {
        ...(review || { employeeId, monthYear, status: 'Pending Supervisor Approval' }),
        id: `${employeeId}-${monthYear}`, supervisorId: currentUser.id, supervisorComments,
        supervisorApprovalDate: new Date().toISOString(), status: 'Pending Manager Approval'
    };
    onSave(newReview);
  };
  
  const handleManagerApprove = () => {
    if(!review) return;
    const newReview: OperatorMonthlyReview = {
        ...review, managerId: currentUser.id, managerComments,
        managerApprovalDate: new Date().toISOString(), status: 'Approved'
    };
    onSave(newReview);
  };
  
  const currentStatus = review?.status || 'Pending Supervisor Approval';
  const canSupervisorApprove = (currentUser.role === 'Supervisor' || currentUser.role === 'Admin') && currentStatus === 'Pending Supervisor Approval';
  const canManagerApprove = (currentUser.role === 'Production Manager' || currentUser.role === 'Admin') && currentStatus === 'Pending Manager Approval';
  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  const machineChartData = useMemo(() => {
    if (!monthlySummaryData?.machineContribution) return [];
    return monthlySummaryData.machineContribution.map(([name, qty], index) => ({
        label: name, value: qty, color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [monthlySummaryData]);
  
  if (!employee || !monthlySummaryData) return <div>Employee not found.</div>;
  const gradeName = operatorGrades.find(g => g.id === employee.operatorGradeId)?.name || 'N/A';
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4">
      <header className="flex items-start justify-between mb-2">
        <div>
          <button onClick={onBack} className="text-sm text-indigo-600 mb-2 flex items-center gap-1"><ArrowLeftIcon className="w-4 h-4"/> Back to Summary</button>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{employee.name}'s Monthly Review <span className="text-lg font-normal text-slate-500">({employee.id})</span></h1>
          <p className="text-slate-600 mt-1 text-base">{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div>
            <div className={`text-right px-3 py-1.5 rounded-md font-semibold text-sm ${currentStatus === 'Approved' ? 'bg-green-100 text-green-700' : currentStatus === 'Pending Manager Approval' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{currentStatus}</div>
        </div>
      </header>
      
      {/* Summary Section */}
      <div className="bg-white p-4 rounded-xl shadow-lg space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiRadialChart title="Avg. Efficiency" value={monthlySummaryData.efficiency} kpi={efficiencyKpi}/>
            <KpiRadialChart title="Overall RFT" value={monthlySummaryData.rft} kpi={rftKpi} />
            <KpiRadialChart title="Total Points" value={monthlySummaryData.points} format="number" totalPointsData={{ progress: monthlySummaryData.progressToNext }}/>
            <KpiRadialChart title="Attendance" value={(monthlySummaryData.presentDays / monthlySummaryData.workingDays) * 100} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Operation-wise Summary</h3>
                <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-700 sticky top-0"><tr className="text-left text-slate-600 dark:text-slate-300">
                        <th className="p-1.5 font-semibold">Operation</th>
                        <th className="p-1.5 font-semibold text-center">Output</th>
                        <th className="p-1.5 font-semibold text-center">Efficiency %</th>
                        <th className="p-1.5 font-semibold text-center">RFT %</th>
                    </tr></thead>
                    <tbody className="dark:bg-slate-800">
                        {operationSummary.map(op => (
                        <tr key={op.operationName} className="border-b dark:border-slate-700">
                            <td className="p-1.5 font-medium">{op.operationName}</td>
                            <td className="p-1.5 text-center font-mono">{op.totalOutput.toLocaleString()}</td>
                            <td className="p-1.5 text-center font-mono">{op.efficiency.toFixed(1)}</td>
                            <td className="p-1.5 text-center font-mono">{op.rft.toFixed(1)}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>
            <div className="lg:col-span-1 flex flex-col gap-4">
                 <InfoCard>
                    <h3 className="font-semibold mb-3 text-slate-800 dark:text-slate-200">Employee Details</h3>
                    <div className="space-y-2">
                        <InfoItem label="Grade" value={gradeName} />
                        <InfoItem label="Age" value={employee.age} />
                        <InfoItem label="Tenure" value={`${monthlySummaryData.tenure.toFixed(1)} years`} />
                        <InfoItem label="Salary/Shift" value={`₹${employee.ctc.toLocaleString()}`} />
                        <InfoItem label="Gamification Level" value={<div className="flex items-center gap-2"><AwardIcon className="w-5 h-5 text-indigo-500"/><span>{monthlySummaryData.currentLevel.level} - {monthlySummaryData.currentLevel.name}</span></div>} />
                    </div>
                </InfoCard>
                <InfoCard className="flex-1">
                    <div className="flex flex-col h-full">
                        <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200 text-center">Machine Contribution</h3>
                        <div className="flex-1 flex items-center justify-center">
                            <DonutChart data={machineChartData} centerLabel="Total Units"/>
                        </div>
                    </div>
                 </InfoCard>
            </div>
        </div>
      </div>

      <main className="bg-white p-4 rounded-xl shadow-lg">
        <h3 className="font-semibold text-lg mb-2">Daily Performance Calendar</h3>
        <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200">
            {weekDays.map(day => <div key={day} className="text-center font-semibold bg-slate-50 p-2 text-xs">{day}</div>)}
            {Array(calendarData.blanks).fill(0).map((_,i) => <div key={`blank-${i}`} className="bg-slate-100 min-h-[120px]"></div>)}
            {calendarData.days.map(dayData => {
                const isSunday = new Date(year, month, dayData.day).getDay() === 0;
                const signalColors = { Green: 'bg-green-500', Yellow: 'bg-amber-500', Red: 'bg-red-500' };
                return (
                    <div key={dayData.day} className={`p-1 min-h-[120px] flex flex-col relative ${isSunday ? 'bg-slate-100' : dayData.isPresent ? 'bg-white' : 'bg-slate-50'}`}>
                        <div className={`font-bold text-xs ${dayData.isPresent ? 'text-slate-700' : 'text-slate-400'}`}>{dayData.day}</div>
                        {dayData.isPresent && (
                          <>
                            <div className="absolute top-1 right-1 flex gap-1">
                                {dayData.milestones.length > 0 && (
                                    <span title={dayData.milestones.join('\n')}>
                                        <AwardIcon className="w-4 h-4 text-indigo-500" />
                                    </span>
                                )}
                                {dayData.levelUpToday && (
                                    <span title="Leveled Up!">
                                        <StarIcon className="w-4 h-4 text-amber-400" />
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-end text-xs" title={dayData.operationsPerformed.join(', ')}>
                                <div className="space-y-0.5">
                                    <div className="flex items-center justify-between"><span className="text-slate-500">Pcs:</span> <span className="font-semibold">{dayData.totalOutput}</span></div>
                                    <div className="flex items-center justify-between"><span className="text-slate-500">Eff:</span> <span className="font-semibold">{dayData.efficiency.toFixed(0)}%</span></div>
                                    <div className="flex items-center justify-between"><span className="text-slate-500">RFT:</span> <span className="font-semibold">{dayData.rft.toFixed(0)}%</span></div>
                                </div>
                            </div>
                            <div className="absolute bottom-1 left-1 flex gap-0.5">
                                {dayData.auditSignals.map((s, i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full ${signalColors[s]}`} title={s}></div>
                                ))}
                            </div>
                            {dayData.dailyPoints > 0 && (
                                <div className="absolute bottom-1 right-1 flex items-center gap-0.5" title={`Points earned: ${Math.round(dayData.dailyPoints)}`}>
                                    <CoinIcon className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="font-semibold text-xs text-slate-700">{Math.round(dayData.dailyPoints)}</span>
                                </div>
                            )}
                          </>
                        )}
                    </div>
                );
            })}
        </div>
      </main>

      <footer className="bg-white p-6 rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <h3 className="font-semibold text-lg mb-2">Supervisor's Review</h3>
            {review?.supervisorId && <p className="text-xs text-slate-500 mb-2">Reviewed by {staff.find(s=>s.id === review.supervisorId)?.name} on {new Date(review.supervisorApprovalDate!).toLocaleDateString()}</p>}
            <textarea value={supervisorComments} onChange={e => setSupervisorComments(e.target.value)} placeholder="Enter supervisor comments..." rows={4} className="w-full p-2 border rounded-md" disabled={!canSupervisorApprove && currentUser.role !== 'Admin'}/>
            {canSupervisorApprove && (
                <div className="mt-4 flex flex-col items-end">
                    <button onClick={handleSupervisorApprove} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
                        Supervisor Approval: Submit to Manager
                    </button>
                    <p className="text-xs text-slate-500 mt-1">Your comments will be saved and the review will be sent for final approval.</p>
                </div>
            )}
        </div>
        <div>
            <h3 className="font-semibold text-lg mb-2">Manager's Review</h3>
            {currentStatus === 'Pending Supervisor Approval' ? (
                <div className="flex items-center justify-center h-full bg-slate-50 rounded-md text-slate-500 text-sm">Waiting for Supervisor's approval.</div>
            ) : (
                <>
                {review?.managerId && <p className="text-xs text-slate-500 mb-2">Reviewed by {staff.find(s=>s.id === review.managerId)?.name} on {new Date(review.managerApprovalDate!).toLocaleDateString()}</p>}
                <textarea value={managerComments} onChange={e => setManagerComments(e.target.value)} placeholder="Enter manager comments..." rows={4} className="w-full p-2 border rounded-md" disabled={!canManagerApprove && currentUser.role !== 'Admin'}/>
                {canManagerApprove && (
                    <div className="mt-4 flex flex-col items-end">
                        <button onClick={handleManagerApprove} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">
                            Manager: Final Approval
                        </button>
                         <p className="text-xs text-slate-500 mt-1">This will finalize and approve the monthly review.</p>
                    </div>
                )}
                </>
            )}
        </div>
      </footer>
    </div>
  );
};

export default OperatorMonthlyReviewPage;