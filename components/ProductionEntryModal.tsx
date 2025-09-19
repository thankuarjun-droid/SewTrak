import React, { useState, useEffect } from 'react';
import type { ProductionEntry, MasterDataItem, Employee } from '../types';
import { XIcon } from './IconComponents';
import { FormField } from './FormField';

interface ProductionEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: ProductionEntry) => void;
  entryToEdit: ProductionEntry | null;
  downtimeReasons: MasterDataItem[];
  operationsMap: Map<string, string>;
  employeesMap: Map<string, Employee>;
}

export const ProductionEntryModal = ({ 
    isOpen, onClose, onSave, entryToEdit, downtimeReasons, operationsMap, employeesMap 
}: ProductionEntryModalProps) => {
  const [productionQuantity, setProductionQuantity] = useState(0);
  const [downTime, setDownTime] = useState(0);
  const [downTimeReason, setDownTimeReason] = useState('');

  useEffect(() => {
    if (entryToEdit) {
      setProductionQuantity(entryToEdit.productionQuantity);
      setDownTime(entryToEdit.downTime);
      setDownTimeReason(entryToEdit.downTimeReason);
    }
  }, [entryToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryToEdit) return;

    const updatedEntry: ProductionEntry = {
      ...entryToEdit,
      productionQuantity,
      downTime,
      downTimeReason: downTime > 0 ? downTimeReason : '',
    };
    onSave(updatedEntry);
    onClose();
  };
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !entryToEdit) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Edit Production Entry</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close modal"><XIcon className="w-6 h-6" /></button>
        </header>

        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 p-3 rounded-md">
                        <span className="text-slate-500 block">Operation</span>
                        <span className="font-semibold text-slate-800">{operationsMap.get(entryToEdit.operation)}</span>
                    </div>
                     <div className="bg-slate-50 p-3 rounded-md">
                        <span className="text-slate-500 block">Employee</span>
                        <span className="font-semibold text-slate-800">{employeesMap.get(entryToEdit.employeeId)?.name}</span>
                    </div>
                </div>
                 <FormField label="Production Quantity" htmlFor="prodQty">
                    <input type="number" id="prodQty" value={productionQuantity} onChange={e => setProductionQuantity(parseInt(e.target.value, 10) || 0)} required min="0" className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Downtime (minutes)" htmlFor="downTime">
                        <input type="number" id="downTime" value={downTime} onChange={e => setDownTime(parseInt(e.target.value, 10) || 0)} min="0" className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" />
                    </FormField>
                     <FormField label="Downtime Reason" htmlFor="downTimeReason">
                        <input list="downtime-reasons-list-modal" id="downTimeReason" value={downTimeReason} onChange={e => setDownTimeReason(e.target.value)} disabled={downTime <= 0} className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm disabled:bg-slate-100"/>
                        <datalist id="downtime-reasons-list-modal">
                            {downtimeReasons.map(reason => <option key={reason.id} value={reason.name} />)}
                        </datalist>
                    </FormField>
                </div>
            </div>
            <footer className="flex justify-end p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                    Save Changes
                </button>
            </footer>
        </form>
      </div>
    </div>
  );
};