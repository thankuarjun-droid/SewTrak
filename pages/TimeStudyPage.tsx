
import React, { useState, useMemo, useCallback } from 'react';
import type { Line, Employee, LineAllocation, Style, Machine, TimeStudy, AllowanceSettings, Order, OperatorGrade, GradePerformanceSetting, Operation } from '../types';
import { TimeStudySession } from '../components/TimeStudySession';
import { EditTimeStudyModal } from '../components/EditTimeStudyModal';
import { downloadCsv } from '../services/exportService';
import { PencilIcon } from '../components/IconComponents';

interface TimeStudyPageProps {
  lines: Line[];
  employees: Employee[];
  lineAllocations: LineAllocation[];
  orders: Order[];
  operations: Operation[];
  styles: Style[];
  machines: Machine[];
  timeStudies: TimeStudy[];
  allowanceSettings: AllowanceSettings;
  gradePerformanceSettings: GradePerformanceSetting[];
  operatorGrades: OperatorGrade[];
  onSaveTimeStudy: (study: Omit<TimeStudy, 'id' | 'timestamp'>) => void;
  onUpdateTimeStudy: (study: TimeStudy) => void;
}

const TimeStudyPage = (props: TimeStudyPageProps) => {
  const [activeTab, setActiveTab] = useState<'byLine' | 'free'>('byLine');
  
  const [session, setSession] = useState<{ employeeId: string; operationId: string; styleId: string; machine: Machine; wasFreeStudy: boolean } | null>(null);
  const [editingStudy, setEditingStudy] = useState<TimeStudy | null>(null);

  // State for "By Line" tab
  const [selectedLineId, setSelectedLineId] = useState<string>(props.lines[0]?.id || '');
  
  // State for "Free Study" tab
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedOperationId, setSelectedOperationId] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState('');
  
  // State for history filtering & selection
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterOperation, setFilterOperation] = useState('all');
  const [selectedStudyIds, setSelectedStudyIds] = useState<Set<string>>(new Set());


  const employeesMap = useMemo(() => new Map(props.employees.map(e => [e.id, e])), [props.employees]);
  const operationsMap = useMemo(() => new Map(props.operations.map(o => [o.id, o])), [props.operations]);
  const stylesMap = useMemo(() => new Map(props.styles.map(s => [s.id, s])), [props.styles]);
  const gradesMap = useMemo(() => new Map(props.operatorGrades.map(g => [g.id, g.name])), [props.operatorGrades]);
  const machinesMap = useMemo(() => new Map(props.machines.map(m => [m.id, m])), [props.machines]);
  
  const activeAllocation = useMemo(() => {
    if (!selectedLineId) return null;
    return (props.lineAllocations || [])
      .filter(a => a.lineNumber === selectedLineId)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0];
  }, [selectedLineId, props.lineAllocations]);

  const styleForLine = useMemo(() => {
      if(!activeAllocation) return null;
      const order = props.orders.find(o => o.id === activeAllocation.orderNumber);
      return stylesMap.get(order?.styleId || '');
  }, [activeAllocation, stylesMap, props.orders]);

  const getMachineForOperation = useCallback((opId: string, style: Style | undefined): Machine | undefined => {
    if(!style) return undefined;
    const machineId = style.operationBulletin.find(op => op.operationId === opId)?.machineId || '';
    return machinesMap.get(machineId);
  }, [machinesMap]);

  const operatorsOnLine = useMemo(() => {
    if (!activeAllocation) return [];
    const opList: { employeeId: string; operationId: string }[] = [];
    (activeAllocation.assignments || []).forEach(assignment => {
      (assignment.employeeIds || []).forEach(empId => {
        opList.push({ employeeId: empId, operationId: assignment.operationId });
      });
    });
    return opList;
  }, [activeAllocation]);

  const handleStartStudy = (employeeId: string, operationId: string) => {
    const machine = getMachineForOperation(operationId, styleForLine);
    if (!machine || !styleForLine) {
      alert("Cannot start study. The selected operation does not have an associated machine in the style's operation bulletin.");
      return;
    }
    setSession({ employeeId, operationId, styleId: styleForLine.id, machine, wasFreeStudy: false });
  };
  
  const handleStartFreeStudy = () => {
    if (!selectedEmployeeId || !selectedOperationId || !selectedStyleId) {
        alert("Please select an employee, operation, and style for the free study.");
        return;
    }
    const style = stylesMap.get(selectedStyleId);
    const machine = getMachineForOperation(selectedOperationId, style);

    if (!machine) {
       alert("Could not determine a machine for this operation based on the selected style's bulletin.");
       return;
    }
    setSession({ employeeId: selectedEmployeeId, operationId: selectedOperationId, styleId: selectedStyleId, machine, wasFreeStudy: true });
  }

  const handleFinishStudy = (study: Omit<TimeStudy, 'id' | 'timestamp'>) => {
    props.onSaveTimeStudy(study);
    setSession(null);
  }
  
  const handleUpdateStudy = (study: TimeStudy) => {
    props.onUpdateTimeStudy(study);
    setEditingStudy(null);
  };

  const getProposedGrade = (study: TimeStudy): string => {
      const style = stylesMap.get(study.styleId);
      const opBulletinItem = style?.operationBulletin?.find(op => op.operationId === study.operationId);
      const smv = opBulletinItem ? (opBulletinItem.pickupTime + opBulletinItem.sewingTime + opBulletinItem.trimAndDisposalTime) / 60 : 0;
      if (smv === 0 || study.averageObservedTime === 0) return 'N/A';
      
      const smvInSeconds = smv * 60;
      const efficiency = (smvInSeconds / study.averageObservedTime) * 100;
      
      const matchedGrade = props.gradePerformanceSettings
          .sort((a,b) => a.minEfficiency - b.minEfficiency)
          .find(g => efficiency >= g.minEfficiency && efficiency <= g.maxEfficiency);

      return matchedGrade ? gradesMap.get(matchedGrade.gradeId) || 'N/A' : 'Ungraded';
  };

  const filteredStudies = useMemo(() => {
    return (props.timeStudies || []).filter(s => 
        (filterEmployee === 'all' || s.employeeId === filterEmployee) &&
        (filterOperation === 'all' || s.operationId === filterOperation)
    );
  }, [props.timeStudies, filterEmployee, filterOperation]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudyIds(new Set(filteredStudies.map(s => s.id)));
    } else {
      setSelectedStudyIds(new Set());
    }
  };

  const handleSelectSingle = (id: string) => {
    setSelectedStudyIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleDownloadSelected = () => {
    const dataToExport = (props.timeStudies || []).filter(s => selectedStudyIds.has(s.id)).map(s => {
        const employee = employeesMap.get(s.employeeId);
        const style = stylesMap.get(s.styleId);
        const opBulletinItem = style?.operationBulletin?.find(op => op.operationId === s.operationId);
        // FIX: Replaced `op` with `opBulletinItem` as `op` is out of scope.
        const smv = opBulletinItem ? (opBulletinItem.pickupTime + opBulletinItem.sewingTime + opBulletinItem.trimAndDisposalTime) / 60 : 0;
        const smvInSeconds = smv * 60;
        const efficiency = s.averageObservedTime > 0 ? (smvInSeconds / s.averageObservedTime) * 100 : 0;
        
        const avgPickup = s.cycles.reduce((sum, c) => sum + c.pickupTime, 0) / s.cycles.length;
        const avgSewing = s.cycles.reduce((sum, c) => sum + c.sewingTime, 0) / s.cycles.length;
        const avgTrimDispose = s.cycles.reduce((sum, c) => sum + c.trimAndDisposalTime, 0) / s.cycles.length;

        return {
            date: new Date(s.timestamp).toLocaleDateString(),
            employee_name: employee?.name,
            operation: operationsMap.get(s.operationId)?.name,
            style: stylesMap.get(s.styleId)?.name,
            machine: s.machineName,
            avg_pickup_s: avgPickup.toFixed(3),
            avg_sewing_s: avgSewing.toFixed(3),
            avg_trim_dispose_s: avgTrimDispose.toFixed(3),
            avg_observed_time_s: s.averageObservedTime.toFixed(3),
            avg_standard_time_s: s.averageStandardTime.toFixed(3),
            capacity_units_per_hour: (3600 / s.averageStandardTime).toFixed(0),
            efficiency_percent: efficiency.toFixed(1),
            proposed_grade: getProposedGrade(s),
        }
    });
    downloadCsv(dataToExport, 'selected_time_studies');
  }


  if (session) {
    return <TimeStudySession 
              employee={employeesMap.get(session.employeeId)!}
              operationName={operationsMap.get(session.operationId)?.name || ''}
              operationId={session.operationId}
              styleId={session.styleId}
              machine={session.machine}
              allowanceSettings={props.allowanceSettings}
              onFinish={handleFinishStudy}
              onCancel={() => setSession(null)}
              wasFreeStudy={session.wasFreeStudy}
           />
  }

  return (
    <>
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <header>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Time Study</h1>
        <p className="text-slate-600 mt-2">Conduct time studies for operators to establish standard times.</p>
      </header>

      <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button onClick={() => setActiveTab('byLine')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'byLine' ? 'border-[#2c4e8a] text-[#2c4e8a]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>By Production Line</button>
              <button onClick={() => setActiveTab('free')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'free' ? 'border-[#2c4e8a] text-[#2c4e8a]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Free Study</button>
          </nav>
      </div>
      
      {activeTab === 'byLine' && (
          <div>
            <div className="max-w-md my-4">
              <label htmlFor="line-select" className="block text-sm font-medium text-slate-700">Select Production Line</label>
              <select id="line-select" value={selectedLineId} onChange={e => setSelectedLineId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 h-10 text-base border-slate-300 rounded-md shadow-sm">
                {props.lines.map(line => (<option key={line.id} value={line.id}>{line.name}</option>))}
              </select>
            </div>
            {!activeAllocation ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-md"><p className="text-slate-500">No active allocation plan for this line.</p></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {operatorsOnLine.map(({ employeeId, operationId }) => {
                        const employee = employeesMap.get(employeeId);
                        const operationName = operationsMap.get(operationId)?.name;
                        if (!employee || !operationName) return null;
                        return (
                          <div key={employeeId} className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center text-center space-y-3">
                              <h3 className="font-bold text-base text-slate-800">{employee.name}</h3>
                              <p className="text-sm text-indigo-600 font-semibold">{operationName}</p>
                              <button onClick={() => handleStartStudy(employeeId, operationId)} className="w-full px-4 py-2 bg-[#2c4e8a] text-white font-semibold rounded-md hover:bg-[#213a69]">
                                  Start Study
                              </button>
                          </div>
                        )
                    })}
                </div>
            )}
          </div>
      )}

      {activeTab === 'free' && (
          <div className="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto my-4 space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Free Study Setup</h2>
               <div>
                  <label htmlFor="employee-select" className="block text-sm font-medium text-slate-700">Select Employee</label>
                  <select id="employee-select" value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 h-10 text-base border-slate-300 rounded-md shadow-sm">
                    <option value="" disabled>Choose an employee</option>
                    {props.employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
                  </select>
               </div>
                <div>
                  <label htmlFor="style-select" className="block text-sm font-medium text-slate-700">Select Style (to determine machine & SMV)</label>
                  <select id="style-select" value={selectedStyleId} onChange={e => setSelectedStyleId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 h-10 text-base border-slate-300 rounded-md shadow-sm">
                    <option value="" disabled>Choose a style</option>
                    {props.styles.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
               </div>
               <div>
                  <label htmlFor="operation-select" className="block text-sm font-medium text-slate-700">Select Operation</label>
                  <select id="operation-select" value={selectedOperationId} onChange={e => setSelectedOperationId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 h-10 text-base border-slate-300 rounded-md shadow-sm">
                    <option value="" disabled>Choose an operation</option>
                    {props.operations.map(op => (<option key={op.id} value={op.id}>{op.name}</option>))}
                  </select>
               </div>
              <button onClick={handleStartFreeStudy} disabled={!selectedEmployeeId || !selectedOperationId} className="w-full px-4 py-2 bg-[#2c4e8a] text-white font-semibold rounded-md hover:bg-[#213a69] disabled:bg-slate-300">
                Start Study
              </button>
          </div>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-slate-800">Completed Studies</h2>
          <button onClick={handleDownloadSelected} disabled={selectedStudyIds.size === 0} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:text-slate-400">Download Selected ({selectedStudyIds.size})</button>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="grid grid-cols-2 gap-4 mb-4">
                <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="h-10 px-3 border-slate-300 rounded-md text-sm"><option value="all">All Employees</option>{props.employees.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select>
                <select value={filterOperation} onChange={e => setFilterOperation(e.target.value)} className="h-10 px-3 border-slate-300 rounded-md text-sm"><option value="all">All Operations</option>{props.operations.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select>
            </div>
              {filteredStudies.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">No time studies match the current filters.</p>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 sticky top-0 bg-white">
                          <tr className="text-slate-600">
                              <th className="p-2 w-8"><input type="checkbox" onChange={handleSelectAll} checked={selectedStudyIds.size === filteredStudies.length && filteredStudies.length > 0} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"/></th>
                              <th className="p-2">Employee / Operation</th>
                              <th className="p-2 text-center">Avg Time (P/S/T&amp;D)</th>
                              <th className="p-2 text-right">Observed</th>
                              <th className="p-2 text-right">Standard</th>
                              <th className="p-2 text-right">Capacity</th>
                              <th className="p-2 text-right">Proposed Grade</th>
                              <th className="p-2 text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {filteredStudies.map(study => {
                              const capacity = study.averageStandardTime > 0 ? 3600 / study.averageStandardTime : 0;
                              const avgPickup = study.cycles.reduce((sum, c) => sum + c.pickupTime, 0) / study.cycles.length;
                              const avgSewing = study.cycles.reduce((sum, c) => sum + c.sewingTime, 0) / study.cycles.length;
                              const avgTrimDispose = study.cycles.reduce((sum, c) => sum + c.trimAndDisposalTime, 0) / study.cycles.length;
                              return (
                              <tr key={study.id} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="p-2"><input type="checkbox" onChange={() => handleSelectSingle(study.id)} checked={selectedStudyIds.has(study.id)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"/></td>
                                  <td className="p-2 font-medium">
                                    {employeesMap.get(study.employeeId)?.name}
                                    <span className="block text-xs text-slate-500">{operationsMap.get(study.operationId)?.name || 'N/A'}</span>
                                  </td>
                                  <td className="p-2 font-mono text-xs text-center">{avgPickup.toFixed(2)}/{avgSewing.toFixed(2)}/{avgTrimDispose.toFixed(2)}</td>
                                  <td className="p-2 text-right font-mono">{study.averageObservedTime.toFixed(3)}s</td>
                                  <td className="p-2 text-right font-mono font-semibold">{study.averageStandardTime.toFixed(3)}s</td>
                                  <td className="p-2 text-right font-mono font-bold text-indigo-700">{capacity.toFixed(0)}</td>
                                  <td className="p-2 text-right font-semibold">{getProposedGrade(study)}</td>
                                  <td className="p-2 text-center">
                                      <button onClick={() => setEditingStudy(study)} className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-md" aria-label="Edit Study">
                                        <PencilIcon className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          )})}
                      </tbody>
                  </table>
                  </div>
              )}
          </div>
      </div>
    </div>
    {editingStudy && (
        <EditTimeStudyModal
            isOpen={!!editingStudy}
            onClose={() => setEditingStudy(null)}
            study={editingStudy}
            onSave={handleUpdateStudy}
            allowanceSettings={props.allowanceSettings}
            machine={machinesMap.get(editingStudy.machineId)!}
            employee={employeesMap.get(editingStudy.employeeId)!}
            operationName={operationsMap.get(editingStudy.operationId)?.name || ''}
        />
    )}
    </>
  );
};

export default TimeStudyPage;
