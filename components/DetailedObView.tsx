
import React, { useMemo, useState } from 'react';
import type { Style, OperationBulletinItem, FactorySettings, Operation, Machine, OperatorGrade } from '../types';
import { YamazumiChart } from './YamazumiChart';
import { ClockIcon, TrashIcon, PlusIcon } from './IconComponents';

interface DetailedObViewProps {
  style: Style;
  bulletin: OperationBulletinItem[];
  factorySettings: FactorySettings;
  operationNames: Map<string, string>;
  machineNames: Map<string, string>;
  gradeNames: Map<string, string>;
  isEditable?: boolean;
  onBulletinChange?: (newBulletin: OperationBulletinItem[]) => void;
  operations?: Operation[];
  machines?: Machine[];
  operatorGrades?: OperatorGrade[];
  onStartTimeCapture?: (sNo: number) => void;
}

export const DetailedObView = ({ 
    style, bulletin, factorySettings, operationNames, machineNames, gradeNames, 
    isEditable = false, onBulletinChange, operations = [], machines = [], operatorGrades = [],
    onStartTimeCapture
}: DetailedObViewProps) => {
  const [newOpId, setNewOpId] = useState<string>('');
  const isBalanced = bulletin && bulletin.length > 0 && bulletin.every(op => op.workstation && op.allocatedOperators);
  const totalSmv = (bulletin || []).reduce((sum, op) => sum + (op.pickupTime + op.sewingTime + op.trimAndDisposalTime), 0) / 60;
  
  const handleOpChange = (sNo: number, field: keyof OperationBulletinItem, value: any) => {
    if (!onBulletinChange) return;
    const newBulletin = (bulletin || []).map(op => {
      if (op.sNo === sNo) {
        // FIX: Cast `field` to string to satisfy the `includes` method's type requirement.
        const numericValue = ['pickupTime', 'sewingTime', 'trimAndDisposalTime', 'allocatedOperators'].includes(field as string) ? Number(value) : value;
        return { ...op, [field]: numericValue };
      }
      return op;
    });
    onBulletinChange(newBulletin);
  };
  
  const handleAddOperation = () => {
    if (!newOpId || !onBulletinChange) return;
    const currentBulletin = bulletin || [];
    const nextSNo = currentBulletin.length > 0 ? Math.max(...currentBulletin.map(op => op.sNo)) + 1 : 1;
    const newOpItem: OperationBulletinItem = {
        sNo: nextSNo,
        operationId: newOpId,
        operatorGradeId: operatorGrades[0]?.id || '',
        machineId: machines[0]?.id || '',
        pickupTime: 0,
        sewingTime: 0,
        trimAndDisposalTime: 0,
        allocatedOperators: 1,
        workstation: nextSNo,
    };
    onBulletinChange([...currentBulletin, newOpItem]);
    setNewOpId('');
  };

  const handleRemoveOperation = (sNoToRemove: number) => {
      if (!onBulletinChange) return;
      const newBulletin = (bulletin || [])
        .filter(op => op.sNo !== sNoToRemove)
        .map((op, index) => ({ ...op, sNo: index + 1 }));
      onBulletinChange(newBulletin);
  };
  
  const machineSummary = useMemo(() => {
    const summary = new Map<string, { smv: number, count: number }>();
    (bulletin || []).forEach(op => {
      const machineName = machineNames.get(op.machineId) || 'Unknown';
      const opSmv = (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60;
      const current = summary.get(machineName) || { smv: 0, count: 0 };
      current.smv += opSmv;
      current.count += op.allocatedOperators || 1;
      summary.set(machineName, current);
    });
    return Array.from(summary.entries());
  }, [bulletin, machineNames]);

  const yamazumiTaktTime = useMemo(() => {
      if(!isBalanced || !bulletin) return 0;
      const workstationTimes = new Map<number, number>();
      bulletin.forEach(op => {
        const opTime = (op.pickupTime + op.sewingTime + op.trimAndDisposalTime);
        if(op.allocatedOperators! > 1) { // Parallel station
          workstationTimes.set(op.workstation!, opTime / op.allocatedOperators!);
        } else { // Grouped station
          workstationTimes.set(op.workstation!, (workstationTimes.get(op.workstation!) || 0) + opTime);
        }
      });
      return Math.max(...Array.from(workstationTimes.values()));
  }, [bulletin, isBalanced]);
  
  const unassignedOperations = useMemo(() => {
      const assignedIds = new Set((bulletin || []).map(op => op.operationId));
      return operations.filter(op => !assignedIds.has(op.id));
  }, [bulletin, operations]);

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OB Table */}
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                <div><span className="font-semibold block">{style.targetDailyOutput || 'N/A'}</span><span className="text-slate-500 dark:text-slate-400">Target Output</span></div>
                <div><span className="font-semibold block">{style.targetEfficiency || 'N/A'}%</span><span className="text-slate-500 dark:text-slate-400">Target Efficiency</span></div>
                <div><span className="font-semibold block">{factorySettings.workingHoursPerDay * 60}</span><span className="text-slate-500 dark:text-slate-400">Mins/Day</span></div>
                <div><span className="font-semibold block">{totalSmv.toFixed(3)}</span><span className="text-slate-500 dark:text-slate-400">Total SAM</span></div>
            </div>
            <div className="overflow-x-auto border dark:border-slate-700 rounded-md max-h-96">
                <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0"><tr className="text-left text-slate-600 dark:text-slate-300">
                    <th className="p-2 font-semibold">S.No</th>
                    <th className="p-2 font-semibold">Operation</th>
                    <th className="p-2 font-semibold">Machine</th>
                    <th className="p-2 font-semibold text-center">P(s)</th>
                    <th className="p-2 font-semibold text-center">S(s)</th>
                    <th className="p-2 font-semibold text-center">T&amp;D(s)</th>
                    <th className="p-2 font-semibold">SAM</th>
                    <th className="p-2 font-semibold text-center">Alloc. Ops</th>
                    <th className="p-2 font-semibold text-right">Hr. Target</th>
                    {isEditable && <th className="p-2 font-semibold"></th>}
                </tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {(bulletin || []).map(op => {
                    const opSmv = (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60;
                    const hourlyTarget = opSmv > 0 ? (60 / opSmv) * (isBalanced ? (op.allocatedOperators || 1) : 1) * ((style.targetEfficiency || 80) / 100) : 0;
                    
                    return (
                        <tr key={op.sNo}>
                        <td className="p-2 text-center">{op.sNo}</td>
                        <td className="p-2">
                           {isEditable ? (
                                <select value={op.operationId} onChange={e => handleOpChange(op.sNo, 'operationId', e.target.value)} className="w-full h-8 text-xs border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md">
                                    {operations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            ) : operationNames.get(op.operationId)}
                        </td>
                        <td className="p-2">
                            {isEditable ? (
                                <select value={op.machineId} onChange={e => handleOpChange(op.sNo, 'machineId', e.target.value)} className="w-full h-8 text-xs border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md">
                                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            ) : machineNames.get(op.machineId)}
                        </td>
                        <td className="p-1">
                            {isEditable ? <input type="number" step="0.1" value={op.pickupTime} onChange={e => handleOpChange(op.sNo, 'pickupTime', e.target.value)} className="w-14 h-8 text-xs text-center border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md"/> : op.pickupTime}
                        </td>
                         <td className="p-1">
                            {isEditable ? <input type="number" step="0.1" value={op.sewingTime} onChange={e => handleOpChange(op.sNo, 'sewingTime', e.target.value)} className="w-14 h-8 text-xs text-center border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md"/> : op.sewingTime}
                        </td>
                         <td className="p-1">
                            {isEditable ? <input type="number" step="0.1" value={op.trimAndDisposalTime} onChange={e => handleOpChange(op.sNo, 'trimAndDisposalTime', e.target.value)} className="w-14 h-8 text-xs text-center border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md"/> : op.trimAndDisposalTime}
                        </td>
                        <td className="p-2 font-mono flex items-center gap-1">
                           {opSmv.toFixed(3)}
                           {isEditable && onStartTimeCapture && <button type="button" onClick={() => onStartTimeCapture(op.sNo)} className="p-1 text-slate-400 hover:text-blue-600 rounded-full"><ClockIcon className="w-3 h-3"/></button>}
                        </td>
                        <td className="p-2 font-mono text-center font-bold">
                            {isBalanced && isEditable ? (
                                <input type="number" value={op.allocatedOperators || 1} onChange={e => handleOpChange(op.sNo, 'allocatedOperators', e.target.value)} min="1" className="w-12 h-8 text-xs text-center border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md"/>
                            ) : isBalanced ? op.allocatedOperators : '-'}
                        </td>
                        <td className="p-2 font-mono text-right font-semibold text-indigo-700">{hourlyTarget.toFixed(0)}</td>
                         {isEditable && <td className="p-2 text-center"><button type="button" onClick={() => handleRemoveOperation(op.sNo)} className="p-1 text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button></td>}
                        </tr>
                    )
                    })}
                </tbody>
                </table>
            </div>
            {isEditable && (
                <div className="flex items-center gap-2 p-2 border-t dark:border-slate-700">
                    <select value={newOpId} onChange={e => setNewOpId(e.target.value)} className="flex-grow h-9 text-xs border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md">
                        <option value="">-- Add Operation --</option>
                        {unassignedOperations.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                    </select>
                    <button type="button" onClick={handleAddOperation} disabled={!newOpId} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md disabled:opacity-50">
                        <PlusIcon className="w-4 h-4"/>
                    </button>
                </div>
            )}
            <div className="max-w-xs">
                <h4 className="font-semibold text-sm mb-1">Machine Summary</h4>
                <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-700"><tr className="text-left text-slate-600 dark:text-slate-300">
                    <th className="p-1 font-semibold">Machine</th>
                    <th className="p-1 font-semibold">SAM</th>
                    <th className="p-1 font-semibold text-center">No. of Machines</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {machineSummary.map(([name, data]) => (
                        <tr key={name}>
                            <td className="p-1">{name}</td>
                            <td className="p-1 font-mono">{data.smv.toFixed(3)}</td>
                            <td className="p-1 font-mono text-center">{isBalanced ? data.count : '-'}</td>
                        </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>

        {/* Yamazumi Chart */}
        <div className="lg:col-span-1">
            <YamazumiChart 
                operations={bulletin}
                taktTime={yamazumiTaktTime}
                operationNames={operationNames}
                isBalancedView={isBalanced}
            />
        </div>
      </div>
    </div>
  );
};
