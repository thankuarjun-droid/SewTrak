
import React, { useState, useEffect } from 'react';
import type { Objective, KeyResult, KeyResultType, Staff } from '../../types';
import { XIcon, PlusIcon, TrashIcon } from '../IconComponents';
import { FormField } from '../FormField';

interface ObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (objective: Objective) => void;
  objectiveToEdit: Objective | null;
  currentUser: Staff;
  activeCycleId: string;
}

export const ObjectiveModal = ({ isOpen, onClose, onSave, objectiveToEdit, currentUser, activeCycleId }: ObjectiveModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keyResults, setKeyResults] = useState<Partial<KeyResult>[]>([]);

  useEffect(() => {
    if (objectiveToEdit) {
      setTitle(objectiveToEdit.title);
      setDescription(objectiveToEdit.description || '');
      setKeyResults(objectiveToEdit.keyResults);
    } else {
      setTitle('');
      setDescription('');
      setKeyResults([{ description: '', type: 'NUMBER', startValue: 0, targetValue: 100, weight: 100 }]);
    }
  }, [objectiveToEdit, isOpen]);
  
  const handleKrChange = (index: number, field: keyof KeyResult, value: string | number) => {
      const newKrs = [...keyResults];
      const kr = { ...newKrs[index] };
      (kr as any)[field] = value;
      if(field === 'type') (kr as any)['startValue'] = 0; // Reset values on type change
      newKrs[index] = kr;
      setKeyResults(newKrs);
  };

  const addKeyResult = () => {
    setKeyResults([...keyResults, { description: '', type: 'NUMBER', startValue: 0, targetValue: 100, weight: 10 }]);
  };

  const removeKeyResult = (index: number) => {
    if (keyResults.length > 1) {
      setKeyResults(keyResults.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalWeight = keyResults.reduce((sum, kr) => sum + (kr.weight || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.1 && keyResults.length > 0) {
        alert(`Key Result weights must sum to 100%. Current sum is ${totalWeight}%.`);
        return;
    }
    const finalObjective: Objective = {
        id: objectiveToEdit?.id || '',
        cycleId: activeCycleId,
        ownerId: currentUser.id,
        title,
        description,
        visibility: 'Public', // Simplified for now
        keyResults: keyResults.map(kr => ({ ...kr, currentValue: kr.currentValue || kr.startValue || 0 })) as KeyResult[],
    };
    onSave(finalObjective);
    onClose();
  };
  
  if(!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="flex-shrink-0 p-4 border-b dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold">{objectiveToEdit ? 'Edit Objective' : 'Create New Objective'}</h2>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-6 h-6"/></button>
            </header>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 p-6 space-y-4 overflow-y-auto">
                    <FormField label="Objective Title" htmlFor="objTitle">
                        <input type="text" id="objTitle" value={title} onChange={e => setTitle(e.target.value)} required className="w-full h-10 px-3 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" />
                    </FormField>
                    <FormField label="Description (Optional)" htmlFor="objDesc">
                        <textarea id="objDesc" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full p-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" />
                    </FormField>

                    <div>
                        <h3 className="text-md font-semibold mb-2">Key Results</h3>
                        <div className="space-y-3">
                            {keyResults.map((kr, index) => (
                                <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-600">
                                    <div className="flex gap-2">
                                        <input type="text" value={kr.description} onChange={e => handleKrChange(index, 'description', e.target.value)} placeholder="e.g., Increase sales by 10%" required className="flex-grow h-9 px-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded"/>
                                        <button type="button" onClick={() => removeKeyResult(index)} disabled={keyResults.length <= 1} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full disabled:opacity-30"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                        <select value={kr.type} onChange={e => handleKrChange(index, 'type', e.target.value as KeyResultType)} className="h-9 px-2 text-xs border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded">
                                            <option value="NUMBER">Number</option>
                                            <option value="PERCENTAGE">Percentage</option>
                                            <option value="CURRENCY">Currency</option>
                                        </select>
                                        <input type="number" step="any" value={kr.startValue} onChange={e => handleKrChange(index, 'startValue', Number(e.target.value))} placeholder="Start" className="h-9 px-2 text-xs border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded"/>
                                        <input type="number" step="any" value={kr.targetValue} onChange={e => handleKrChange(index, 'targetValue', Number(e.target.value))} placeholder="Target" className="h-9 px-2 text-xs border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded"/>
                                        <div className="relative"><input type="number" value={kr.weight} onChange={e => handleKrChange(index, 'weight', Number(e.target.value))} placeholder="Weight" className="h-9 w-full pl-2 pr-5 text-xs border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded"/><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addKeyResult} className="mt-3 flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md font-semibold"><PlusIcon className="w-4 h-4"/> Add Key Result</button>
                    </div>
                </main>
                <footer className="flex-shrink-0 p-4 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-700 flex justify-end">
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Save Objective</button>
                </footer>
            </form>
        </div>
    </div>
  );
};
