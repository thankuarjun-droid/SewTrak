import React, { useState } from 'react';
import type { FactorySettings, CustomFieldDefinition } from '../types';
import { FormField } from '../components/FormField';
import { PlusIcon, TrashIcon } from '../components/IconComponents';

interface FieldConfigurationPageProps {
  factorySettings: FactorySettings;
  onSaveFactorySettings: (settings: FactorySettings) => void;
}

const FieldConfigurationPage = ({ factorySettings, onSaveFactorySettings }: FieldConfigurationPageProps) => {
    const [targetEntity, setTargetEntity] = useState<'Order' | 'Style' | 'Employee'>('Order');
    const [saveMessage, setSaveMessage] = useState('');
    
    const [newField, setNewField] = useState({ label: '', fieldType: 'text' as CustomFieldDefinition['fieldType'], options: '' });

    const handleAddField = () => {
        if (!newField.label.trim()) {
            alert('Please enter a field label.');
            return;
        }

        const fieldName = newField.label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        if (factorySettings.customFieldDefinitions.some(f => f.fieldName === fieldName && f.targetEntity === targetEntity)) {
            alert(`A field with the name "${fieldName}" already exists for ${targetEntity}.`);
            return;
        }

        const newDefinition: CustomFieldDefinition = {
            id: `cf-${Date.now()}`,
            targetEntity,
            fieldName,
            label: newField.label.trim(),
            fieldType: newField.fieldType,
            options: newField.fieldType === 'dropdown' ? newField.options.split(',').map(o => o.trim()).filter(Boolean) : undefined,
        };
        
        const updatedSettings = {
            ...factorySettings,
            customFieldDefinitions: [...factorySettings.customFieldDefinitions, newDefinition],
        };
        onSaveFactorySettings(updatedSettings);
        setNewField({ label: '', fieldType: 'text', options: '' });
        setSaveMessage(`Field "${newDefinition.label}" added successfully!`);
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const handleDeleteField = (id: string) => {
        if (window.confirm('Are you sure you want to delete this custom field? This cannot be undone.')) {
            const updatedSettings = {
                ...factorySettings,
                customFieldDefinitions: factorySettings.customFieldDefinitions.filter(f => f.id !== id),
            };
            onSaveFactorySettings(updatedSettings);
            setSaveMessage(`Field deleted successfully!`);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };
    
    return (
    <div className="p-4 sm:p-6 md:p-10">
        <header className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Field Configuration</h1>
            <p className="text-slate-600 mt-2">Add custom data fields to different forms and reports across the application.</p>
        </header>
        
        {saveMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">{saveMessage}</div>}

        <div className="bg-white p-6 rounded-2xl shadow-lg">
             <FormField label="Select Area to Customize" htmlFor="targetEntity">
                <select id="targetEntity" value={targetEntity} onChange={(e) => setTargetEntity(e.target.value as any)} className="w-full max-w-sm h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm">
                    <option value="Order">Orders</option>
                    <option value="Style">Styles</option>
                    <option value="Employee">Employees</option>
                </select>
            </FormField>

            <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Add New Field for {targetEntity}s</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg">
                    <input type="text" placeholder="Field Label (e.g., Season Code)" value={newField.label} onChange={(e) => setNewField({...newField, label: e.target.value})} className="h-9 px-2 text-sm border-slate-300 rounded" />
                    <select value={newField.fieldType} onChange={(e) => setNewField({...newField, fieldType: e.target.value as any})} className="h-9 px-2 text-sm border-slate-300 rounded">
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="dropdown">Dropdown</option>
                    </select>
                    <div className="flex gap-2">
                    {newField.fieldType === 'dropdown' && <input type="text" placeholder="Options, comma-separated" value={newField.options} onChange={(e) => setNewField({...newField, options: e.target.value})} className="flex-grow h-9 px-2 text-sm border-slate-300 rounded"/>}
                    <button onClick={handleAddField} className="flex-shrink-0 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add</button>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t">
                 <h3 className="text-lg font-semibold text-slate-700 mb-2">Existing Fields for {targetEntity}s</h3>
                 <div className="space-y-2">
                    {factorySettings.customFieldDefinitions.filter(f => f.targetEntity === targetEntity).map(field => (
                        <div key={field.id} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center p-2 bg-slate-50 rounded text-sm">
                            <span className="font-medium text-slate-800">{field.label}</span>
                            <span className="font-mono text-slate-500">{field.fieldName}</span>
                            <span className="text-slate-600 capitalize">{field.fieldType}</span>
                            <div className="text-right">
                            <button onClick={() => handleDeleteField(field.id)} className="p-1 text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                    {factorySettings.customFieldDefinitions.filter(f => f.targetEntity === targetEntity).length === 0 && (
                        <p className="text-center text-slate-500 text-sm py-4">No custom fields defined for {targetEntity}s yet.</p>
                    )}
                 </div>
            </div>
        </div>
    </div>
    );
};

export default FieldConfigurationPage;