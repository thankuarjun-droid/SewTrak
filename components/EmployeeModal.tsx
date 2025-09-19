import React, { useState, useEffect } from 'react';
import type { Employee, MasterDataItem, OperatorGrade, FactorySettings, CustomFieldDefinition } from '../types';
import { XIcon } from './IconComponents';
import { FormField } from './FormField';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  lines: MasterDataItem[];
  operatorGrades: OperatorGrade[];
  existingEmployees: Employee[];
  employeeToEdit: Employee | null;
  factorySettings: FactorySettings;
}

export const EmployeeModal = ({ isOpen, onClose, onSave, lines, operatorGrades, existingEmployees, employeeToEdit, factorySettings }: EmployeeModalProps) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [ctc, setCtc] = useState('');
  const [currentLineId, setCurrentLineId] = useState('');
  const [doj, setDoj] = useState(new Date().toISOString().split('T')[0]);
  const [operatorGradeId, setOperatorGradeId] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [age, setAge] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married' | 'Divorced' | 'Widowed'>('Single');
  const [area, setArea] = useState('');
  const [customData, setCustomData] = useState<Record<string, any>>({});

  const isEditing = employeeToEdit !== null;
  const customFields = factorySettings.customFieldDefinitions.filter(f => f.targetEntity === 'Employee');

  useEffect(() => {
    if (isOpen) {
      if (isEditing && employeeToEdit) {
        setId(employeeToEdit.id);
        setName(employeeToEdit.name);
        setDesignation(employeeToEdit.designation);
        setCtc(String(employeeToEdit.ctc));
        setCurrentLineId(employeeToEdit.currentLineId);
        setDoj(employeeToEdit.doj);
        setOperatorGradeId(employeeToEdit.operatorGradeId);
        setGender(employeeToEdit.gender);
        setAge(String(employeeToEdit.age));
        setMaritalStatus(employeeToEdit.maritalStatus);
        setArea(employeeToEdit.area);
        setCustomData(employeeToEdit.customData || {});
      } else {
        // Reset form
        setId('');
        setName('');
        setDesignation('');
        setCtc('');
        setCurrentLineId('');
        setDoj(new Date().toISOString().split('T')[0]);
        setOperatorGradeId('');
        setGender('Female');
        setAge('');
        setMaritalStatus('Single');
        setArea('');
        setCustomData({});
      }
    }
  }, [isOpen, employeeToEdit, isEditing]);
  
  const handleCustomDataChange = (fieldName: string, value: any) => {
      setCustomData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = id.trim();
    const trimmedName = name.trim();
    if (!trimmedId || !trimmedName || !gender || !age || !maritalStatus || !area.trim() || !designation.trim() || !ctc || !currentLineId || !doj || !operatorGradeId) {
      alert('Please fill out all fields.');
      return;
    }
    
    if (!isEditing && existingEmployees.some(emp => emp.id.toLowerCase() === trimmedId.toLowerCase())) {
        alert('An employee with this ID already exists.');
        return;
    }

    onSave({
      id: trimmedId,
      name: trimmedName,
      gender,
      age: parseInt(age, 10),
      maritalStatus,
      area: area.trim(),
      designation: designation.trim(),
      ctc: parseInt(ctc, 10),
      currentLineId,
      doj,
      operatorGradeId,
      customData,
    });
    onClose();
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  const renderCustomField = (field: CustomFieldDefinition) => {
    const commonProps = {
      id: `custom-${field.fieldName}`,
      name: field.fieldName,
      value: customData[field.fieldName] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => handleCustomDataChange(field.fieldName, e.target.value),
      className: "w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm"
    };

    switch (field.fieldType) {
      case 'number':
        return <input type="number" {...commonProps} />;
      case 'date':
        return <input type="date" {...commonProps} />;
      case 'dropdown':
        return (
          <select {...commonProps}>
            <option value="">Select an option</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'text':
      default:
        return <input type="text" {...commonProps} />;
    }
  };


  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl transform transition-all" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{isEditing ? 'Edit Employee' : 'Add New Employee'}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close modal">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <FormField label="Employee ID" htmlFor="empId"><input type="text" id="empId" value={id} onChange={e => setId(e.target.value)} required autoFocus disabled={isEditing} className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed" /></FormField>
               <FormField label="Employee Name" htmlFor="empName"><input type="text" id="empName" value={name} onChange={e => setName(e.target.value)} required className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" /></FormField>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Gender" htmlFor="empGender">
                    <select id="empGender" value={gender} onChange={e => setGender(e.target.value as any)} required className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </FormField>
                <FormField label="Age" htmlFor="empAge"><input type="number" id="empAge" value={age} onChange={e => setAge(e.target.value)} required className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm"/></FormField>
                <FormField label="Marital Status" htmlFor="empMarital">
                    <select id="empMarital" value={maritalStatus} onChange={e => setMaritalStatus(e.target.value as any)} required className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm">
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                    </select>
                </FormField>
            </div>
            <FormField label="Area / Location" htmlFor="empArea"><input type="text" id="empArea" value={area} onChange={e => setArea(e.target.value)} required className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" /></FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Designation" htmlFor="empDesignation"><input type="text" id="empDesignation" value={designation} onChange={e => setDesignation(e.target.value)} required className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" /></FormField>
              <FormField label="Salary / CTC (per shift)" htmlFor="empCtc"><input type="number" id="empCtc" value={ctc} onChange={e => setCtc(e.target.value)} required min="0" className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" /></FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Operator Grade" htmlFor="empGrade"><select id="empGrade" value={operatorGradeId} onChange={e => setOperatorGradeId(e.target.value)} required className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm"><option value="" disabled>Select Grade</option>{operatorGrades.map(grade => <option key={grade.id} value={grade.id}>{grade.name}</option>)}</select></FormField>
                <FormField label="Default Line" htmlFor="empLine"><select id="empLine" value={currentLineId} onChange={e => setCurrentLineId(e.target.value)} required className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm"><option value="" disabled>Select Line</option>{lines.map(line => <option key={line.id} value={line.id}>{line.name}</option>)}</select></FormField>
            </div>
             <FormField label="Date of Joining" htmlFor="empDoj"><input type="date" id="empDoj" value={doj} onChange={e => setDoj(e.target.value)} required className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" /></FormField>
             {customFields.length > 0 && <hr className="my-4"/>}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customFields.map(field => (
                    <FormField key={field.id} label={field.label} htmlFor={`custom-${field.fieldName}`}>
                        {renderCustomField(field)}
                    </FormField>
                ))}
             </div>
          </div>

          <footer className="flex justify-end p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition">
              {isEditing ? 'Save Changes' : 'Add Employee'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};