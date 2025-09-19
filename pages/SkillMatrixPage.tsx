import React, { useState, useMemo } from 'react';
import type { Employee, Operation, ProductionEntry, Style, MasterDataItem, OperatorGrade, Machine, Line, KpiSetting } from '../types';
import { downloadCsv } from '../services/exportService';

interface SkillMatrixPageProps {
  employees: Employee[];
  operations: Operation[];
  productionEntries: ProductionEntry[];
  styles: Style[];
  lines: Line[];
  operatorGrades: OperatorGrade[];
  machines: Machine[];
  kpiSettings: KpiSetting[];
}

const SkillMatrixPage = ({ employees, operations = [], productionEntries, styles, lines, operatorGrades, machines, kpiSettings }: SkillMatrixPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLine, setFilterLine] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');

  const stylesMap = useMemo(() => new Map(styles.map(s => [s.id, s])), [styles]);
  const machinesMap = useMemo(() => new Map(machines.map(m => [m.id, m.name])), [machines]);
  const efficiencyKpi = useMemo(() => kpiSettings.find(k => k.kpi === 'Average Line Efficiency'), [kpiSettings]);

  const operationsByMachine = useMemo(() => {
    const grouped = new Map<string, Operation[]>();
    operations.forEach(op => {
      // Find which machine this operation is primarily associated with
      let machineId = 'M-MAN'; // Default to manual
      for (const style of styles) {
        const bulletinItem = style.operationBulletin?.find(b => b.operationId === op.id);
        if (bulletinItem) {
          machineId = bulletinItem.machineId;
          break;
        }
      }
      if (!grouped.has(machineId)) {
        grouped.set(machineId, []);
      }
      grouped.get(machineId)!.push(op);
    });
    return Array.from(grouped.entries()).sort((a,b) => (machinesMap.get(a[0]) || '').localeCompare(machinesMap.get(b[0]) || ''));
  }, [operations, styles, machinesMap]);
  
  const allMatrixOperations = useMemo(() => operationsByMachine.flatMap(([, ops]) => ops), [operationsByMachine]);

  const skillData = useMemo(() => {
    const matrix = new Map<string, Map<string, { totalUnits: number; avgCapacity: number; efficiency: number }>>();

    const entriesByEmployeeOp = new Map<string, ProductionEntry[]>();
    (productionEntries || []).forEach(entry => {
      const key = `${entry.employeeId}-${entry.operation}`;
      if (!entriesByEmployeeOp.has(key)) entriesByEmployeeOp.set(key, []);
      entriesByEmployeeOp.get(key)!.push(entry);
    });

    for (const [key, entries] of entriesByEmployeeOp.entries()) {
      const [employeeId, operationId] = key.split('-');
      
      const totalUnits = entries.reduce((sum, e) => sum + e.productionQuantity, 0);
      
      const uniqueHours = new Set(entries.map(e => `${e.timestamp.split('T')[0]}-${e.hourCounter}`)).size;
      
      const totalSmvEarned = entries.reduce((sum, e) => {
        const style = stylesMap.get(e.styleNumber);
        const opBulletinItem = style?.operationBulletin?.find(ob => ob.operationId === e.operation);
        const smv = opBulletinItem ? (opBulletinItem.pickupTime + opBulletinItem.sewingTime + opBulletinItem.trimAndDisposalTime) / 60 : 0;
        return sum + (e.productionQuantity * smv);
      }, 0);
      
      const avgCapacity = uniqueHours > 0 ? totalUnits / uniqueHours : 0;
      const efficiency = uniqueHours > 0 ? (totalSmvEarned / (uniqueHours * 60)) * 100 : 0;

      if (!matrix.has(employeeId)) matrix.set(employeeId, new Map());
      matrix.get(employeeId)!.set(operationId, { totalUnits, avgCapacity, efficiency });
    }
    return matrix;
  }, [productionEntries, stylesMap]);
  
  const filteredEmployees = useMemo(() => {
    return (employees || []).filter(emp => {
        const lineMatch = filterLine === 'all' || emp.currentLineId === filterLine;
        const gradeMatch = filterGrade === 'all' || emp.operatorGradeId === filterGrade;
        const searchMatch = !searchTerm || (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        return lineMatch && gradeMatch && searchMatch;
    }).sort((a,b) => (a.name || '').localeCompare(b.name || ''));
  }, [employees, searchTerm, filterLine, filterGrade]);
  
  const handleDownload = () => {
      const dataToExport: any[] = [];
      filteredEmployees.forEach(emp => {
          const employeeData: Record<string, any> = { employee_name: emp.name };
          allMatrixOperations.forEach(op => {
              const skill = skillData.get(emp.id)?.get(op.id);
              employeeData[`${op.name}_efficiency`] = skill ? skill.efficiency.toFixed(1) : null;
              employeeData[`${op.name}_capacity`] = skill ? skill.avgCapacity.toFixed(0) : null;
              employeeData[`${op.name}_total_units`] = skill ? skill.totalUnits : null;
          });
          dataToExport.push(employeeData);
      });
      downloadCsv(dataToExport, 'skill_matrix');
  };

  const getEfficiencyColor = (efficiency: number) => {
      const targetStart = efficiencyKpi?.targetStart || 70;
      const targetStretch = efficiencyKpi?.targetStretch || 85;
      if (efficiency >= targetStretch) return 'bg-green-100 text-green-800';
      if (efficiency >= targetStart) return 'bg-amber-100 text-amber-800';
      if (efficiency > 0) return 'bg-red-100 text-red-800';
      return 'bg-slate-50 text-slate-400';
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-0">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Employee Skill Matrix</h1>
          <p className="text-slate-600 mt-2">Visualize workforce capabilities and performance across all operations.</p>
        </div>
        <button onClick={handleDownload} className="mt-4 sm:mt-0 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800">
          Download Data
        </button>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" placeholder="Search employee..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full h-10 px-3 border-slate-300 rounded-md text-sm" />
          <select value={filterLine} onChange={e => setFilterLine(e.target.value)} className="w-full h-10 px-3 border-slate-300 rounded-md text-sm">
            <option value="all">All Lines</option>
            {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="w-full h-10 px-3 border-slate-300 rounded-md text-sm">
            <option value="all">All Grades</option>
            {operatorGrades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      <main className="bg-white rounded-2xl shadow-lg overflow-x-auto">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-white z-20">
              <tr className="border-b">
                <th className="p-2 border-r border-b font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10 w-48 min-w-[192px]">Employee</th>
                {operationsByMachine.map(([machineId, ops]) => (
                  <th key={machineId} colSpan={ops.length} className="p-2 border-b border-r text-center font-semibold text-slate-700 bg-slate-100">
                    {machinesMap.get(machineId)}
                  </th>
                ))}
              </tr>
              <tr className="border-b">
                 <th className="p-2 border-r font-medium text-slate-500 bg-slate-50 sticky left-0 z-10"></th>
                 {allMatrixOperations.map(op => (
                     <th key={op.id} className="p-2 border-r font-medium text-slate-500 text-center transform -rotate-45 h-24 w-12 min-w-[48px]">
                        <div className="whitespace-nowrap translate-x-3 -translate-y-8">{op.name}</div>
                    </th>
                 ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/50">
                  <td className="p-2 border-r font-medium text-slate-800 bg-slate-50 sticky left-0 z-10 w-48 min-w-[192px]">{emp.name}</td>
                  {allMatrixOperations.map(op => {
                      const skill = skillData.get(emp.id)?.get(op.id);
                      return (
                          <td key={op.id} className={`p-1 border-r text-center ${getEfficiencyColor(skill?.efficiency || 0)}`}>
                            {skill ? (
                                <div className="text-[10px] leading-tight font-semibold">
                                    <div title={`Efficiency: ${skill.efficiency.toFixed(1)}%`}>{skill.efficiency.toFixed(0)}%</div>
                                    <div className="font-normal text-slate-600" title={`Avg. Capacity: ${skill.avgCapacity.toFixed(0)}/hr`}>{skill.avgCapacity.toFixed(0)}</div>
                                    <div className="font-light text-slate-500" title={`Total Units: ${skill.totalUnits}`}>{skill.totalUnits}</div>
                                </div>
                            ) : (
                                <span className="text-slate-300">-</span>
                            )}
                          </td>
                      )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default SkillMatrixPage;