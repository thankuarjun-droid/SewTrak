import React, { useState } from 'react';
import type { AllowanceSettings, Machine } from '../types';
import { FormField } from '../components/FormField';

interface AllowanceSettingsPageProps {
  allowanceSettings: AllowanceSettings;
  machines: Machine[];
  onSaveAllowanceSettings: (newSettings: AllowanceSettings) => void;
  onSaveMachines: (newMachines: Machine[]) => void;
}

const AllowanceSettingsPage = ({ allowanceSettings, machines, onSaveAllowanceSettings, onSaveMachines }: AllowanceSettingsPageProps) => {
  const [currentSettings, setCurrentSettings] = useState(allowanceSettings);
  const [currentMachines, setCurrentMachines] = useState(machines || []);
  const [saveMessage, setSaveMessage] = useState('');

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSettings(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleMachineChange = (machineId: string, value: string) => {
    setCurrentMachines(prev => prev.map(m => 
      m.id === machineId ? { ...m, allowance: parseFloat(value) || 0 } : m
    ));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAllowanceSettings(currentSettings);
    onSaveMachines(currentMachines);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Time Study Allowance Settings</h1>
        <p className="text-slate-600 mt-2">Configure standard allowances used to calculate Standard Time.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">General Allowances</h2>
            <FormField label="Personal & Fatigue Allowance (%)" htmlFor="personalAndFatigue">
              <input
                type="number"
                id="personalAndFatigue"
                name="personalAndFatigue"
                value={currentSettings.personalAndFatigue}
                onChange={handleGeneralChange}
                min="0"
                step="0.1"
                required
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm"
              />
            </FormField>
            <FormField label="Bundle Allowance (%)" htmlFor="bundle">
              <input
                type="number"
                id="bundle"
                name="bundle"
                value={currentSettings.bundle}
                onChange={handleGeneralChange}
                min="0"
                step="0.1"
                required
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm"
              />
            </FormField>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800">Machine-Specific Allowances</h2>
             <div className="mt-4 space-y-4 max-h-60 overflow-y-auto pr-2">
                {currentMachines.map(machine => (
                    <FormField key={machine.id} label={`${machine.name} (%)`} htmlFor={`machine-${machine.id}`}>
                        <input
                            type="number"
                            id={`machine-${machine.id}`}
                            value={machine.allowance || 0}
                            onChange={(e) => handleMachineChange(machine.id, e.target.value)}
                            min="0"
                            step="0.1"
                            className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm"
                        />
                    </FormField>
                ))}
             </div>
          </div>
        </div>
        <div className="flex justify-center">
            <div className="w-full max-w-sm">
                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#2c4e8a] hover:bg-[#213a69]"
                >
                    Save All Settings
                </button>
                {saveMessage && <p className="mt-2 text-sm text-green-600 text-center">{saveMessage}</p>}
            </div>
        </div>
      </form>
    </div>
  );
};

export default AllowanceSettingsPage;