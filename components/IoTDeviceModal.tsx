import React, { useState, useEffect, useMemo } from 'react';
import type { IoTDevice, Line, Employee } from '../types';
import { XIcon } from './IconComponents';
import { FormField } from './FormField';

interface IoTDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: IoTDevice) => void;
  deviceToEdit: IoTDevice | null;
  existingDevices: IoTDevice[];
  lines: Line[];
  employees: Employee[];
}

export const IoTDeviceModal = ({ isOpen, onClose, onSave, deviceToEdit, existingDevices, lines, employees }: IoTDeviceModalProps) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [assignedLineId, setAssignedLineId] = useState<string | null>(null);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string | null>(null);
  
  const isEditing = useMemo(() => deviceToEdit !== null, [deviceToEdit]);

  useEffect(() => {
    if (deviceToEdit) {
      setId(deviceToEdit.id);
      setName(deviceToEdit.name);
      setAssignedLineId(deviceToEdit.assignedLineId);
      setAssignedEmployeeId(deviceToEdit.assignedEmployeeId);
    } else {
      setId('');
      setName('');
      setAssignedLineId(null);
      setAssignedEmployeeId(null);
    }
  }, [deviceToEdit, isOpen]);

  const employeesOnSelectedLine = useMemo(() => {
    if (!assignedLineId) return [];
    return employees.filter(e => e.currentLineId === assignedLineId);
  }, [assignedLineId, employees]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = id.trim();
    if (!trimmedId || !name.trim()) {
      alert('Device ID and Name are required.');
      return;
    }
    if (!isEditing && existingDevices.some(d => d.id.toLowerCase() === trimmedId.toLowerCase())) {
        alert('A device with this ID already exists.');
        return;
    }

    onSave({
      id: trimmedId,
      name: name.trim(),
      assignedLineId,
      assignedEmployeeId,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{isEditing ? 'Edit IoT Device' : 'Add New IoT Device'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><XIcon className="w-6 h-6"/></button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <FormField label="Device ID (Unique)" htmlFor="deviceId">
              <input type="text" id="deviceId" value={id} onChange={e => setId(e.target.value)} disabled={isEditing} required className="w-full h-10 px-3 border-slate-300 rounded-md disabled:bg-slate-100" />
            </FormField>
            <FormField label="Friendly Name" htmlFor="deviceName">
              <input type="text" id="deviceName" value={name} onChange={e => setName(e.target.value)} required className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
            <FormField label="Assign to Line" htmlFor="assignedLineId">
              <select id="assignedLineId" value={assignedLineId || ''} onChange={e => { setAssignedLineId(e.target.value); setAssignedEmployeeId(null); }} className="w-full h-10 px-3 border-slate-300 rounded-md">
                <option value="">-- No Line --</option>
                {lines.map(line => <option key={line.id} value={line.id}>{line.name}</option>)}
              </select>
            </FormField>
             <FormField label="Assign to Employee" htmlFor="assignedEmployeeId">
              <select id="assignedEmployeeId" value={assignedEmployeeId || ''} onChange={e => setAssignedEmployeeId(e.target.value)} disabled={!assignedLineId} className="w-full h-10 px-3 border-slate-300 rounded-md disabled:bg-slate-100">
                <option value="">-- No Employee --</option>
                {employeesOnSelectedLine.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </FormField>
          </div>
          <footer className="flex justify-end p-4 bg-slate-50 border-t rounded-b-2xl">
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
              {isEditing ? 'Save Changes' : 'Add Device'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
