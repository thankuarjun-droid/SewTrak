import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { MasterDataItem, Order, Style, Employee, LineAllocation, Machine, OperatorGrade, AllocationLogEntry, Operation, Line } from '../types';
import { FormField } from '../components/FormField';
import { ClipboardCheckIcon, XIcon } from '../components/IconComponents';

interface LineAllocationPageProps {
  lines: Line[];
  orders: Order[];
  styles: Style[];
  employees: Employee[];
  operations: Operation[];
  machines: Machine[];
  operatorGrades: OperatorGrade[];
  lineAllocations: LineAllocation[];
  allocationLog: AllocationLogEntry[];
  onSaveAllocation: (allocation: LineAllocation) => Promise<LineAllocation | void>;
}

const LineAllocationPage = ({ 
    lines, orders, styles, employees, operations, machines, operatorGrades, 
    lineAllocations, allocationLog, onSaveAllocation
}: LineAllocationPageProps) => {
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedOrder, setSelectedOrder] = useState('');
  const [selectedAllocation, setSelectedAllocation] = useState<LineAllocation | null>(null);
  const [currentAssignments, setCurrentAssignments] = useState<Map<string, string[]>>(new Map());
  const [submitMessage, setSubmitMessage] = useState('');

  const stylesMap = useMemo(() => new Map((styles || []).map(s => [s.id, s])), [styles]);
  const operationsMap = useMemo(() => new Map((operations || []).map(o => [o.id, o])), [operations]);
  const employeesMap = useMemo(() => new Map((employees || []).map(e => [e.id, e])), [employees]);
  const machinesMap = useMemo(() => new Map((machines || []).map(m => [m.id, m.name])), [machines]);
  const ordersMap = useMemo(() => new Map((orders || []).map(o => [o.id, o])), [orders]);
  
  const orderForSelection = useMemo(() => ordersMap.get(selectedOrder), [selectedOrder, ordersMap]);
  const styleForSelection = useMemo(() => stylesMap.get(orderForSelection?.styleId || ''), [orderForSelection, stylesMap]);
  const bulletinForSelection = useMemo(() => styleForSelection?.operationBulletin.sort((a,b) => a.sNo - b.sNo) || [], [styleForSelection]);
  
  const allocationsToShow = useMemo(() => {
    if (selectedLine) {
      return (lineAllocations || []).filter(a => a.lineNumber === selectedLine);
    }
    return (lineAllocations || []).sort((a, b) => a.lineNumber.localeCompare(b.lineNumber));
  }, [lineAllocations, selectedLine]);

  const changeLogForSelected = useMemo(() => {
    if (!selectedAllocation) return [];
    return (allocationLog || [])
      .filter(log => log.allocationId === selectedAllocation.id)
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allocationLog, selectedAllocation]);

  const currentlyAssignedInThisSession = useMemo(() => new Set(Array.from(currentAssignments.values()).flat()), [currentAssignments]);
  
  const availableEmployees = useMemo(() => 
    (employees || []).filter(emp => emp.currentLineId === selectedLine && !currentlyAssignedInThisSession.has(emp.id))
      .sort((a, b) => a.name.localeCompare(b.name)),
  [employees, selectedLine, currentlyAssignedInThisSession]);

  // When line or order changes, automatically load the existing plan or prepare a new one, ensuring it's synced with the latest Style OB.
  useEffect(() => {
    if (selectedLine && selectedOrder) {
        const existingPlan = lineAllocations.find(a => a.lineNumber === selectedLine && a.orderNumber === selectedOrder);
        const style = stylesMap.get(ordersMap.get(selectedOrder)?.styleId || '');
        const newAssignments = new Map<string, string[]>();

        if (style && style.operationBulletin) {
            const savedAssignments = existingPlan ? new Map(existingPlan.assignments.map(a => [a.operationId, a.employeeIds])) : new Map();
            
            style.operationBulletin.forEach(opItem => {
                // Use saved assignment if it exists for an op in the current OB, otherwise initialize as empty.
                newAssignments.set(opItem.operationId, savedAssignments.get(opItem.operationId) || []);
            });
        }
        
        setSelectedAllocation(existingPlan || null);
        setCurrentAssignments(newAssignments);
    } else if (!selectedLine) {
        setSelectedOrder('');
        setSelectedAllocation(null);
        setCurrentAssignments(new Map());
    } else if (!selectedOrder) {
        setSelectedAllocation(null);
        setCurrentAssignments(new Map());
    }
  }, [selectedLine, selectedOrder, lineAllocations, stylesMap, ordersMap]);


  const handleAddEmployeeToOperation = (operationId: string, employeeId: string) => {
    if (!employeeId) return;
    setCurrentAssignments(prev => {
        const newMap = new Map(prev);
        const currentIds = newMap.get(operationId) || [];
        if (!currentIds.includes(employeeId)) newMap.set(operationId, [...currentIds, employeeId]);
        return newMap;
    });
  };

  const handleRemoveEmployeeFromOperation = (operationId: string, employeeId: string) => {
    setCurrentAssignments(prev => {
        const newMap = new Map(prev);
        const currentIds = newMap.get(operationId) || [];
        newMap.set(operationId, currentIds.filter(id => id !== employeeId));
        return newMap;
    });
  };

  const calculateHourlyTarget = (opItem: any, style: Style | undefined): number => {
    if (!opItem || !style) return 0;
    const opSmv = (opItem.pickupTime + opItem.sewingTime + opItem.trimAndDisposalTime) / 60;
    const targetEfficiency = style.targetEfficiency || 80;
    if (opSmv <= 0) return 0;
    return (60 / opSmv) * (targetEfficiency / 100);
  };
  
  const handleSubmitAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLine || !selectedOrder) {
      alert("Please select a line and order.");
      return;
    }

    const allocationData: LineAllocation = {
      id: selectedAllocation?.id || '', // The API is responsible for ID management
      lastUpdated: new Date().toISOString(),
      lineNumber: selectedLine,
      orderNumber: selectedOrder,
      assignments: Array.from(currentAssignments.entries()).map(([operationId, employeeIds]) => ({
        operationId,
        employeeIds,
      })),
    };

    const savedPlan = await onSaveAllocation(allocationData);

    if (savedPlan) {
      setSelectedAllocation(savedPlan);
    }

    setSubmitMessage('Line allocation plan saved successfully!');
    setTimeout(() => setSubmitMessage(''), 3000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Line Allocation Plans</h1>
        <p className="text-slate-600 mt-2">Manage reusable allocation templates. Update only when needed.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmitAllocation} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b dark:border-slate-700">
              <FormField label="Line Number" htmlFor="mainLine">
                <select id="mainLine" value={selectedLine} onChange={e => setSelectedLine(e.target.value)} required className="w-full h-10 px-3 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md">
                  <option value="" disabled>Select a Line</option>
                  {(lines || []).map(line => <option key={line.id} value={line.id}>{line.name}</option>)}
                </select>
              </FormField>
              <FormField label="Order" htmlFor="mainOrder">
                <select id="mainOrder" value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)} required disabled={!selectedLine} className="w-full h-10 px-3 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md disabled:bg-slate-100 dark:disabled:bg-slate-700">
                  <option value="">Select an Order</option>
                  {(orders || []).map(order => <option key={order.id} value={order.id}>{order.id} ({stylesMap.get(order.styleId)?.name})</option>)}
                </select>
              </FormField>
            </div>
            {styleForSelection && <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md text-center mb-4">Style: <span className="font-medium text-slate-700 dark:text-slate-300">{styleForSelection.name}</span></div>}

            {bulletinForSelection.length > 0 && (
              <>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Assign Operators</h3>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {bulletinForSelection.map(opItem => {
                    const assignedIds = currentAssignments.get(opItem.operationId) || [];
                    const operation = operationsMap.get(opItem.operationId);
                    const hourlyTarget = calculateHourlyTarget(opItem, styleForSelection);
                    const requiredOperators = opItem.allocatedOperators || 1;
                    const allocatedCount = assignedIds.length;

                    let countColor = 'text-slate-500 dark:text-slate-400';
                    if (allocatedCount < requiredOperators) {
                      countColor = 'text-amber-600 dark:text-amber-400 font-bold';
                    } else if (allocatedCount > requiredOperators) {
                      countColor = 'text-blue-600 dark:text-blue-400 font-bold';
                    } else {
                      countColor = 'text-green-600 dark:text-green-400 font-bold';
                    }
                    
                    return (
                      <div key={opItem.sNo} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-start bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-700">
                        <div>
                          <label className="font-medium text-slate-700 dark:text-slate-200 text-sm">
                            {opItem.sNo}. {operation?.name}{' '}
                            <span className={`text-xs ${countColor}`}>
                              ({allocatedCount}/{requiredOperators} allocated)
                            </span>
                            <span className="text-xs text-slate-400 ml-1">({operation?.skillType})</span>
                          </label>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Machine: <span className="font-semibold">{machinesMap.get(opItem.machineId)}</span> | Target: <span className="font-semibold">{hourlyTarget.toFixed(0)}/hr</span></div>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-1.5 min-h-[40px] p-2 bg-white dark:bg-slate-700 rounded-md border dark:border-slate-600">
                            {assignedIds.map(empId => {
                              const employee = employeesMap.get(empId);
                              if (!employee) return null;
                              return (
                                <div key={empId} className="flex items-center justify-between bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200 text-xs px-2 py-1 rounded">
                                  <span>{employee.name}</span>
                                  <button type="button" onClick={() => handleRemoveEmployeeFromOperation(opItem.operationId, empId)} className="p-0.5 hover:bg-indigo-200 rounded-full">
                                    <XIcon className="w-3 h-3"/>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <select
                            value=""
                            onChange={(e) => handleAddEmployeeToOperation(opItem.operationId, e.target.value)}
                            className="w-full h-8 text-xs border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md mt-1"
                          >
                            <option value="">+ Assign Employee</option>
                            {availableEmployees.map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
                 {bulletinForSelection.length > 0 && (
                  <div className="mt-6 flex flex-col items-center">
                    <button type="submit" className="px-8 py-2 bg-[#2c4e8a] text-white font-semibold rounded-md hover:bg-[#213a69]">Save Allocation Plan</button>
                    {submitMessage && <p className="text-sm text-green-600 mt-2">{submitMessage}</p>}
                  </div>
                 )}
              </>
            )}
          </form>
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">{selectedLine ? `Existing Plans for ${lines.find(l => l.id === selectedLine)?.name}` : 'All Existing Plans'}</h3>
                 </div>
                 <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {allocationsToShow.map(alloc => {
                        const order = orders.find(o => o.id === alloc.orderNumber);
                        const line = lines.find(l => l.id === alloc.lineNumber);
                        
                        // If associated line or order is deleted, skip rendering this item to prevent crashes.
                        if (!line || !order) {
                            return null;
                        }
                        
                        const isSelected = selectedOrder === alloc.orderNumber && selectedLine === alloc.lineNumber;

                        return (
                            <div 
                                key={alloc.id} 
                                onClick={() => {
                                    setSelectedLine(alloc.lineNumber);
                                    setSelectedOrder(alloc.orderNumber);
                                }} 
                                className={`p-2 rounded-md cursor-pointer border ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700' : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border-transparent'}`}
                            >
                                {!selectedLine && <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{line.name}</p>}
                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{order.id}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">({stylesMap.get(order.styleId)?.name})</p>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{alloc.assignments.reduce((sum, a) => sum + a.employeeIds.length, 0)} employees assigned</p>
                            </div>
                        )
                    })}
                    {allocationsToShow.length === 0 && (
                        <p className="text-sm text-slate-400 italic text-center py-4">
                            {selectedLine ? 'No plans for this line yet.' : 'No allocation plans created yet.'}
                        </p>
                    )}
                 </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Allocation Change Log</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 text-xs text-slate-600 dark:text-slate-300">
                    {changeLogForSelected.map(log => (
                        <div key={log.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                            <p>{log.details}</p>
                            <p className="text-slate-400 dark:text-slate-500 text-[10px]">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                    ))}
                    {changeLogForSelected.length === 0 && <p className="text-slate-400 italic">Select a plan to see its history.</p>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LineAllocationPage;