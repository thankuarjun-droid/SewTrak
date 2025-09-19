
import React, { useState, useMemo } from 'react';
import type { TimeStudy, CycleRecord, AllowanceSettings, Machine, Employee } from '../types';
import { XIcon, TrashIcon } from './IconComponents';
import { PieChart } from './PieChart';

interface EditTimeStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedStudy: TimeStudy) => void;
  study: TimeStudy;
  allowanceSettings: AllowanceSettings;
  machine: Machine;
  employee: Employee;
  operationName: string;
}

export const EditTimeStudyModal = ({ isOpen, onClose, onSave, study, allowanceSettings, machine, employee, operationName }: EditTimeStudyModalProps) => {
  const [cycles, setCycles] = useState<CycleRecord[]>(study.cycles);

  const handleCycleSelection = (cycleNumber: number) => {
    setCycles(prev => prev.map(c => c.cycleNumber === cycleNumber ? { ...c, selected: !c.selected } : c));
  };
  
  const selectedCycles = useMemo(() => cycles.filter(c => c.selected), [cycles]);
  
  const averageSelectedTime = useMemo(() => {
    if (selectedCycles.length === 0) return 0;
    return selectedCycles.reduce((sum, c) => sum + c.totalObservedTime, 0) / selectedCycles.length;
  }, [selectedCycles]);

  const pieChartData = useMemo(() => {
    if (selectedCycles.length === 0) return [];
    const avgPickup = selectedCycles.reduce((sum, c) => sum + c.pickupTime, 0) / selectedCycles.length;
    const avgSewing = selectedCycles.reduce((sum, c) => sum + c.sewingTime, 0) / selectedCycles.length;
    const avgTD = selectedCycles.reduce((sum, c) => sum + c.trimAndDisposalTime, 0) / selectedCycles.length;
    return [
      { label: 'Pickup', value: avgPickup, color: '#38bdf8' },
      { label: 'Sewing', value: avgSewing, color: '#3b82f6' },
      { label: 'Trim & Disposal', value: avgTD, color: '#f59e0b' },
    ];
  }, [selectedCycles]);

  const handleSave = () => {
    if (selectedCycles.length === 0) {
      alert("Please select at least one cycle to calculate the average.");
      return;
    }
    const totalObserved = selectedCycles.reduce((sum, c) => sum + c.totalObservedTime, 0);
    const totalStandard = selectedCycles.reduce((sum, c) => sum + c.standardTime, 0);

    const updatedStudy: TimeStudy = {
      ...study,
      cycles,
      averageObservedTime: totalObserved / selectedCycles.length,
      averageStandardTime: totalStandard / selectedCycles.length,
    };
    onSave(updatedStudy);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col transform transition-all" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
            <div>
                <h2 className="text-lg font-semibold text-slate-800">Edit Time Study</h2>
                <p className="text-sm text-slate-500">{operationName} for {employee.name} on {new Date(study.timestamp).toLocaleDateString()}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100"><XIcon className="w-6 h-6" /></button>
        </header>
        
        <main className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-md font-semibold text-slate-800 mb-4">Captured Cycles ({selectedCycles.length} selected)</h3>
            <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-white z-10"><tr className="border-b">
                    <th className="p-2 font-medium w-8"></th>
                    <th className="p-2 font-medium">#</th>
                    <th className="p-2 font-medium">Observed</th>
                    <th className="p-2 font-medium">Std.</th>
                </tr></thead>
                <tbody>
                {cycles.map(c => {
                    const deviation = averageSelectedTime > 0 ? (c.totalObservedTime - averageSelectedTime) / averageSelectedTime : 0;
                    const sentimentColor = deviation > 0.15 ? 'text-red-600' : deviation < -0.15 ? 'text-green-600' : 'text-slate-700';
                    return (
                    <tr key={c.cycleNumber} className={c.selected ? 'bg-slate-50' : ''}>
                        <td className="p-2"><input type="checkbox" checked={c.selected} onChange={() => handleCycleSelection(c.cycleNumber)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"/></td>
                        <td className="p-2 font-mono text-slate-500">{c.cycleNumber}</td>
                        <td className={`p-2 font-mono font-semibold ${sentimentColor}`}>{c.totalObservedTime.toFixed(3)}</td>
                        <td className="p-2 font-mono font-bold text-indigo-700">{c.standardTime.toFixed(3)}</td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
        </main>
        
        <footer className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
            {selectedCycles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="h-32"><PieChart data={pieChartData} /></div>
                    <div className="flex flex-col items-end">
                        <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Save Changes</button>
                    </div>
                </div>
            ) : (
                <p className="text-center text-sm text-slate-500">Select at least one cycle to see summary and save.</p>
            )}
        </footer>
      </div>
    </div>
  );
};
