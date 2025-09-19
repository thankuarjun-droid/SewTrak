
import React, { useState, useMemo } from 'react';
import type { ProductionEntry, Employee, Style, MasterDataItem, Order, Operation, OutputSettings, EndLineCheck, KpiSetting, Defect } from '../types';
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon, CurrencyRupeeIcon, UsersGroupIcon } from '../components/IconComponents';
import { downloadCsv } from '../services/exportService';

interface DailyReportPageProps {
  productionEntries: ProductionEntry[];
  employees: Employee[];
  styles: Style[];
  orders: Order[];
  lines: MasterDataItem[];
  operations: Operation[];
  outputSettings: OutputSettings;
  endLineChecks: EndLineCheck[];
  kpiSettings: KpiSetting[];
  defects: Defect[];
}

const getTodayString = () => new Date().toISOString().split('T')[0];

type SortKeyOperator = 'employeeName' | 'operationName' | 'target' | 'output' | 'efficiency' | 'totalCost';
type SortKeyOperation = 'operationName' | 'totalOutput' | 'avgEfficiency' | 'totalCost' | 'avgCostPerUnit';
type SortDirection = 'ascending' | 'descending';

const KpiCard = ({ title, value, unit, icon: Icon }: { title: string; value: string; unit?: string, icon: React.ElementType }) => (
    <div className="bg-white p-5 rounded-xl shadow-md flex items-center space-x-4">
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#2c4e8a]/10 text-[#2c4e8a] rounded-lg">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h3 className="text-sm font-medium text-slate-500 truncate">{title}</h3>
            <p className="mt-1 text-3xl font-semibold text-slate-900">
                {value}
                {unit && <span className="text-base font-medium text-slate-600 ml-1">{unit}</span>}
            </p>
        </div>
    </div>
);

const SortableHeader = <T,>({
    label,
    sortKey,
    sortConfig,
    onSort,
    className = ''
}: {
    label: string;
    sortKey: keyof T;
    sortConfig: { key: keyof T; direction: SortDirection } | null;
    onSort: (key: keyof T) => void;
    className?: string;
}) => {
    const isSorting = sortConfig?.key === sortKey;
    const direction = isSorting ? sortConfig.direction : 'none';

    return (
        <th className={`p-3 text-sm font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors ${className}`} onClick={() => onSort(sortKey)}>
            <div className="flex items-center gap-2">
                <span>{label}</span>
                {isSorting && (direction === 'ascending' ? <ArrowUpIcon className="w-3 h-3"/> : <ArrowDownIcon className="w-3 h-3"/>)}
            </div>
        </th>
    );
};

const DailyReportPage = ({ productionEntries, employees, styles, orders, lines, operations, outputSettings, endLineChecks, kpiSettings, defects }: DailyReportPageProps) => {
  const [dateRange, setDateRange] = useState({ startDate: getTodayString(), endDate: getTodayString() });
  const [filterLine, setFilterLine] = useState('all');
  const [filterOrder, setFilterOrder] = useState('all');
  const [filterStyle, setFilterStyle] = useState('all');
  
  const [operatorSort, setOperatorSort] = useState<{ key: SortKeyOperator; direction: SortDirection }>({ key: 'employeeName', direction: 'ascending' });
  const [operationSort, setOperationSort] = useState<{ key: SortKeyOperation; direction: SortDirection }>({ key: 'operationName', direction: 'ascending' });

  const employeesMap = useMemo(() => new Map((employees || []).map(e => [e.id, e])), [employees]);
  const stylesMap = useMemo(() => new Map((styles || []).map(s => [s.id, s])), [styles]);
  const operationsMap = useMemo(() => new Map((operations || []).map(o => [o.id, o])), [operations]);
  const ordersMap = useMemo(() => new Map((orders || []).map(o => [o.id, o])), [orders]);
  
  const efficiencyKpi = useMemo(() => (kpiSettings || []).find(k => k.kpi === 'Average Line Efficiency'), [kpiSettings]);

  const reportData = useMemo(() => {
    const start = new Date(dateRange.startDate + 'T00:00:00');
    const end = new Date(dateRange.endDate + 'T23:59:59');

    const filteredEntries = (productionEntries || []).filter(p => {
        const entryDate = new Date(p.timestamp);
        const dateMatch = entryDate >= start && entryDate <= end;
        const lineMatch = filterLine === 'all' || p.lineNumber === filterLine;
        const orderMatch = filterOrder === 'all' || p.orderNumber === filterOrder;
        const styleMatch = filterStyle === 'all' || p.styleNumber === filterStyle;
        return dateMatch && lineMatch && orderMatch && styleMatch;
    });

    const filteredChecks = (endLineChecks || []).filter(c => {
        const checkDate = new Date(c.timestamp);
        const dateMatch = checkDate >= start && checkDate <= end;
        const lineMatch = filterLine === 'all' || c.lineNumber === filterLine;
        const orderMatch = filterOrder === 'all' || c.orderNumber === filterOrder;
        const styleMatch = filterStyle === 'all' || c.styleNumber === filterStyle;
        return dateMatch && lineMatch && orderMatch && styleMatch;
    });

    if (filteredEntries.length === 0 && filteredChecks.length === 0) return null;

    // Quality Summary Calculations
    const totalChecked = filteredChecks.length;
    const totalDefectivePieces = filteredChecks.filter(c => c.status === 'Rework' || c.status === 'Reject').length;
    const dhu = totalChecked > 0 ? (totalDefectivePieces / totalChecked) * 100 : 0;

    const defectCounts = new Map<string, number>();
    filteredChecks.forEach(c => {
        if (c.defectId) {
            defectCounts.set(c.defectId, (defectCounts.get(c.defectId) || 0) + 1);
        }
    });
    const topDefects = Array.from(defectCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([defectId, count]) => ({
            name: (defects || []).find(d => d.id === defectId)?.name || 'Unknown',
            count
        }));
    
    const operatorDefectCounts = new Map<string, number>();
    filteredChecks.forEach(c => {
        if (c.responsibleEmpId) {
            operatorDefectCounts.set(c.responsibleEmpId, (operatorDefectCounts.get(c.responsibleEmpId) || 0) + 1);
        }
    });
    const topDefectiveOperators = Array.from(operatorDefectCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([employeeId, count]) => ({
            name: employeesMap.get(employeeId)?.name || 'Unknown',
            count
        }));
        
    const qualitySummary = { totalChecked, totalDefectivePieces, dhu, topDefects, topDefectiveOperators };

    // Prorate costs
    const hourlyGroups = new Map<string, { entry: ProductionEntry, smvProduced: number }[]>();
    filteredEntries.forEach(entry => {
        const key = `${entry.timestamp.split('T')[0]}-${entry.hourCounter}-${entry.employeeId}`;
        if (!hourlyGroups.has(key)) hourlyGroups.set(key, []);
        const style = stylesMap.get(entry.styleNumber);
        const opBulletinItem = (style?.operationBulletin || []).find(ob => ob.operationId === entry.operation);
        const smv = opBulletinItem ? (opBulletinItem.pickupTime + opBulletinItem.sewingTime + opBulletinItem.trimAndDisposalTime) / 60 : 0;
        hourlyGroups.get(key)!.push({ entry, smvProduced: entry.productionQuantity * smv });
    });

    const entriesWithCost = [];
    for (const [, group] of hourlyGroups) {
        const employee = employeesMap.get(group[0].entry.employeeId);
        if (!employee) continue;
        const hourlyRate = employee.ctc / 8; // Assuming 8 hour shift for CTC
        const totalSmvInHour = group.reduce((sum, item) => sum + item.smvProduced, 0);

        for (const { entry, smvProduced } of group) {
            const cost = totalSmvInHour > 0 ? (smvProduced / totalSmvInHour) * hourlyRate : 0;
            entriesWithCost.push({ ...entry, proratedCost: cost, smvProduced });
        }
    }
    
    // Aggregate for operator table
    const operatorAgg = new Map<string, { employeeName: string; employeeId: string; operationId: string; output: number; totalSmvProduced: number; hoursWorked: Set<string>; totalCost: number; opSmv: number }>();
    entriesWithCost.forEach(entry => {
        const key = `${entry.employeeId}-${entry.operation}`;
        if (!operatorAgg.has(key)) {
            const style = stylesMap.get(entry.styleNumber);
            const opBulletinItem = (style?.operationBulletin || []).find(b => b.operationId === entry.operation);
            const opSmv = opBulletinItem ? (opBulletinItem.pickupTime + opBulletinItem.sewingTime + opBulletinItem.trimAndDisposalTime) / 60 : 0;
            operatorAgg.set(key, { employeeName: employeesMap.get(entry.employeeId)?.name || 'Unknown', employeeId: entry.employeeId, operationId: entry.operation, output: 0, totalSmvProduced: 0, hoursWorked: new Set(), totalCost: 0, opSmv });
        }
        const current = operatorAgg.get(key)!;
        current.output += entry.productionQuantity;
        current.totalSmvProduced += entry.smvProduced;
        current.hoursWorked.add(`${entry.timestamp.split('T')[0]}-${entry.hourCounter}`);
        current.totalCost += entry.proratedCost;
    });
    
    const operatorData = Array.from(operatorAgg.values()).map(d => {
      const target = d.opSmv > 0 ? (d.hoursWorked.size * 60) / d.opSmv : 0;
      return {
          ...d,
          operationName: operationsMap.get(d.operationId)?.name || 'Unknown',
          efficiency: d.hoursWorked.size * 60 > 0 ? (d.totalSmvProduced / (d.hoursWorked.size * 60)) * 100 : 0,
          target: Math.round(target)
      };
    });

    // Aggregate for operation table
    const operationAgg = new Map<string, { operationName: string; operationId: string; totalOutput: number; totalSmvProduced: number; totalMinutes: number; totalCost: number }>();
    entriesWithCost.forEach(entry => {
        const key = entry.operation;
        if (!operationAgg.has(key)) operationAgg.set(key, { operationName: operationsMap.get(entry.operation)?.name || 'Unknown', operationId: entry.operation, totalOutput: 0, totalSmvProduced: 0, totalMinutes: 0, totalCost: 0 });
        const current = operationAgg.get(key)!;
        current.totalOutput += entry.productionQuantity;
        current.totalSmvProduced += entry.smvProduced;
        current.totalCost += entry.proratedCost;
    });
    
    const opHours = new Map<string, Set<string>>();
    filteredEntries.forEach(entry => {
      if(!opHours.has(entry.operation)) opHours.set(entry.operation, new Set());
      opHours.get(entry.operation)!.add(`${entry.timestamp.split('T')[0]}-${entry.hourCounter}-${entry.employeeId}`);
    });
    opHours.forEach((hoursSet, opId) => {
        const agg = operationAgg.get(opId);
        if(agg) agg.totalMinutes = hoursSet.size * 60;
    });
    const operationData = Array.from(operationAgg.values()).map(d => ({ ...d, avgEfficiency: d.totalMinutes > 0 ? (d.totalSmvProduced / d.totalMinutes) * 100 : 0, avgCostPerUnit: d.totalOutput > 0 ? d.totalCost / d.totalOutput : 0 }));
    
    // KPIs
    let finalUnitsProduced = 0;
    if (outputSettings.source === 'endOfLine') {
        const passedCount = filteredChecks.filter(c => c.status === 'Pass').length;
        const repairedCount = filteredChecks.filter(c => c.status === 'Rework' && c.reworkStatus === 'completed').length;
        finalUnitsProduced = passedCount + repairedCount;
    } else {
        const lastOperationIds = new Map<string, string>();
        (styles || []).forEach(style => {
          if ((style.operationBulletin || []).length > 0) lastOperationIds.set(style.id, (style.operationBulletin || []).reduce((a, b) => a.sNo > b.sNo ? a : b).operationId);
        });
        finalUnitsProduced = filteredEntries.filter(e => lastOperationIds.get(e.styleNumber) === e.operation).reduce((sum, e) => sum + e.productionQuantity, 0);
    }

    const uniqueStaffHours = new Map<string, Set<string>>();
    filteredEntries.forEach(entry => {
        if(!uniqueStaffHours.has(entry.employeeId)) uniqueStaffHours.set(entry.employeeId, new Set());
        uniqueStaffHours.get(entry.employeeId)!.add(`${entry.timestamp.split('T')[0]}-${entry.hourCounter}`);
    });
    const totalSalaryCost = Array.from(uniqueStaffHours.entries()).reduce((sum, [empId, hoursSet]) => {
        const emp = employeesMap.get(empId);
        return sum + (emp ? (emp.ctc / 8) * hoursSet.size : 0);
    }, 0);

    const avgCostPerUnit = finalUnitsProduced > 0 ? totalSalaryCost / finalUnitsProduced : 0;
    const unitsPerHeadcount = uniqueStaffHours.size > 0 ? finalUnitsProduced / uniqueStaffHours.size : 0;

    return { operatorData, operationData, qualitySummary, kpis: { totalSalaryCost, finalUnitsProduced, avgCostPerUnit, unitsPerHeadcount } };
  }, [dateRange, filterLine, filterOrder, filterStyle, productionEntries, endLineChecks, outputSettings, employeesMap, stylesMap, ordersMap, operationsMap, styles, kpiSettings, defects]);

  const handleOperatorSort = (key: SortKeyOperator) => setOperatorSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
  const handleOperationSort = (key: SortKeyOperation) => setOperationSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));

  const sortedOperatorData = useMemo(() => {
    if (!reportData) return [];
    return [...reportData.operatorData].sort((a, b) => {
      const valA = a[operatorSort.key];
      const valB = b[operatorSort.key];
      const order = operatorSort.direction === 'ascending' ? 1 : -1;

      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB) * order;
      if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * order;
      return 0;
    });
  }, [reportData, operatorSort]);

  const sortedOperationData = useMemo(() => {
    if (!reportData) return [];
    return [...reportData.operationData].sort((a, b) => {
      const valA = a[operationSort.key];
      const valB = b[operationSort.key];
      const order = operationSort.direction === 'ascending' ? 1 : -1;

      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB) * order;
      if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * order;
      return 0;
    });
  }, [reportData, operationSort]);

  const getEfficiencyColor = (efficiency: number) => {
    const targetStart = efficiencyKpi?.targetStart || 60;
    const targetStretch = efficiencyKpi?.targetStretch || 75;
    if (efficiency >= targetStretch) return '#16a34a'; // green-600
    if (efficiency >= targetStart) return '#f59e0b'; // amber-500
    return '#dc2626'; // red-600
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <header>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Daily Performance Report</h1>
        <p className="text-slate-600 mt-2">In-depth analysis of cost, efficiency, and performance.</p>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">Start Date</label>
                    <input type="date" id="startDate" value={dateRange.startDate} onChange={e => setDateRange(p => ({...p, startDate: e.target.value}))} className="mt-1 w-full h-10 px-2 border-slate-300 rounded-md shadow-sm text-sm"/>
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">End Date</label>
                    <input type="date" id="endDate" value={dateRange.endDate} onChange={e => setDateRange(p => ({...p, endDate: e.target.value}))} className="mt-1 w-full h-10 px-2 border-slate-300 rounded-md shadow-sm text-sm"/>
                </div>
            </div>
            <div>
                <label htmlFor="lineFilter" className="block text-sm font-medium text-slate-700">Line</label>
                <select id="lineFilter" value={filterLine} onChange={e => setFilterLine(e.target.value)} className="mt-1 w-full h-10 px-2 border-slate-300 rounded-md shadow-sm text-sm"><option value="all">All Lines</option>{lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
            </div>
            <div>
                <label htmlFor="orderFilter" className="block text-sm font-medium text-slate-700">Order</label>
                <select id="orderFilter" value={filterOrder} onChange={e => setFilterOrder(e.target.value)} className="mt-1 w-full h-10 px-2 border-slate-300 rounded-md shadow-sm text-sm"><option value="all">All Orders</option>{orders.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
            </div>
             <div>
                <label htmlFor="styleFilter" className="block text-sm font-medium text-slate-700">Style</label>
                <select id="styleFilter" value={filterStyle} onChange={e => setFilterStyle(e.target.value)} className="mt-1 w-full h-10 px-2 border-slate-300 rounded-md shadow-sm text-sm"><option value="all">All Styles</option>{styles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Total Salary Cost" value={`₹${reportData?.kpis.totalSalaryCost.toLocaleString('en-IN', {maximumFractionDigits: 0}) || '0'}`} icon={CurrencyRupeeIcon}/>
          <KpiCard title="Final Units Produced" value={reportData?.kpis.finalUnitsProduced.toLocaleString() || '0'} icon={ChartBarIcon}/>
          <KpiCard title="Avg. Cost / Unit" value={`₹${reportData?.kpis.avgCostPerUnit.toFixed(2) || '0.00'}`} icon={CurrencyRupeeIcon}/>
          <KpiCard title="Units / Headcount" value={reportData?.kpis.unitsPerHeadcount.toFixed(1) || '0.0'} icon={UsersGroupIcon}/>
      </div>

      {reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="text-base font-semibold text-slate-800 mb-4">Defect Summary</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Total Pieces Checked</span><span className="text-lg font-bold text-slate-800 font-mono">{reportData.qualitySummary.totalChecked.toLocaleString()}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Total Defective Pieces</span><span className="text-lg font-bold text-red-600 font-mono">{reportData.qualitySummary.totalDefectivePieces.toLocaleString()}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm text-slate-600">DHU %</span><span className="text-lg font-bold text-red-600 font-mono">{reportData.qualitySummary.dhu.toFixed(2)}%</span></div>
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="text-base font-semibold text-slate-800 mb-4">Top 3 Defects</h3>
                <ul className="space-y-2">{reportData.qualitySummary.topDefects.map((d, i) => (<li key={i} className="flex justify-between text-sm"><span className="text-slate-700">{d.name}</span><span className="font-semibold text-slate-800 font-mono">{d.count}</span></li>))}</ul>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="text-base font-semibold text-slate-800 mb-4">Top 3 Operators with Defects</h3>
                <ul className="space-y-2">{reportData.qualitySummary.topDefectiveOperators.map((o, i) => (<li key={i} className="flex justify-between text-sm"><span className="text-slate-700">{o.name}</span><span className="font-semibold text-slate-800 font-mono">{o.count}</span></li>))}</ul>
            </div>
        </div>
      )}

      <div className="space-y-8">
        {reportData ? (
          <>
            {/* Operator-wise Table */}
            <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center p-3">
                    <h3 className="text-lg font-semibold text-slate-800">Operator-wise Performance</h3>
                    <button onClick={() => downloadCsv(sortedOperatorData, 'operator_performance_report')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Download Report</button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-slate-200 sticky top-0 bg-white"><tr>
                        <SortableHeader label="Operator" sortKey="employeeName" sortConfig={operatorSort as any} onSort={handleOperatorSort as any} />
                        <SortableHeader label="Operation" sortKey="operationName" sortConfig={operatorSort as any} onSort={handleOperatorSort as any} />
                        <SortableHeader label="Target" sortKey="target" sortConfig={operatorSort as any} onSort={handleOperatorSort as any} className="text-right"/>
                        <SortableHeader label="Output" sortKey="output" sortConfig={operatorSort as any} onSort={handleOperatorSort as any} className="text-right"/>
                        <SortableHeader label="Efficiency %" sortKey="efficiency" sortConfig={operatorSort as any} onSort={handleOperatorSort as any} className="text-right"/>
                        <SortableHeader label="Total Cost" sortKey="totalCost" sortConfig={operatorSort as any} onSort={handleOperatorSort as any} className="text-right"/>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedOperatorData.map(row => {
                            const operation = operationsMap.get(row.operationId);
                            return (
                                <tr key={`${row.employeeId}-${row.operationId}`}>
                                    <td className="p-3 text-sm font-medium text-slate-800">{row.employeeName}</td>
                                    <td className="p-3 text-sm text-slate-600">
                                        {operation?.name}
                                        <span className="block text-xs text-slate-400">{operation?.skillType}</span>
                                    </td>
                                    <td className="p-3 text-sm text-slate-800 font-mono text-right">{row.target.toLocaleString()}</td>
                                    <td className="p-3 text-sm font-semibold text-[#2c4e8a] font-mono text-right">{row.output.toLocaleString()}</td>
                                    <td className="p-3 text-sm font-semibold text-right" style={{color: getEfficiencyColor(row.efficiency)}}>{row.efficiency.toFixed(1)}%</td>
                                    <td className="p-3 text-sm font-medium text-slate-800 font-mono text-right">₹{row.totalCost.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                </div>
            </div>
            {/* Operation-wise Table */}
            <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-lg">
                 <div className="flex justify-between items-center p-3">
                    <h3 className="text-lg font-semibold text-slate-800">Operation-wise Summary</h3>
                    <button onClick={() => downloadCsv(sortedOperationData, 'operation_summary_report')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Download Report</button>
                </div>
                 <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-slate-200 sticky top-0 bg-white"><tr>
                        <SortableHeader label="Operation" sortKey="operationName" sortConfig={operationSort as any} onSort={handleOperationSort as any} />
                        <SortableHeader label="Total Output" sortKey="totalOutput" sortConfig={operationSort as any} onSort={handleOperationSort as any} className="text-right"/>
                        <SortableHeader label="Avg Efficiency %" sortKey="avgEfficiency" sortConfig={operationSort as any} onSort={handleOperationSort as any} className="text-right"/>
                        <SortableHeader label="Total Cost" sortKey="totalCost" sortConfig={operationSort as any} onSort={handleOperationSort as any} className="text-right"/>
                        <SortableHeader label="Avg Cost/Unit" sortKey="avgCostPerUnit" sortConfig={operationSort as any} onSort={handleOperationSort as any} className="text-right"/>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedOperationData.map(row => {
                            const operation = operationsMap.get(row.operationId);
                            return (
                                <tr key={row.operationId}>
                                    <td className="p-3 text-sm font-medium text-slate-800">
                                        {row.operationName}
                                        <span className="block text-xs text-slate-400">{operation?.skillType}</span>
                                    </td>
                                    <td className="p-3 text-sm font-semibold text-[#2c4e8a] font-mono text-right">{row.totalOutput.toLocaleString()}</td>
                                    <td className="p-3 text-sm font-semibold text-right" style={{color: getEfficiencyColor(row.avgEfficiency)}}>{row.avgEfficiency.toFixed(1)}%</td>
                                    <td className="p-3 text-sm font-medium text-slate-800 font-mono text-right">₹{row.totalCost.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    <td className="p-3 text-sm text-slate-600 font-mono text-right">₹{row.avgCostPerUnit.toFixed(2)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                 </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-slate-700">No Production Data</h3>
            <p className="text-slate-500 mt-2">There is no production data recorded for the selected criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReportPage;
