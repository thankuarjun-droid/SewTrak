import React, { useState, useMemo } from 'react';
import type { EndLineCheck, InLineAudit, NonConformanceReport, MasterDataItem, Staff, Line, Operation, KpiSetting, AqlInspection, KanbanEntry } from '../types';
import DonutChart from '../components/DonutChart';
import { PieChart } from '../components/PieChart';
import VerticalBarChart from '../components/VerticalBarChart';

const StatCard = ({ title, value, rate, bgColor, textColor }: { title: string, value: string | number, rate?: string, bgColor: string, textColor: string }) => (
    <div className={`${bgColor} p-6 rounded-xl shadow-lg text-center`}>
        <h3 className={`text-sm font-medium uppercase tracking-wider opacity-80 ${textColor}`}>{title}</h3>
        <p className={`text-5xl font-extrabold mt-2 ${textColor}`}>{value}</p>
        {rate && <p className={`text-lg font-bold mt-1 ${textColor}`}>{rate}</p>}
    </div>
);


interface QualityDashboardPageProps {
  endLineChecks: EndLineCheck[];
  inLineAudits: InLineAudit[];
  nonConformanceReports: NonConformanceReport[];
  defects: MasterDataItem[];
  operations: Operation[];
  lines: Line[];
  staff: Staff[];
  kpiSettings: KpiSetting[];
  kanbanEntries: KanbanEntry[];
  aqlInspections: AqlInspection[];
}

const QualityDashboardPage = ({ endLineChecks, inLineAudits, defects, operations, lines, kanbanEntries, aqlInspections }: QualityDashboardPageProps) => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [filterLine, setFilterLine] = useState('all');

  const maps = useMemo(() => ({
    defects: new Map(defects.map(d => [d.id, d.name])),
    operations: new Map(operations.map(o => [o.id, o.name])),
    lines: new Map(lines.map(l => [l.id, l.name])),
  }), [defects, operations, lines]);

  const filteredData = useMemo(() => {
    const start = dateRange.startDate ? new Date(dateRange.startDate + 'T00:00:00') : null;
    const end = dateRange.endDate ? new Date(dateRange.endDate + 'T23:59:59') : null;

    const filteredChecks = (endLineChecks || []).filter(c => {
      const checkDate = new Date(c.timestamp);
      const dateMatch = (!start || checkDate >= start) && (!end || checkDate <= end);
      const lineMatch = filterLine === 'all' || c.lineNumber === filterLine;
      return dateMatch && lineMatch;
    });

    const filteredAudits = (inLineAudits || []).filter(a => {
      const auditDate = new Date(a.timestamp);
      const dateMatch = (!start || auditDate >= start) && (!end || auditDate <= end);
      const lineMatch = filterLine === 'all' || a.lineNumber === filterLine;
      return dateMatch && lineMatch;
    });
    
    const filteredAqls = (aqlInspections || []).filter(aql => {
        const aqlDate = new Date(aql.timestamp);
        const dateMatch = (!start || aqlDate >= start) && (!end || aqlDate <= end);
        if (!dateMatch) return false;
        if (filterLine === 'all') return true;
        
        const kanbanCard = (kanbanEntries || []).find(k => k.id === aql.kanbanCardId);
        return kanbanCard?.lineNumber === filterLine;
    });

    return { checks: filteredChecks, audits: filteredAudits, aqls: filteredAqls };
  }, [dateRange, filterLine, endLineChecks, inLineAudits, aqlInspections, kanbanEntries]);

  // Data for End-of-Line section
  const endOfLineSummary = useMemo(() => {
      const totalChecks = filteredData.checks.length;
      if (totalChecks === 0) return { passed: 0, defects: 0, defectRate: 0, rework: 0, rejected: 0 };
      
      const passed = filteredData.checks.filter(c => c.status === 'Pass').length;
      const rework = filteredData.checks.filter(c => c.status === 'Rework').length;
      const rejected = filteredData.checks.filter(c => c.status === 'Reject').length;
      const defects = rework + rejected;
      
      return {
          passed,
          defects,
          rework,
          rejected,
          defectRate: totalChecks > 0 ? (defects / totalChecks) * 100 : 0
      };
  }, [filteredData.checks]);
  
  const topDefectsChartData = useMemo(() => {
    const defectCounts = new Map<string, number>();
    filteredData.checks.forEach(c => {
      if (c.defectId) {
        const defectName = maps.defects.get(c.defectId) || 'Unknown';
        defectCounts.set(defectName, (defectCounts.get(defectName) || 0) + 1);
      }
    });
    return Array.from(defectCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ opName: name, todayOutput: count, wip: 0, hourOutput: 0 }));
  }, [filteredData.checks, maps.defects]);

  const defectsByOperationChartData = useMemo(() => {
    const opCounts = new Map<string, number>();
    filteredData.checks.forEach(c => {
      if (c.responsibleOpId) {
        const opName = maps.operations.get(c.responsibleOpId) || 'Unknown';
        opCounts.set(opName, (opCounts.get(opName) || 0) + 1);
      }
    });
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    return Array.from(opCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], i) => ({ label: name, value: count, color: colors[i % colors.length] }));
  }, [filteredData.checks, maps.operations]);

  // Data for In-Line Audit section
  const auditStatusData = useMemo(() => {
    const statusCounts = { Green: 0, Yellow: 0, Red: 0 };
    filteredData.audits.forEach(audit => {
      audit.records.forEach(record => {
        statusCounts[record.status]++;
      });
    });
    return [
        { label: 'Green (Pass)', value: statusCounts.Green, color: '#22c55e' },
        { label: 'Yellow (Warning)', value: statusCounts.Yellow, color: '#f59e0b' },
        { label: 'Red (Fail)', value: statusCounts.Red, color: '#ef4444' },
    ];
  }, [filteredData.audits]);

  // Data for AQL section
  const aqlSummary = useMemo(() => {
      const totalAqls = filteredData.aqls.length;
      if (totalAqls === 0) return { passRate: 0, totalLots: 0, failedLots: 0 };
      const passed = filteredData.aqls.filter(a => a.result === 'Pass').length;
      return {
          passRate: (passed / totalAqls) * 100,
          totalLots: totalAqls,
          failedLots: totalAqls - passed
      };
  }, [filteredData.aqls]);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <header>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Quality Dashboard</h1>
        <p className="text-slate-600 mt-2">A high-level overview of factory quality performance.</p>
      </header>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="date" value={dateRange.startDate} onChange={e => setDateRange(p => ({...p, startDate: e.target.value}))} className="h-10 px-2 border-slate-300 rounded-md shadow-sm text-sm" />
          <input type="date" value={dateRange.endDate} onChange={e => setDateRange(p => ({...p, endDate: e.target.value}))} className="h-10 px-2 border-slate-300 rounded-md shadow-sm text-sm" />
          <select value={filterLine} onChange={e => setFilterLine(e.target.value)} className="h-10 px-2 border-slate-300 rounded-md shadow-sm text-sm">
            <option value="all">All Lines</option>
            {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>

      {/* End-of-Line Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">End-of-Line Inspection Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="OK" value={endOfLineSummary.passed.toLocaleString()} bgColor="bg-green-600" textColor="text-white" />
            <StatCard title="Defect" value={endOfLineSummary.defects.toLocaleString()} bgColor="bg-amber-500" textColor="text-white" />
            <StatCard title="Defect Rate" value={`${endOfLineSummary.defectRate.toFixed(2)}%`} bgColor="bg-red-600" textColor="text-white" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VerticalBarChart data={topDefectsChartData} title="Top 5 Defects" displayMode="output"/>
            <div className="bg-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Defect Ratio by Operation</h3>
                <div className="w-full h-48"><PieChart data={defectsByOperationChartData} /></div>
            </div>
        </div>
      </div>

      {/* In-Line & AQL Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl shadow-md">
              <h3 className="text-base font-semibold text-slate-800 mb-3">In-Line Audit Status</h3>
              <div className="flex items-center justify-center min-h-[250px]">
                <DonutChart data={auditStatusData} />
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md space-y-4">
              <h3 className="text-base font-semibold text-slate-800">AQL Inspection Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-100 p-4 rounded-lg text-center"><div className="text-xs font-semibold text-slate-500">AQL PASS RATE</div><div className="text-3xl font-bold text-slate-800 mt-1">{aqlSummary.passRate.toFixed(1)}%</div></div>
                  <div className="bg-slate-100 p-4 rounded-lg text-center"><div className="text-xs font-semibold text-slate-500">LOTS INSPECTED</div><div className="text-3xl font-bold text-slate-800 mt-1">{aqlSummary.totalLots}</div></div>
              </div>
               <div className="bg-red-100 p-4 rounded-lg text-center"><div className="text-xs font-semibold text-red-500">FAILED LOTS</div><div className="text-3xl font-bold text-red-800 mt-1">{aqlSummary.failedLots}</div></div>
          </div>
      </div>
    </div>
  );
};

export default QualityDashboardPage;