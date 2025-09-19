import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ProductionEntry, MasterDataItem, Order, Style, Employee, LineAllocation, KanbanEntry } from '../types';
import { FormField } from '../components/FormField';
import { HOUR_COUNTERS } from '../constants';
import { ProductionEntryModal } from '../components/ProductionEntryModal';
import { PencilIcon, TrashIcon } from '../components/IconComponents';

interface QueuedEntry {
    operation: string;
    employeeId: string;
    productionQuantity: number;
    downTime: number;
    downTimeReason: string;
}

interface ProductionEntryPageProps {
    lines: MasterDataItem[];
    orders: Order[];
    styles: Style[];
    colors: MasterDataItem[];
    employees: Employee[];
    operations: MasterDataItem[];
    downtimeReasons: MasterDataItem[];
    lineAllocations: LineAllocation[];
    productionEntries: ProductionEntry[];
    kanbanEntries: KanbanEntry[];
    onAddProductionEntries: (entries: Omit<ProductionEntry, 'id'>[]) => void;
    onUpdateProductionEntry: (entry: ProductionEntry) => void;
    onDeleteProductionEntry: (entryId: string) => void;
}

export default function ProductionEntryPage({
    lines = [], orders = [], styles = [], colors = [], employees = [], operations = [], downtimeReasons = [], lineAllocations, productionEntries, kanbanEntries, onAddProductionEntries, onUpdateProductionEntry, onDeleteProductionEntry
}: ProductionEntryPageProps) {
  const [lineNumber, setLineNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [colorId, setColorId] = useState('');
  const [hourCounter, setHourCounter] = useState<number | ''>('');
  
  const [isFormGenerated, setIsFormGenerated] = useState(false);
  const [entryQueue, setEntryQueue] = useState<QueuedEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  
  // State for viewing/editing submitted entries
  const [viewedEntries, setViewedEntries] = useState<ProductionEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<ProductionEntry | null>(null);

  const stylesMap = useMemo(() => new Map(styles.map(s => [s.id, s])), [styles]);
  const operationsMap = useMemo(() => new Map(operations.map(o => [o.id, o.name])), [operations]);
  const employeesMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  const selectedOrder = useMemo(() => orders.find(o => o.id === orderNumber), [orderNumber, orders]);
  const selectedStyle = useMemo(() => stylesMap.get(selectedOrder?.styleId || ''), [selectedOrder, stylesMap]);

  const availableColorsForOrder = useMemo(() => {
    if (!selectedOrder) return [];
    const orderColorIds = new Set(selectedOrder.quantities.map(q => q.colorId));
    return colors.filter(c => orderColorIds.has(c.id));
  }, [selectedOrder, colors]);
  
  useEffect(() => {
    const entriesForContext = (productionEntries || []).filter(p => 
        p.lineNumber === lineNumber &&
        p.orderNumber === orderNumber &&
        p.colorId === colorId &&
        p.hourCounter === hourCounter
    );
    setViewedEntries(entriesForContext);
  }, [lineNumber, orderNumber, colorId, hourCounter, productionEntries]);

  const submittedHours = useMemo(() => {
    if (!lineNumber || !orderNumber || !colorId) return new Set<number>();
    const hours = new Set<number>();
    (productionEntries || [])
        .filter(p => p.lineNumber === lineNumber && p.orderNumber === orderNumber && p.colorId === colorId)
        .forEach(p => hours.add(p.hourCounter));
    return hours;
  }, [lineNumber, orderNumber, colorId, productionEntries]);

  const availableHours = useMemo(() => {
      return HOUR_COUNTERS.filter(h => !submittedHours.has(h));
  }, [submittedHours]);
  
  useEffect(() => {
    if (availableHours.length > 0) {
      if (!hourCounter || !availableHours.includes(Number(hourCounter))) {
          setHourCounter(availableHours[0]);
      }
    } else {
      setHourCounter('');
    }
  }, [availableHours, hourCounter]);
  
  const calculateWipState = useCallback((queue: QueuedEntry[]) => {
      const wipState = new Map<number, { remainingWip: number }>();
      if (!selectedStyle) return wipState;

      const historicalProductionByOp = new Map<string, number>();
      (productionEntries || [])
          .filter(p => p.lineNumber === lineNumber && p.orderNumber === orderNumber && p.colorId === colorId)
          .forEach(p => {
              historicalProductionByOp.set(p.operation, (historicalProductionByOp.get(p.operation) || 0) + p.productionQuantity);
          });

      const totalLoaded = (kanbanEntries || [])
          .filter(k => k.status === 'active' && k.lineNumber === lineNumber && k.orderNumber === orderNumber && k.colorId === colorId)
          .reduce((sum, k) => sum + k.quantity, 0);

      const sortedBulletin = selectedStyle.operationBulletin.sort((a, b) => a.sNo - b.sNo);
      
      const sessionProductionByOp = new Map<string, number>();

      for (const opItem of sortedBulletin) {
          const opId = opItem.operationId;
          const productionAtPrevOp = opItem.sNo === 1
              ? totalLoaded
              : (historicalProductionByOp.get(sortedBulletin[opItem.sNo - 2].operationId) || 0) + (sessionProductionByOp.get(sortedBulletin[opItem.sNo - 2].operationId) || 0);

          const historicalOutputForThisOp = historicalProductionByOp.get(opId) || 0;
          let sessionOutputForThisOpOnPrevRows = 0;

          for (let i = 0; i < queue.length; i++) {
              if (queue[i].operation === opId) {
                  const availableWip = productionAtPrevOp - historicalOutputForThisOp - sessionOutputForThisOpOnPrevRows;
                  wipState.set(i, { remainingWip: Math.max(0, availableWip) });
                  const qtyOnThisRow = Number(queue[i].productionQuantity) || 0;
                  sessionOutputForThisOpOnPrevRows += qtyOnThisRow;
              }
          }
          sessionProductionByOp.set(opId, sessionOutputForThisOpOnPrevRows);
      }
      return wipState;
    }, [selectedStyle, productionEntries, kanbanEntries, lineNumber, orderNumber, colorId]);

    const wipStateMap = useMemo(() => calculateWipState(entryQueue), [entryQueue, calculateWipState]);
  
    const isFormValid = useMemo(() => {
        return entryQueue.every((item, index) => {
            if (!item.employeeId) return true; 
            const { remainingWip } = wipStateMap.get(index) || { remainingWip: 0 };
            return (Number(item.productionQuantity) || 0) <= remainingWip;
        });
    }, [entryQueue, wipStateMap]);

  const handleGenerateForm = () => {
    if (!lineNumber || !orderNumber || !colorId || !hourCounter || !selectedStyle) {
        alert('Please select a Line, Order, Color, and Hour.');
        return;
    }
    
    const relevantAllocations = (lineAllocations || []).filter(a => 
        a.lineNumber === lineNumber && 
        a.orderNumber === orderNumber
    ).sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    const allocation = relevantAllocations[0];

    if (!allocation || !allocation.assignments) {
        alert(`No line allocation plan found for ${lines.find(l=>l.id===lineNumber)?.name} and order ${orderNumber}. Please create an allocation plan first.`);
        return;
    }

    const allocationMap = new Map(allocation.assignments.map(a => [a.operationId, a.employeeIds]));

    const newQueue: QueuedEntry[] = [];
    selectedStyle.operationBulletin
        .sort((a,b) => a.sNo - b.sNo)
        .forEach(opItem => {
            const assignedEmployeeIds = allocationMap.get(opItem.operationId) || [];
            if (assignedEmployeeIds.length > 0) {
              assignedEmployeeIds.forEach(employeeId => {
                  newQueue.push({
                      operation: opItem.operationId,
                      employeeId: employeeId,
                      productionQuantity: 0,
                      downTime: 0,
                      downTimeReason: ''
                  });
              });
            } else {
               newQueue.push({
                      operation: opItem.operationId,
                      employeeId: '',
                      productionQuantity: 0,
                      downTime: 0,
                      downTimeReason: ''
                  });
            }
        });
    
    setEntryQueue(newQueue);
    setIsFormGenerated(true);
    setViewedEntries([]);
  };
  
  const handleQueueChange = (index: number, field: keyof QueuedEntry, value: string | number) => {
    setEntryQueue(prevQueue => {
        const newQueue = [...prevQueue];
        const itemToUpdate = { ...newQueue[index] };
        (itemToUpdate as any)[field] = value;
        newQueue[index] = itemToUpdate;
        return newQueue;
    });
  };

  const handleSubmitAll = () => {
    if (entryQueue.some(e => e.employeeId === '')) {
        alert('Please ensure every listed operation has an assigned staff member.');
        return;
    }
    
    if (!isFormValid) {
        alert('One or more entries has an invalid quantity. Please correct the values.');
        return;
    }
    
    setIsSubmitting(true);
    setSubmitMessage('');

    const timestamp = new Date(`${new Date().toISOString().split('T')[0]}T${String(hourCounter).padStart(2, '0')}:00:00.000Z`).toISOString();
    
    const newEntries: Omit<ProductionEntry, 'id'>[] = entryQueue
        .filter(item => item.employeeId !== '')
        .map(item => ({
            timestamp,
            lineNumber,
            orderNumber,
            styleNumber: selectedStyle!.id,
            colorId,
            hourCounter: hourCounter as number,
            ...item
    }));

    onAddProductionEntries(newEntries);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage(`Successfully recorded ${newEntries.length} entries for Hour ${hourCounter}.`);
      setIsFormGenerated(false);
      setEntryQueue([]);
      setHourCounter('');
      
      setTimeout(() => setSubmitMessage(''), 5000);
    }, 1000);
  };
  
  const handleDelete = (entryId: string) => {
    if(window.confirm('Are you sure you want to delete this production entry?')) {
        onDeleteProductionEntry(entryId);
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Live Production Entry</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Enter hourly data. Submitted hours can be edited below.</p>
        </header>

        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg">
            {!isFormGenerated ? (
              <>
                <div className="space-y-4 max-w-xl mx-auto">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Select Production Context</h2>
                    <FormField label="Line Number" htmlFor="lineNumber">
                        <select id="lineNumber" value={lineNumber} onChange={e => setLineNumber(e.target.value)} required className="w-full h-10 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition">
                          <option value="" disabled>Select a Line</option>
                          {lines.map(line => <option key={line.id} value={line.id}>{line.name}</option>)}
                        </select>
                    </FormField>
                    <FormField label="Order No." htmlFor="orderNumber">
                      <select id="orderNumber" value={orderNumber} onChange={e => {setOrderNumber(e.target.value); setColorId('');}} required className="w-full h-10 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition">
                        <option value="" disabled>Select an Order</option>
                        {orders.map(order => <option key={order.id} value={order.id}>{order.name}</option>)}
                      </select>
                    </FormField>
                    {selectedStyle && (
                        <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 p-2 rounded-md text-center">
                            Style: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedStyle.name}</span>
                        </div>
                    )}
                    <FormField label="Colour" htmlFor="colorId">
                      <select id="colorId" value={colorId} onChange={e => setColorId(e.target.value)} required disabled={!orderNumber} className="w-full h-10 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed">
                        <option value="" disabled>Select a Colour</option>
                        {availableColorsForOrder.map(color => <option key={color.id} value={color.id}>{color.name}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Hour Counter" htmlFor="hourCounter">
                        <select id="hourCounter" value={hourCounter} onChange={e => setHourCounter(Number(e.target.value))} required disabled={!lineNumber || !orderNumber || !colorId} className="h-10 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed">
                            <option value="">Select Hour</option>
                            {HOUR_COUNTERS.map(h => <option key={h} value={h}>{`Hour ${h}`}</option>)}
                        </select>
                    </FormField>
                    <button onClick={handleGenerateForm} disabled={!lineNumber || !orderNumber || !colorId || !hourCounter || submittedHours.has(Number(hourCounter))} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#2c4e8a] hover:bg-[#213a69] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c4e8a] disabled:bg-[#2c4e8a]/50 disabled:cursor-not-allowed transition">
                        {submittedHours.has(Number(hourCounter)) ? "Hour Already Submitted" : "Generate Entry Form"}
                    </button>
                    {submitMessage && <p className="mt-4 text-sm text-green-600 dark:text-green-400 text-center">{submitMessage}</p>}
                </div>
                
                {viewedEntries.length > 0 && (
                    <div className="mt-10 pt-6 border-t dark:border-slate-700">
                         <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Entries for Hour {hourCounter}</h3>
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-700 text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <tr>
                                        <th className="p-3 font-medium">Operation</th>
                                        <th className="p-3 font-medium">Employee</th>
                                        <th className="p-3 font-medium text-right">Quantity</th>
                                        <th className="p-3 font-medium text-right">Downtime</th>
                                        <th className="p-3 font-medium">Reason</th>
                                        <th className="p-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewedEntries.map(entry => (
                                        <tr key={entry.id} className="border-b border-slate-100 dark:border-slate-700">
                                            <td className="p-2 align-middle">{operationsMap.get(entry.operation)}</td>
                                            <td className="p-2 align-middle">{employeesMap.get(entry.employeeId)?.name}</td>
                                            <td className="p-2 align-middle text-right font-mono">{entry.productionQuantity}</td>
                                            <td className="p-2 align-middle text-right font-mono">{entry.downTime > 0 ? `${entry.downTime} min` : '-'}</td>
                                            <td className="p-2 align-middle">{entry.downTimeReason || '-'}</td>
                                            <td className="p-2 align-middle">
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingEntry(entry)} className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md" aria-label="Edit Entry"><PencilIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-md" aria-label="Delete Entry"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                )}
                </>
            ) : (
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Hourly Entry for Hour {hourCounter}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {lines.find(l => l.id === lineNumber)?.name} - {selectedOrder?.name} - {colors.find(c => c.id === colorId)?.name}
                                <span className="italic"> ({selectedStyle?.name})</span>
                            </p>
                        </div>
                        <button onClick={() => setIsFormGenerated(false)} className="text-sm font-medium text-[#2c4e8a] dark:text-indigo-400 hover:text-[#213a69] dark:hover:text-indigo-300">Change Context</button>
                    </div>

                    <div className="overflow-x-auto max-h-[50vh]">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0 z-10">
                                <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    <th className="p-3 font-medium">Operation</th>
                                    <th className="p-3 font-medium">Employee</th>
                                    <th className="p-3 font-medium">Quantity</th>
                                    <th className="p-3 font-medium">Downtime (min)</th>
                                    <th className="p-3 font-medium">Downtime Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entryQueue.map((item, index) => {
                                    const { remainingWip } = wipStateMap.get(index) || { remainingWip: 0 };
                                    const isInvalid = item.productionQuantity > remainingWip;
                                    return (
                                    <tr key={`${item.operation}-${item.employeeId}-${index}`} className="border-b border-slate-100 dark:border-slate-700">
                                        <td className="p-2 align-top"><div className="h-10 flex items-center">{operationsMap.get(item.operation)}</div></td>
                                        <td className="p-2 align-top">
                                            <select value={item.employeeId} onChange={e => handleQueueChange(index, 'employeeId', e.target.value)} required className="w-full h-10 px-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition">
                                                <option value="" disabled>Select Employee</option>
                                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2 align-top">
                                            <input type="number" value={item.productionQuantity || ''} onChange={e => handleQueueChange(index, 'productionQuantity', parseInt(e.target.value, 10) || 0)} className={`w-24 h-10 text-right px-2 bg-white dark:bg-slate-700 border rounded-md shadow-sm ${isInvalid ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-300 dark:border-slate-600'}`}/>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 text-right mt-1">Rem: {remainingWip.toLocaleString()}</div>
                                        </td>
                                        <td className="p-2 align-top"><input type="number" value={item.downTime || ''} onChange={e => handleQueueChange(index, 'downTime', parseInt(e.target.value, 10) || 0)} className="w-24 h-10 text-right px-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"/></td>
                                        <td className="p-2 align-top">
                                            <input list="downtime-reasons-list" value={item.downTimeReason} onChange={e => handleQueueChange(index, 'downTimeReason', e.target.value)} disabled={item.downTime <= 0} className="w-full h-10 px-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm disabled:bg-slate-100 dark:disabled:bg-slate-700/50"/>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                         <datalist id="downtime-reasons-list">
                            {downtimeReasons.map(reason => <option key={reason.id} value={reason.name} />)}
                          </datalist>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col items-center">
                      <button onClick={handleSubmitAll} disabled={isSubmitting || !isFormValid} className="w-full md:w-1/2 lg:w-1/3 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#2c4e8a] hover:bg-[#213a69] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c4e8a] disabled:bg-[#2c4e8a]/50 disabled:cursor-not-allowed transition">
                        {isSubmitting ? 'Submitting...' : `Submit All for Hour ${hourCounter}`}
                      </button>
                      {!isFormValid && (
                        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                            Please correct the invalid quantities (marked in red) before submitting.
                        </p>
                      )}
                    </div>
                </div>
            )}
        </div>

        {editingEntry && (
            <ProductionEntryModal
                isOpen={!!editingEntry}
                onClose={() => setEditingEntry(null)}
                onSave={onUpdateProductionEntry}
                entryToEdit={editingEntry}
                downtimeReasons={downtimeReasons}
                operationsMap={operationsMap}
                employeesMap={employeesMap}
            />
        )}
    </div>
  );
}