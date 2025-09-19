
import React, { useState } from 'react';
import type { StaffKpi, UserRole } from '../types';
import { FormField } from '../components/FormField';
import { PlusIcon, TrashIcon } from '../components/IconComponents';

interface PerformanceSettingsPageProps {
  staffKpis: StaffKpi[];
  onSave: (kpis: StaffKpi[]) => void;
}

const ALL_ROLES: UserRole[] = ['Supervisor', 'Quality Controller', 'Industrial Engineer', 'Production Manager', 'Merchandiser'];

const PerformanceSettingsPage = ({ staffKpis, onSave }: PerformanceSettingsPageProps) => {
  const [kpis, setKpis] = useState(staffKpis);
  const [saveMessage, setSaveMessage] = useState('');

  const handleKpiChange = (id: string, field: keyof Omit<StaffKpi, 'id' | 'role'>, value: string | number) => {
    setKpis(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  const handleAddKpi = (role: UserRole) => {
    const newKpi: StaffKpi = {
      id: `KPI-${Date.now()}`,
      role,
      kpi: 'New KPI',
      definition: '',
      source: 'Manual',
      unit: '%',
      weight: 10,
      target: 100,
      threshold: 80,
      // FIX: Add missing properties
      category: 'General',
      frequency: 'Daily',
      direction: 'Up',
    };
    setKpis(prev => [...prev, newKpi]);
  };

  const handleRemoveKpi = (id: string) => {
    setKpis(prev => prev.filter(k => k.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(kpis);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Performance Settings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Define and manage Key Performance Indicators for staff roles.</p>
        </div>
        <button onClick={handleSubmit} className="mt-4 sm:mt-0 px-6 py-2 bg-[#2c4e8a] text-white font-semibold rounded-md hover:bg-[#213a69]">
          Save All Changes
        </button>
      </header>
      {saveMessage && <p className="mb-4 text-sm text-green-600 text-center">{saveMessage}</p>}
      
      <div className="space-y-8">
        {ALL_ROLES.map(role => (
          <div key={role} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{role} KPIs</h2>
              <button onClick={() => handleAddKpi(role)} className="flex items-center gap-1 px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                <PlusIcon className="w-4 h-4" /> Add KPI
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800"><tr className="text-left text-slate-600 dark:text-slate-400 text-xs">
                    <th className="p-2 font-semibold w-1/4">KPI</th>
                    <th className="p-2 font-semibold w-1/3">Definition</th>
                    <th className="p-2 font-semibold">Source</th>
                    <th className="p-2 font-semibold">Unit</th>
                    <th className="p-2 font-semibold">Weight%</th>
                    <th className="p-2 font-semibold">Target</th>
                    <th className="p-2 font-semibold">Threshold</th>
                    <th className="p-2 font-semibold"></th>
                </tr></thead>
                <tbody>
                  {kpis.filter(k => k.role === role).map(kpi => (
                    <tr key={kpi.id} className="border-b dark:border-slate-700">
                      <td className="p-1"><input type="text" value={kpi.kpi} onChange={e => handleKpiChange(kpi.id, 'kpi', e.target.value)} className="w-full h-8 px-2 border dark:border-slate-600 dark:bg-slate-700 rounded"/></td>
                      <td className="p-1"><input type="text" value={kpi.definition} onChange={e => handleKpiChange(kpi.id, 'definition', e.target.value)} className="w-full h-8 px-2 border dark:border-slate-600 dark:bg-slate-700 rounded"/></td>
                      <td className="p-1">
                        <select value={kpi.source} onChange={e => handleKpiChange(kpi.id, 'source', e.target.value)} className="w-full h-8 px-1 border dark:border-slate-600 dark:bg-slate-700 rounded text-xs">
                          <option value="Automatic">Automatic</option>
                          <option value="Manual">Manual</option>
                        </select>
                      </td>
                      <td className="p-1"><input type="text" value={kpi.unit} onChange={e => handleKpiChange(kpi.id, 'unit', e.target.value)} className="w-16 h-8 px-2 border dark:border-slate-600 dark:bg-slate-700 rounded"/></td>
                      <td className="p-1"><input type="number" value={kpi.weight} onChange={e => handleKpiChange(kpi.id, 'weight', Number(e.target.value))} className="w-16 h-8 px-2 border dark:border-slate-600 dark:bg-slate-700 rounded text-right"/></td>
                      <td className="p-1"><input type="number" value={kpi.target} onChange={e => handleKpiChange(kpi.id, 'target', Number(e.target.value))} className="w-16 h-8 px-2 border dark:border-slate-600 dark:bg-slate-700 rounded text-right"/></td>
                      <td className="p-1"><input type="number" value={kpi.threshold} onChange={e => handleKpiChange(kpi.id, 'threshold', Number(e.target.value))} className="w-16 h-8 px-2 border dark:border-slate-600 dark:bg-slate-700 rounded text-right"/></td>
                      <td className="p-1 text-center"><button type="button" onClick={() => handleRemoveKpi(kpi.id)} className="p-1 text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceSettingsPage;
