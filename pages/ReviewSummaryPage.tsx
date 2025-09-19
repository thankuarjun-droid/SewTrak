import React, { useState, useMemo } from 'react';
import type { Employee, Line, OperatorMonthlyReview, OperatorGrade, KpiSetting, ProductionEntry, EndLineCheck, GamificationSettings, Style, DailyAttendance, Staff } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from '../components/IconComponents';

interface ReviewSummaryPageProps {
  currentUser: Staff;
  employees: Employee[];
  lines: Line[];
  operatorMonthlyReviews: OperatorMonthlyReview[];
  onNavigateToReview: (employeeId: string, monthYear: string) => void;
  operatorGrades: OperatorGrade[];
  kpiSettings: KpiSetting[];
  productionEntries: ProductionEntry[];
  endLineChecks: EndLineCheck[];
  gamificationSettings: GamificationSettings;
  styles: Style[];
  dailyAttendances: DailyAttendance[];
}

type SortKey = 'name' | 'line' | 'status' | 'efficiency' | 'rft' | 'points';

const ReviewSummaryPage = (props: ReviewSummaryPageProps) => {
  const { currentUser, employees = [], lines = [], operatorMonthlyReviews = [], onNavigateToReview, operatorGrades = [], kpiSettings = [], productionEntries = [], endLineChecks = [], gamificationSettings, styles = [], dailyAttendances = [] } = props;

  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterLine, setFilterLine] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | OperatorMonthlyReview['status']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  const linesMap = useMemo(() => new Map(lines.map(l => [l.id, l.name])), [lines]);
  const reviewsMap = useMemo(() => new Map(operatorMonthlyReviews.map(r => [r.id, r])), [operatorMonthlyReviews]);
  const stylesMap = useMemo(() => new Map(styles.map(s => [s.id, s])), [styles]);
  const efficiencyKpi = useMemo(() => kpiSettings.find(k => k.kpi === 'Average Line Efficiency'), [kpiSettings]);
  const rftKpi = useMemo(() => kpiSettings.find(k => k.kpi === 'RFT%'), [kpiSettings]);
  
  const employeeMonthlyData = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    let employeesToProcess = (employees || []);
    if (currentUser.role === 'Supervisor') {
        const supervisedLines = new Set(currentUser.lineAssignments);
        employeesToProcess = (employees || []).filter(emp => supervisedLines.has(emp.currentLineId));
    }

    return employeesToProcess.map(emp => {
      const reviewId = `${emp.id}-${currentMonth}`;
      const review = reviewsMap.get(reviewId);
      const status = review?.status || 'Pending Supervisor Approval';

      const empProdEntries = (productionEntries || []).filter(p => p.employeeId === emp.id && new Date(p.timestamp) >= startDate && new Date(p.timestamp) <= endDate);
      const uniqueHoursWorked = new Set(empProdEntries.map(p => `${p.timestamp.split('T')[0]}-${p.hourCounter}`)).size;
      const totalSmvProduced = empProdEntries.reduce((sum, entry) => {
        const style = stylesMap.get(entry.styleNumber);
        const op = style?.operationBulletin?.find(ob => ob.operationId === entry.operation);
        const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
        return sum + (smv * entry.productionQuantity);
      }, 0);
      const efficiency = uniqueHoursWorked > 0 ? (totalSmvProduced / (uniqueHoursWorked * 60)) * 100 : 0;
      
      const totalUnits = empProdEntries.reduce((sum, p) => sum + p.productionQuantity, 0);
      const totalDefects = (endLineChecks || []).filter(c => c.responsibleEmpId === emp.id && new Date(c.timestamp) >= startDate && new Date(c.timestamp) <= endDate).length;
      const rft = totalUnits > 0 ? ((totalUnits - totalDefects) / totalUnits) * 100 : 100;

      let points = 0;
      const daysPresent = (dailyAttendances || []).filter(d => new Date(d.date) >= startDate && new Date(d.date) <= endDate && d.presentEmployeeIds.includes(emp.id)).length;
      points += daysPresent * gamificationSettings.pointsForAttendance;
      points += (totalUnits / 1000) * gamificationSettings.pointsPerProductionUnit;
      if (efficiency > gamificationSettings.efficiencyBaseline) {
        points += (efficiency - gamificationSettings.efficiencyBaseline) * gamificationSettings.pointsPerEfficiencyPercent;
      }
      points += rft * gamificationSettings.pointsPerRFTPercent;

      return {
        ...emp,
        status,
        efficiency,
        rft,
        points
      };
    });
  }, [currentMonth, employees, operatorMonthlyReviews, productionEntries, endLineChecks, dailyAttendances, gamificationSettings, stylesMap, currentUser]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = employeeMonthlyData.filter(emp => {
        const lineMatch = filterLine === 'all' || emp.currentLineId === filterLine;
        const gradeMatch = filterGrade === 'all' || emp.operatorGradeId === filterGrade;
        const statusMatch = filterStatus === 'all' || emp.status === filterStatus;
        const searchMatch = !searchTerm || emp.name.toLowerCase().includes(searchTerm.toLowerCase());
        return lineMatch && gradeMatch && statusMatch && searchMatch;
    });

    return filtered.sort((a, b) => {
        const order = sortConfig.direction === 'asc' ? 1 : -1;
        let valA, valB;

        if (sortConfig.key === 'line') {
            valA = linesMap.get(a.currentLineId);
            valB = linesMap.get(b.currentLineId);
        } else {
            valA = a[sortConfig.key];
            valB = b[sortConfig.key];
        }
        
        if (valA == null && valB == null) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        
        if (typeof valA === 'string' && typeof valB === 'string') {
            return valA.localeCompare(valB) * order;
        }
        
        if (typeof valA === 'number' && typeof valB === 'number') {
            return (valA - valB) * order;
        }
        
        return 0;
    });
  }, [employeeMonthlyData, filterLine, filterGrade, filterStatus, searchTerm, sortConfig, linesMap]);
  
  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const getKpiColorClass = (value: number, kpi?: KpiSetting) => {
    if (!kpi) return 'text-slate-700';
    if (kpi.direction === 'Up') {
        if (value >= kpi.targetStretch) return 'text-green-600';
        if (value >= kpi.targetStart) return 'text-amber-600';
        return 'text-red-600';
    } else { // Down is good
        if (value <= kpi.targetStretch) return 'text-green-600';
        if (value <= kpi.targetStart) return 'text-amber-600';
        return 'text-red-600';
    }
  };

  const getStatusChip = (status: OperatorMonthlyReview['status']) => {
    switch(status) {
        case 'Approved': return 'bg-green-100 text-green-700';
        case 'Pending Manager Approval': return 'bg-blue-100 text-blue-700';
        case 'Pending Supervisor Approval':
        default:
            return 'bg-amber-100 text-amber-700';
    }
  };

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <th className="p-3 text-sm font-semibold text-slate-600 cursor-pointer" onClick={() => handleSort(sortKey)}>
        <div className="flex items-center gap-2">
            {label}
            {sortConfig.key === sortKey && (sortConfig.direction === 'asc' ? <ArrowUpIcon className="w-3 h-3"/> : <ArrowDownIcon className="w-3 h-3"/>)}
        </div>
    </th>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <header>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Operator Review Summary</h1>
        <p className="text-slate-600 mt-2">Track and access monthly performance reviews for all operators.</p>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input type="month" value={currentMonth} onChange={e => setCurrentMonth(e.target.value)} className="lg:col-span-1 h-10 px-2 border-slate-300 rounded-md shadow-sm text-sm" />
          <input type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="lg:col-span-1 h-10 px-3 border-slate-300 rounded-md shadow-sm text-sm" />
          <select value={filterLine} onChange={e => setFilterLine(e.target.value)} className="lg:col-span-1 h-10 px-2 border-slate-300 rounded-md shadow-sm text-sm">
            <option value="all">All Lines</option>
            {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="lg:col-span-1 h-10 px-2 border-slate-300 rounded-md shadow-sm text-sm">
            <option value="all">All Grades</option>
            {operatorGrades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="lg:col-span-1 h-10 px-2 border-slate-300 rounded-md shadow-sm text-sm">
            <option value="all">All Statuses</option>
            <option value="Pending Supervisor Approval">Pending Supervisor</option>
            <option value="Pending Manager Approval">Pending Manager</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
      </div>

      <main className="bg-white p-2 sm:p-4 rounded-2xl shadow-lg">
        <div className="max-h-[65vh] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 sticky top-0 bg-white z-10">
              <tr>
                <SortableHeader label="Operator" sortKey="name" />
                <SortableHeader label="Line" sortKey="line" />
                <SortableHeader label="Efficiency %" sortKey="efficiency" />
                <SortableHeader label="RFT %" sortKey="rft" />
                <SortableHeader label="Points" sortKey="points" />
                <SortableHeader label="Status" sortKey="status" />
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map(emp => (
                  <tr key={emp.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => onNavigateToReview(emp.id, currentMonth)}>
                    <td className="p-3 font-medium">{emp.name}</td>
                    <td className="p-3 text-sm text-slate-600">{linesMap.get(emp.currentLineId)}</td>
                    <td className={`p-3 text-sm text-center font-mono font-semibold ${getKpiColorClass(emp.efficiency, efficiencyKpi)}`}>{emp.efficiency.toFixed(1)}%</td>
                    <td className={`p-3 text-sm text-center font-mono font-semibold ${getKpiColorClass(emp.rft, rftKpi)}`}>{emp.rft.toFixed(1)}%</td>
                    <td className="p-3 text-sm text-center font-mono font-semibold text-indigo-600">{Math.round(emp.points).toLocaleString()}</td>
                    <td className="p-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
          {filteredAndSortedData.length === 0 && <p className="text-center py-12 text-slate-500">No employees match the current filters.</p>}
        </div>
      </main>
    </div>
  );
};

export default ReviewSummaryPage;