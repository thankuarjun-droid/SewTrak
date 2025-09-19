import React, { useState, useEffect } from 'react';
import type { Operation } from '../types';
import { XIcon } from './IconComponents';
import { FormField } from './FormField';

interface OperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (operation: Operation | Omit<Operation, 'id'>) => void;
  existingOperations: Operation[];
  operationToEdit: Operation | null;
}

export const OperationModal = ({ isOpen, onClose, onSave, existingOperations, operationToEdit }: OperationModalProps) => {
  const [name, setName] = useState('');
  const [skillType, setSkillType] = useState<'Basic' | 'Semi Critical' | 'Critical'>('Basic');

  const isEditing = operationToEdit !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && operationToEdit) {
        setName(operationToEdit.name);
        setSkillType(operationToEdit.skillType);
      } else {
        setName('');
        setSkillType('Basic');
      }
    }
  }, [isOpen, operationToEdit, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert('Please enter an operation name.');
      return;
    }

    if (existingOperations.some(op => op.name.toLowerCase() === trimmedName.toLowerCase() && op.id !== operationToEdit?.id)) {
        alert('An operation with this name already exists.');
        return;
    }
    
    if (isEditing && operationToEdit) {
        onSave({ ...operationToEdit, name: trimmedName, skillType });
    } else {
        onSave({ name: trimmedName, skillType });
    }
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{isEditing ? 'Edit Operation' : 'Add New Operation'}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100"><XIcon className="w-6 h-6" /></button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <FormField label="Operation Name" htmlFor="opName">
              <input type="text" id="opName" value={name} onChange={e => setName(e.target.value)} required autoFocus className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" />
            </FormField>
            <FormField label="Skill Type" htmlFor="opSkill">
              <select id="opSkill" value={skillType} onChange={e => setSkillType(e.target.value as any)} required className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm">
                <option value="Basic">Basic</option>
                <option value="Semi Critical">Semi Critical</option>
                <option value="Critical">Critical</option>
              </select>
            </FormField>
          </div>

          <footer className="flex justify-end p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
              {isEditing ? 'Save Changes' : 'Add Operation'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};