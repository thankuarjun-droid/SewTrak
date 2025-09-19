import React, { useState, useMemo } from 'react';
import type { TimeStudy, ProductionEntry, MasterDataItem, Employee, Style, Operation, EndLineCheck, DailyAttendance, OperatorGrade, InLineAudit, Line, KpiSetting, GamificationSettings, LevelDefinition } from '../types';
import { ArrowUpIcon, ArrowDownIcon, SparkleIcon } from '../components/IconComponents';
import { PercentageBar } from '../components/PercentageBar';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { downloadCsv } from '../services/exportService';
import * as geminiService from '../services/geminiService';
import { AiPageAnalysisModal } from '../components/AiPageAnalysisModal';
import { markdownToHtml } from '../services/utils';
import { EmployeePerformanceModal } from '../components/EmployeePerformanceModal';

interface PerformanceAnalysisPageProps {
  timeStudies: TimeStudy[];
  productionEntries: ProductionEntry[];
  operations: Operation[];
  employees: Employee[];
  styles: Style[];
  endLineChecks: EndLineCheck[];
  dailyAttendances: DailyAttendance[];
  operatorGrades: OperatorGrade[];
  inLineAudits: InLineAudit[];
  lines: Line[];
  kpiSettings: KpiSetting[];
  gamificationSettings: GamificationSettings;
  levelDefinitions: LevelDefinition[];
}

type SortKey = 'employeeName' | 'standardCapacity' | 'actualPerformance' | 'targetSmv' | 'efficiency';

const PerformanceAnalysisPage = (props: PerformanceAnalysisPageProps) => {
  const { timeStudies, productionEntries, operations, employees, styles, endLineChecks, dailyAttendances, operatorGrades, inLineAudits, lines, kpiSettings, gamificationSettings, levelDefinitions } = props;
  const [selectedOperationId, setSelectedOperationId] = useState<string>('');
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{key: SortKey, direction: 'asc' | 'desc'}>({key: 'employeeName', direction: 'asc'});
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [aiAnalysis, setAiAnalysis] = useState<Map<string, {loading: boolean, analysis: string}>>(new Map());
  const [isPageAnalysisModalOpen, setIsPageAnalysisModalOpen] = useState(false);
  const [pageAnalysisContent, setPageAnalysisContent] = useState('');
  const [isPageAnalysisLoading, setIsPageAnalysisLoading] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  const employeesMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);
  const stylesMap = useMemo(() => new Map(styles.map(s => [s.id, s])), [styles]);
  const styleOptions = useMemo(() => styles.map(s => ({value: s.id, label: s.name})), [styles]);
  const efficiencyKpi = useMemo(() => kpiSettings.find(k => k.kpi === 'Average Line Efficiency'), [kpiSettings]);
  
  const analysisData = useMemo(() => {
    if (!selectedOperationId) return [];

    const relevantStudies = (timeStudies || []).filter(ts => 
      ts.operationId === selectedOperationId &&
      (selectedStyleIds.length === 0 || selectedStyleIds.includes(ts.styleId))
    );
    const relevantProduction = (productionEntries || []).filter(pe => 
      pe.operation === selectedOperationId &&
      (selectedStyleIds.length === 0 || selectedStyleIds.includes(pe.styleNumber))
    );

    const dataByEmployee = new Map<string, { employeeId: string, employeeName: string, standardCapacity: number; actualPerformance: number; hoursWorked: number, totalOutput: number, breakdown: any[], targetSmv: number, efficiency: number }>();

    // Get Standard Capacity from Time Studies
    relevantStudies.forEach(study => {
      const standardCapacity = 3600 / study.averageStandardTime;
      const style = stylesMap.get(study.styleId);
      const opBulletinItem = style?.operationBulletin?.find(op => op.operationId === study.operationId);
      const targetSmv = opBulletinItem ? (opBulletinItem.pickupTime + opBulletinItem.sewingTime + opBulletinItem.trimAndDisposalTime) / 60 : 0;
      
      const avgPickup = study.cycles.reduce((sum, c) => sum + c.pickupTime, 0) / study.cycles.length;
      const avgSewing = study.cycles.reduce((sum, c) => sum + c.sewingTime, 0) / study.cycles.length;
      const avgTD = study.cycles.reduce((sum, c) => sum + c.trimAndDisposalTime, 0) / study.cycles.length;
      
      const breakdown = [
            { label: 'P', value: avgPickup, color: '#38bdf8' },
            { label: 'S', value: avgSewing, color: '#3b82f6' },
            { label: 'T&D', value: avgTD, color: '#f59e0b' },
      ];

      if (!dataByEmployee.has(study.employeeId)) {
        dataByEmployee.set(study.employeeId, {
          employeeId: study.employeeId,
          employeeName: employeesMap.get(study.employeeId)?.name || 'Unknown',
          standardCapacity: 0,
          actualPerformance: 0,
          hoursWorked: 0,
          totalOutput: 0,
          breakdown: [],
          targetSmv: 0,
          efficiency: 0,
        });
      }
      const data = dataByEmployee.get(study.employeeId)!;
      // If multiple studies exist, average them (simple approach)
      data.standardCapacity = (data.standardCapacity + standardCapacity) / (data.standardCapacity > 0 ? 2 : 1);
      data.targetSmv = (data.targetSmv + targetSmv) / (data.targetSmv > 0 ? 2 : 1);
      data.breakdown = breakdown;
    });

     // Get Actual Performance from Production Entries
    const entriesByEmployee = relevantProduction.reduce((acc, entry) => {
        if(!acc[entry.employeeId]) acc[entry.employeeId] = [];
        acc[entry.employeeId].push(entry);
        return acc;
    }, {} as Record<string, ProductionEntry[]>);

    Object.keys(entriesByEmployee).forEach(empId => {
        if (!dataByEmployee.has(empId)) {
            dataByEmployee.set(empId, {
                employeeId: empId,
                employeeName: employeesMap.get(empId)?.name || 'Unknown',
                standardCapacity: 0, actualPerformance: 0, hoursWorked: 0, totalOutput: 0, breakdown: [], targetSmv: 0, efficiency: 0,
            });
        }
        
        const data = dataByEmployee.get(empId)!;
        const totalOutput = entriesByEmployee[empId].reduce((sum, e) => sum + e.productionQuantity, 0);
        const uniqueHours = new Set(entriesByEmployee[empId].map(e => `${e.timestamp.split('T')[0]}-${e.hourCounter}`)).size;
        
        const totalSmvProduced = entriesByEmployee[empId].reduce((sum, entry) => {
            const style = stylesMap.get(entry.styleNumber);
            const op = style?.operationBulletin?.find(ob => ob.operationId === entry.operation);
            const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
            return sum + (smv * entry.productionQuantity);
        }, 0);

        data.totalOutput = totalOutput;
        data.hoursWorked = uniqueHours;
        data.actualPerformance = uniqueHours > 0 ? totalOutput / uniqueHours : 0;
        data.efficiency = uniqueHours > 0 ? (totalSmvProduced / (uniqueHours * 60)) * 100 : 0;
    });

    return Array.from(dataByEmployee.values());
  }, [selectedOperationId, selectedStyleIds, timeStudies, productionEntries, employeesMap, stylesMap]);

  const sortedData = useMemo(() => {
    return [...analysisData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      const order = sortConfig.direction === 'asc' ? 1 : -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') return aVal.localeCompare(bVal) * order;
      if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * order;
      return 0;
    });
  }, [analysisData, sortConfig]);

  const requestSort = (key: SortKey) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedRowIds(new Set(sortedData.map(d => d.employeeId)));
    else setSelectedRowIds(new Set());
  }
  
  const handleSelectRow = (empId: string) => {
    setSelectedRowIds(prev => {
        const newSet = new Set(prev);
        if(newSet.has(empId)) newSet.delete(empId);
        else newSet.add(empId);
        return newSet;
    })
  }
  
  const handleGetAnalysis = async (employeeId: string) => {
      const data = analysisData.find(d => d.employeeId === employeeId);
      if (!data) return;

      setAiAnalysis(prev => new Map(prev).set(employeeId, { loading: true, analysis: '' }));
      try {
          const result = await geminiService.getOperatorPerformanceAnalysis(data);
          setAiAnalysis(prev => new Map(prev).set(employeeId, { loading: false, analysis: result }));
      } catch (err) {
          setAiAnalysis(prev => new Map(prev).set(employeeId, { loading: false, analysis: 'Error getting analysis.' }));
      }
  };

  const handleGeneratePageAnalysis = async () => {
    if(sortedData.length === 0) return;
    const opName = operations.find(o => o.id === selectedOperationId)?.name || 'Selected Operation';
    setIsPageAnalysisModalOpen(true);
    setIsPageAnalysisLoading(true);
    try {
        const result = await geminiService.getPageLevelAnalysis(sortedData, opName);
        setPageAnalysisContent(markdownToHtml(result));
    } catch (err) {
        setPageAnalysisContent('<p>Error generating analysis.</p>');
    } finally {
        setIsPageAnalysisLoading(false);
    }
  }

  const handleRowClick = (employeeId: string) => {
      const employee = employees.find(e => e.id === employeeId);
      if (employee) setViewingEmployee(employee);
  }
  
  const getEfficiencyColor = (efficiency: number) => {
    const targetStart = efficiencyKpi?.targetStart || 60;
    const targetStretch = efficiencyKpi?.targetStretch || 75;
    if (efficiency >= targetStretch) return '#16a34a';
    if (efficiency >= targetStart) return '#f59e0b';
    return '#dc2626';
  };

  const allDataForModal = {
    productionEntries: props.productionEntries,
    endLineChecks: props.endLineChecks,
    dailyAttendances: props.dailyAttendances,
    styles: props.styles,
    operations: props.operations,
    operatorGrades: props.operatorGrades,
    inLineAudits: props.inLineAudits,
    lines: props.lines,
    levelDefinitions: props.levelDefinitions,
    gamificationSettings: props.gamificationSettings
  };

  return (
    <>
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <header>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Operator Performance Analysis</h1>
          <p className="text-slate-600 mt-2">Compare operator standard capacity vs. actual performance.</p>
        </header>
        
        <div className="bg-white p-4 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={selectedOperationId} onChange={e => setSelectedOperationId(e.target.value)} className="h-10 px-3 border-slate-300 rounded-md">
                <option value="">-- Select an Operation --</option>
                {operations.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
            </select>
            <MultiSelectDropdown options={styleOptions} selectedValues={selectedStyleIds} onChange={setSelectedStyleIds} placeholder="Filter by Style (optional)" />
        </div>

        <main className="bg-white p-2 sm:p-4 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center p-2 mb-2">
                <button onClick={handleGeneratePageAnalysis} disabled={!selectedOperationId || sortedData.length === 0} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 font-semibold rounded-md hover:bg-indigo-200 disabled:opacity-50">
                    <SparkleIcon className="w-4 h-4" />
                    Analyze This Page
                </button>
                <button onClick={() => downloadCsv(sortedData, 'performance_analysis')} disabled={sortedData.length === 0} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:text-slate-400">
                    Download Report
                </button>
            </div>
             <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 sticky top-0 bg-white">
                        <tr>
                            <th className="p-2 w-8"><input type="checkbox" onChange={handleSelectAll} checked={selectedRowIds.size === sortedData.length && sortedData.length > 0} /></th>
                            <th className="p-2">Employee</th>
                            <th className="p-2 w-48">Work Method Breakdown (s)</th>
                            <th className="p-2 text-right">Standard Capacity (units/hr)</th>
                            <th className="p-2 text-right">Actual Performance (units/hr)</th>
                            <th className="p-2 text-right">Efficiency vs SMV</th>
                            <th className="p-2 text-center">AI Analysis</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map(row => {
                            const analysis = aiAnalysis.get(row.employeeId);
                            return (
                                <tr key={row.employeeId} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => handleRowClick(row.employeeId)}>
                                    <td className="p-2" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedRowIds.has(row.employeeId)} onChange={() => handleSelectRow(row.employeeId)} /></td>
                                    <td className="p-2">
                                        <div className="font-medium text-slate-800">{row.employeeName}</div>
                                        <div className="text-xs text-slate-500">{employeesMap.get(row.employeeId)?.designation}</div>
                                    </td>
                                    <td className="p-2 w-48">
                                        {row.breakdown.length > 0 ? <PercentageBar data={row.breakdown} compact /> : <span className="text-xs text-slate-400">No study</span>}
                                    </td>
                                    <td className="p-2 text-right font-mono">{row.standardCapacity > 0 ? row.standardCapacity.toFixed(0) : 'N/A'}</td>
                                    <td className="p-2 text-right font-mono">{row.actualPerformance.toFixed(0)}</td>
                                    <td className="p-2 text-right font-mono font-semibold" style={{ color: getEfficiencyColor(row.efficiency) }}>
                                        {row.efficiency.toFixed(1)}%
                                    </td>
                                    <td className="p-2 text-center" onClick={e => e.stopPropagation()}>
                                        {analysis?.loading ? (
                                            <span className="text-xs text-slate-400">Loading...</span>
                                        ) : analysis?.analysis ? (
                                            <span className="text-xs text-slate-500 italic truncate" title={analysis.analysis}>{analysis.analysis}</span>
                                        ) : (
                                            <button onClick={() => handleGetAnalysis(row.employeeId)} className="p-1 text-indigo-600 hover:text-indigo-800" title="Get AI Analysis">
                                                <SparkleIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
             </div>
        </main>
      </div>
      {isPageAnalysisModalOpen && (
          <AiPageAnalysisModal
            isOpen={isPageAnalysisModalOpen}
            onClose={() => setIsPageAnalysisModalOpen(false)}
            content={pageAnalysisContent}
            isLoading={isPageAnalysisLoading}
            operationName={operations.find(o => o.id === selectedOperationId)?.name || ''}
          />
      )}
      {viewingEmployee && (
          <EmployeePerformanceModal
            isOpen={!!viewingEmployee}
            onClose={() => setViewingEmployee(null)}
            employee={viewingEmployee}
            allData={allDataForModal}
          />
      )}
    </>
  );
};
export default PerformanceAnalysisPage;