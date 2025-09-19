import React, { useState, useMemo } from 'react';
import type { KpiSetting } from '../types';

interface KpiSettingsPageProps {
  kpiSettings: KpiSetting[];
  onSaveKpiSettings: (newSettings: KpiSetting[]) => void;
}

const KpiSettingsPage = ({ kpiSettings, onSaveKpiSettings }: KpiSettingsPageProps) => {
  const [currentSettings, setCurrentSettings] = useState(kpiSettings || []);
  const [saveMessage, setSaveMessage] = useState('');

  const groupedSettings = useMemo(() => {
    return currentSettings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, KpiSetting[]>);
  }, [currentSettings]);

  const handleChange = (id: string, field: keyof KpiSetting, value: string | number) => {
    setCurrentSettings(prev =>
      prev.map(s =>
        s.id === id ? { ...s, [field]: value } : s
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKpiSettings(currentSettings);
    setSaveMessage('KPI settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">KPI Settings</h1>
          <p className="text-slate-600 mt-2">Define targets and visualization rules for Key Performance Indicators.</p>
        </div>
        <div>
          <button onClick={handleSubmit} className="px-6 py-2 bg-[#2c4e8a] text-white font-semibold rounded-md hover:bg-[#213a69]">
            Save All Settings
          </button>
          {saveMessage && <p className="mt-2 text-sm text-green-600 text-center">{saveMessage}</p>}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {Object.entries(groupedSettings).map(([category, kpis]) => (
          <div key={category} className="bg-white p-4 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">{category}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600 text-xs">
                    <th className="p-2 font-semibold w-1/4">KPI</th>
                    <th className="p-2 font-semibold w-1/3">Definition</th>
                    <th className="p-2 font-semibold">Unit</th>
                    <th className="p-2 font-semibold">Frequency</th>
                    <th className="p-2 font-semibold">Direction</th>
                    <th className="p-2 font-semibold">Target (Start)</th>
                    <th className="p-2 font-semibold">Target (Stretch)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kpis.map(kpi => (
                    <tr key={kpi.id}>
                      <td className="p-2 font-medium">{kpi.kpi}</td>
                      <td className="p-2 text-slate-500 text-xs">{kpi.definition}</td>
                      <td className="p-2">{kpi.unit}</td>
                      <td className="p-2">{kpi.frequency}</td>
                      <td className="p-2">
                        <select
                          value={kpi.direction}
                          onChange={e => handleChange(kpi.id, 'direction', e.target.value)}
                          className="w-full h-8 px-1 border-slate-300 rounded-md text-xs"
                        >
                          <option value="Up">Up is good</option>
                          <option value="Down">Down is good</option>
                          <option value="Neutral">Neutral</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={kpi.targetStart}
                          onChange={e => handleChange(kpi.id, 'targetStart', Number(e.target.value))}
                          className="w-20 h-8 px-2 text-right border-slate-300 rounded-md text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={kpi.targetStretch}
                          onChange={e => handleChange(kpi.id, 'targetStretch', Number(e.target.value))}
                          className="w-20 h-8 px-2 text-right border-slate-300 rounded-md text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </form>
    </div>
  );
};

export default KpiSettingsPage;