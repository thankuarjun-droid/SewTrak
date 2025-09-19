import React, { useState, useEffect } from 'react';
import type { NonConformanceReport, Staff } from '../types';
import { XIcon } from './IconComponents';

interface NCModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nc: NonConformanceReport) => void;
  ncToEdit: NonConformanceReport | null;
  staff: Staff[];
}

export const NCModal = ({ isOpen, onClose, onSave, ncToEdit, staff }: NCModalProps) => {
  const [ncData, setNcData] = useState<NonConformanceReport>(
    ncToEdit || {
        id: '', ncNumber: '', date: new Date().toISOString().split('T')[0],
        source: '', sourceId: '', details: '',
        why1: '', why2: '', why3: '', why4: '', why5: '',
        rootCause: '', correctiveAction: '', preventiveAction: '',
        responsibleStaffId: '', dueDate: '', status: 'Open'
    }
  );

  useEffect(() => {
      setNcData(ncToEdit || {
        id: '', ncNumber: '', date: new Date().toISOString().split('T')[0],
        source: 'Manual', sourceId: '', details: '',
        why1: '', why2: '', why3: '', why4: '', why5: '',
        rootCause: '', correctiveAction: '', preventiveAction: '',
        responsibleStaffId: '', dueDate: '', status: 'Open'
    });
  }, [ncToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setNcData({ ...ncData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(ncData);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
            <header className="p-4 border-b flex justify-between items-center">
                <h2 className="font-semibold text-lg">Non-Conformance Report {ncData.ncNumber && `#${ncData.ncNumber}`}</h2>
                <button onClick={onClose}><XIcon className="w-6 h-6"/></button>
            </header>
            <main className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <input name="date" type="date" value={ncData.date} onChange={handleChange} className="h-10 px-2 border-slate-300 rounded-md"/>
                    <input name="source" value={ncData.source} onChange={handleChange} placeholder="Source (e.g., AQL)" className="h-10 px-2 border-slate-300 rounded-md"/>
                    <select name="status" value={ncData.status} onChange={handleChange} className="h-10 px-2 border-slate-300 rounded-md">
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
                <textarea name="details" value={ncData.details} onChange={handleChange} placeholder="Details of Non-Conformance..." rows={3} className="w-full p-2 border-slate-300 rounded-md"></textarea>
                
                <h3 className="font-semibold pt-2 border-t">Why-Why Analysis</h3>
                <input name="why1" value={ncData.why1} onChange={handleChange} placeholder="1. Why?" className="w-full h-9 px-2 border-slate-300 rounded-md"/>
                <input name="why2" value={ncData.why2} onChange={handleChange} placeholder="2. Why?" className="w-full h-9 px-2 border-slate-300 rounded-md"/>
                <input name="why3" value={ncData.why3} onChange={handleChange} placeholder="3. Why?" className="w-full h-9 px-2 border-slate-300 rounded-md"/>
                <input name="why4" value={ncData.why4} onChange={handleChange} placeholder="4. Why?" className="w-full h-9 px-2 border-slate-300 rounded-md"/>
                <input name="why5" value={ncData.why5} onChange={handleChange} placeholder="5. Why? (Root Cause)" className="w-full h-9 px-2 border-slate-300 rounded-md"/>

                <h3 className="font-semibold pt-2 border-t">Actions</h3>
                <textarea name="correctiveAction" value={ncData.correctiveAction} onChange={handleChange} placeholder="Corrective Action..." rows={2} className="w-full p-2 border-slate-300 rounded-md"></textarea>
                <textarea name="preventiveAction" value={ncData.preventiveAction} onChange={handleChange} placeholder="Preventive Action..." rows={2} className="w-full p-2 border-slate-300 rounded-md"></textarea>

                <h3 className="font-semibold pt-2 border-t">Responsibility</h3>
                <div className="grid grid-cols-2 gap-4">
                    <select name="responsibleStaffId" value={ncData.responsibleStaffId} onChange={handleChange} className="h-10 px-2 border-slate-300 rounded-md">
                        <option value="">Assign to Staff</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input name="dueDate" type="date" value={ncData.dueDate} onChange={handleChange} className="h-10 px-2 border-slate-300 rounded-md"/>
                </div>

            </main>
            <footer className="p-4 bg-slate-50 border-t flex justify-end">
                <button onClick={handleSubmit} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md">Save Report</button>
            </footer>
        </div>
    </div>
  );
};
