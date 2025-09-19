
import React, { useState, useEffect } from 'react';
import type { KeyResult } from '../../types';
import { XIcon } from '../IconComponents';

interface KeyResultUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keyResult: KeyResult) => void;
  keyResult: KeyResult;
  formatValue: (kr: KeyResult, value: number) => string;
}

export const KeyResultUpdateModal = ({ isOpen, onClose, onSave, keyResult, formatValue }: KeyResultUpdateModalProps) => {
  const [currentValue, setCurrentValue] = useState(keyResult.currentValue);

  useEffect(() => {
    setCurrentValue(keyResult.currentValue);
  }, [keyResult]);
  
  const handleSave = () => {
    onSave({ ...keyResult, currentValue });
    onClose();
  };
  
  const progressPercent = ((currentValue - keyResult.startValue) / (keyResult.targetValue - keyResult.startValue)) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
             <header className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Update Key Result</h2>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-6 h-6"/></button>
            </header>
            <main className="p-6 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">{keyResult.description}</p>
                <div className="text-center my-4">
                    <span className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        {formatValue(keyResult, currentValue)}
                    </span>
                </div>
                <input
                    type="range"
                    min={keyResult.startValue}
                    max={keyResult.targetValue}
                    step={keyResult.type === 'NUMBER' ? 1 : 0.1}
                    value={currentValue}
                    onChange={(e) => setCurrentValue(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
                 <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>{formatValue(keyResult, keyResult.startValue)}</span>
                    <span>{formatValue(keyResult, keyResult.targetValue)}</span>
                </div>
            </main>
            <footer className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-700 flex justify-end">
                <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Update Progress</button>
            </footer>
        </div>
    </div>
  );
};
