import React, { useState, useEffect } from 'react';
import type { Staff, MasterDataItem, UserRole } from '../types';
import { XIcon } from './IconComponents';
import { FormField } from './FormField';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: Staff) => void;
  lines: MasterDataItem[];
  existingStaff: Staff[];
  staffToEdit: Staff | null;
  currentUser: Staff;
}

const USER_ROLES: UserRole[] = ['Admin', 'Supervisor', 'Quality Controller', 'Industrial Engineer', 'Production Manager', 'Merchandiser', 'Operator'];
const LINE_ASSIGNMENT_ROLES: UserRole[] = ['Supervisor', 'Quality Controller', 'Industrial Engineer'];

export const StaffModal = ({ isOpen, onClose, onSave, lines, existingStaff, staffToEdit, currentUser }: StaffModalProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Supervisor');
  const [lineAssignments, setLineAssignments] = useState<Set<string>>(new Set());

  const isEditing = staffToEdit !== null;
  const isAdmin = currentUser.role === 'Admin';
  const showLineAssignment = LINE_ASSIGNMENT_ROLES.includes(role);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && staffToEdit) {
        setName(staffToEdit.name);
        setEmail(staffToEdit.email);
        setPassword(staffToEdit.password);
        setRole(staffToEdit.role);
        setLineAssignments(new Set(staffToEdit.lineAssignments));
      } else {
        setName('');
        setEmail('');
        setPassword('');
        setRole('Supervisor');
        setLineAssignments(new Set());
      }
    }
  }, [isOpen, staffToEdit, isEditing]);
  
  const handleLineAssignmentToggle = (lineId: string) => {
    setLineAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineId)) newSet.delete(lineId);
      else newSet.add(lineId);
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || !email.trim() || !password.trim()) {
      alert('Please fill out name, email, and password.');
      return;
    }
    
    if (existingStaff.some(s => s.email.toLowerCase() === email.trim().toLowerCase() && s.id !== staffToEdit?.id)) {
        alert('A user with this email already exists.');
        return;
    }
    
    let finalLineAssignments: string[] = [];
    if (showLineAssignment) {
        finalLineAssignments = Array.from(lineAssignments);
    } else if (!LINE_ASSIGNMENT_ROLES.includes(role)) {
        finalLineAssignments = ['all'];
    }

    onSave({
      id: staffToEdit?.id || '',
      name: trimmedName,
      email: email.trim(),
      password: password.trim(),
      role,
      lineAssignments: finalLineAssignments,
    });
    onClose();
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{isEditing ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close modal">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <FormField label="User Name" htmlFor="staffName"><input type="text" id="staffName" value={name} onChange={e => setName(e.target.value)} required autoFocus className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" /></FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Email (Login)" htmlFor="email"><input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={!isAdmin} className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm disabled:bg-slate-100 disabled:text-slate-500" /></FormField>
                <FormField label="Password" htmlFor="password"><input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={!isAdmin} className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm disabled:bg-slate-100 disabled:text-slate-500" /></FormField>
            </div>
            <FormField label="User Role" htmlFor="role">
                <select id="role" value={role} onChange={e => setRole(e.target.value as UserRole)} required disabled={!isAdmin} className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm disabled:bg-slate-100 disabled:text-slate-500">
                    {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </FormField>
            {showLineAssignment && (
                <FormField label="Assign to Lines" htmlFor="lines">
                    <div className="max-h-40 overflow-y-auto pr-2 border rounded-md p-3 space-y-2 bg-slate-50">
                    {lines.map(line => (
                        <div key={line.id} className="flex items-center">
                            <input type="checkbox" id={`line-${line.id}`} checked={lineAssignments.has(line.id)} onChange={() => handleLineAssignmentToggle(line.id)} disabled={!isAdmin} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 disabled:cursor-not-allowed" />
                            <label htmlFor={`line-${line.id}`} className="ml-3 text-sm text-slate-700">{line.name}</label>
                        </div>
                    ))}
                    </div>
                </FormField>
            )}
            {!isAdmin && <p className="text-xs text-slate-500 italic mt-2">Only an Admin can edit user credentials, roles and assignments.</p>}
          </div>

          <footer className="flex justify-end p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
              {isEditing ? 'Save Changes' : 'Add User'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};