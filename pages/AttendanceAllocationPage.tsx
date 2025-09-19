import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, Line, LineAllocation, DailyAttendance, OperatorGrade, Page } from '../types';

const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const adjustedToday = new Date(today.getTime() - (offset*60*1000));
    return adjustedToday.toISOString().split('T')[0];
}

interface AttendanceAllocationPageProps {
  employees: Employee[];
  lines: Line[];
  operatorGrades: OperatorGrade[];
  allocations: LineAllocation[];
  dailyAttendances: DailyAttendance[];
  onSaveAttendance: (attendance: DailyAttendance) => void;
  onNavigate: (page: Page) => void;
}

const KpiCard = ({ title, value, colorClass = 'text-slate-900' }: { title: string; value: string | number; colorClass?: string }) => (
  <div className="bg-white p-4 rounded-xl shadow-md text-center">
    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    <p className={`mt-1 text-4xl font-semibold ${colorClass}`}>{value}</p>
  </div>
);

const AttendanceAllocationPage = ({ employees, lines, operatorGrades, allocations, dailyAttendances, onSaveAttendance, onNavigate }: AttendanceAllocationPageProps) => {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  const gradesMap = useMemo(() => new Map(operatorGrades.map(g => [g.id, g.name])), [operatorGrades]);

  useEffect(() => {
    const attendanceRecord = (dailyAttendances || []).find(a => a.date === selectedDate);
    setPresentIds(new Set(attendanceRecord?.presentEmployeeIds || []));
    setHasChanges(false);
  }, [selectedDate, dailyAttendances]);

  const employeesByLine = useMemo(() => {
    return (employees || []).reduce((acc, emp) => {
      if (!acc[emp.currentLineId]) {
        acc[emp.currentLineId] = [];
      }
      acc[emp.currentLineId].push(emp);
      return acc;
    }, {} as Record<string, Employee[]>);
  }, [employees]);

  const handleTogglePresent = (empId: string) => {
    setPresentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(empId)) {
        newSet.delete(empId);
      } else {
        newSet.add(empId);
      }
      return newSet;
    });
    setHasChanges(true);
  };
  
  const handleMarkAll = (lineId: string, markAsPresent: boolean) => {
    const lineEmployeeIds = (employeesByLine[lineId] || []).map(e => e.id);
    setPresentIds(prev => {
        const newSet = new Set(prev);
        if(markAsPresent) {
            lineEmployeeIds.forEach(id => newSet.add(id));
        } else {
            lineEmployeeIds.forEach(id => newSet.delete(id));
        }
        return newSet;
    });
    setHasChanges(true);
  }

  const handleSave = () => {
    const newAttendanceRecord: DailyAttendance = {
      date: selectedDate,
      presentEmployeeIds: Array.from(presentIds),
    };
    onSaveAttendance(newAttendanceRecord);
    setHasChanges(false);
  };

  const summaryData = useMemo(() => {
    const selectedDateObj = new Date(selectedDate + 'T23:59:59');
    
    // Find latest allocations for each line ON OR BEFORE the selected date
    const relevantAllocations = (lines || []).map(line => {
        return (allocations || [])
            .filter(a => a.lineNumber === line.id && new Date(a.lastUpdated) <= selectedDateObj)
            .sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0];
    }).filter(Boolean);

    const allocatedIds = new Set<string>();
    relevantAllocations.forEach(alloc => {
      (alloc.assignments || []).forEach(assign => {
        (assign.employeeIds || []).forEach(id => allocatedIds.add(id));
      });
    });

    const presentAndAllocatedCount = Array.from(presentIds).filter(id => allocatedIds.has(id)).length;
    
    const lineSummaries = (lines || []).map(line => {
        const lineAllocation = relevantAllocations.find(a => a.lineNumber === line.id);
        if (!lineAllocation) {
            return { lineId: line.id, lineName: line.name, total: 0, operators: 0, checkers: 0, helpers: 0, absentees: [] };
        }
        
        const counts = { operators: 0, checkers: 0, helpers: 0 };
        const absentees: Employee[] = [];
        let total = 0;

        (lineAllocation.assignments || []).forEach(assign => {
            (assign.employeeIds || []).forEach(empId => {
                const emp = (employees || []).find(e => e.id === empId);
                if (!emp) return;

                total++;
                const designation = emp.designation.toLowerCase();
                if (designation.includes('operator')) counts.operators++;
                else if (designation.includes('checker')) counts.checkers++;
                else if (designation.includes('helper')) counts.helpers++;

                if (!presentIds.has(empId)) {
                    absentees.push(emp);
                }
            });
        });

        return { lineId: line.id, lineName: line.name, total, ...counts, absentees };
    });
    
    const unallocatedPresentEmployees = (employees || []).filter(emp => presentIds.has(emp.id) && !allocatedIds.has(emp.id));

    return {
        present: presentIds.size,
        absent: (employees || []).length - presentIds.size,
        allocated: presentAndAllocatedCount,
        unallocated: presentIds.size - presentAndAllocatedCount,
        lineSummaries,
        unallocatedPresentEmployees
    };
  }, [selectedDate, presentIds, allocations, employees, lines]);


  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Attendance & Allocation</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Manage daily workforce presence and assignments.</p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-10 px-3 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"/>
            <button onClick={handleSave} disabled={!hasChanges} className="px-4 py-2 bg-[#2c4e8a] text-white font-semibold rounded-md hover:bg-[#213a69] disabled:bg-slate-300 dark:disabled:bg-slate-600">
                {hasChanges ? 'Save Changes' : 'Saved'}
            </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Present" value={summaryData.present} colorClass="text-green-600" />
        <KpiCard title="Total Absent" value={summaryData.absent} colorClass="text-red-600" />
        <KpiCard title="Total Allocated" value={summaryData.allocated} colorClass="text-blue-600" />
        <KpiCard title="Yet to be Allocated" value={summaryData.unallocated} colorClass="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {/* Attendance Marking */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Daily Attendance</h2>
                <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                {(lines || []).map(line => (
                    <div key={line.id}>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300">{line.name}</h3>
                            <div className="text-xs space-x-2">
                                <button onClick={() => handleMarkAll(line.id, true)} className="text-green-600 hover:text-green-800">Mark All Present</button>
                                <button onClick={() => handleMarkAll(line.id, false)} className="text-red-600 hover:text-red-800">Mark All Absent</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {(employeesByLine[line.id] || []).map(emp => (
                            <div key={emp.id} className={`p-2 rounded-md border text-sm cursor-pointer ${presentIds.has(emp.id) ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'}`} onClick={() => handleTogglePresent(emp.id)}>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{emp.name}</span>
                                <span className="block text-xs text-slate-500 dark:text-slate-400">{emp.designation}</span>
                            </div>
                        ))}
                        </div>
                    </div>
                ))}
                </div>
            </div>

             {/* Unallocated Staff */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
                <h2 className="text-lg font-semibold text-amber-600 mb-2">Unallocated Present Staff ({summaryData.unallocatedPresentEmployees.length})</h2>
                {summaryData.unallocatedPresentEmployees.length > 0 ? (
                    <>
                    <div className="max-h-48 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {summaryData.unallocatedPresentEmployees.map(emp => (
                            <div key={emp.id} className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-md border border-amber-200 dark:border-amber-800">
                                <p className="font-semibold text-amber-800 dark:text-amber-200">{emp.name}</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400">{emp.designation} ({gradesMap.get(emp.operatorGradeId)})</p>
                            </div>
                        ))}
                    </div>
                     <button onClick={() => onNavigate('lineAllocation')} className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800">Go to Line Allocation to assign them &rarr;</button>
                    </>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">All present employees are allocated.</p>
                )}
            </div>
        </div>
        
        {/* Line Summaries */}
        <div className="lg:col-span-1 space-y-4">
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Line Allocation Summary</h2>
                <div className="max-h-[80vh] overflow-y-auto space-y-4 pr-2">
                {summaryData.lineSummaries.map(summary => (
                    <div key={summary.lineId} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300">{summary.lineName}</h3>
                        <div className="grid grid-cols-4 text-center mt-2 border-y dark:border-slate-600 py-2">
                            <div><div className="font-bold text-xl">{summary.total}</div><div className="text-xs text-slate-500 dark:text-slate-400">Total</div></div>
                            <div><div className="font-bold text-xl">{summary.operators}</div><div className="text-xs text-slate-500 dark:text-slate-400">Ops</div></div>
                            <div><div className="font-bold text-xl">{summary.checkers}</div><div className="text-xs text-slate-500 dark:text-slate-400">Check</div></div>
                            <div><div className="font-bold text-xl">{summary.helpers}</div><div className="text-xs text-slate-500 dark:text-slate-400">Help</div></div>
                        </div>
                        {summary.absentees.length > 0 && (
                            <div className="mt-2">
                                <h4 className="text-xs font-semibold text-red-600">Replacement Needed:</h4>
                                <ul className="text-xs text-red-500 list-disc list-inside">
                                    {summary.absentees.map(emp => <li key={emp.id}>{emp.name}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
                </div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default AttendanceAllocationPage;
