import React, { useState } from 'react';
import type { OperatorGrade, GradePerformanceSetting } from '../types';

interface GradeSettingsPageProps {
  operatorGrades: OperatorGrade[];
  gradePerformanceSettings: GradePerformanceSetting[];
  onSaveGradeSettings: (newSettings: GradePerformanceSetting[]) => void;
}

const GradeSettingsPage = ({ operatorGrades, gradePerformanceSettings, onSaveGradeSettings }: GradeSettingsPageProps) => {
  const [currentSettings, setCurrentSettings] = useState<GradePerformanceSetting[]>(
    operatorGrades.map(grade => {
      const existing = (gradePerformanceSettings || []).find(s => s.gradeId === grade.id);
      return existing || { gradeId: grade.id, minEfficiency: 0, maxEfficiency: 0 };
    })
  );
  const [saveMessage, setSaveMessage] = useState('');

  const handleChange = (gradeId: string, field: 'minEfficiency' | 'maxEfficiency', value: string) => {
    setCurrentSettings(prev =>
      prev.map(s =>
        s.gradeId === gradeId ? { ...s, [field]: parseInt(value, 10) || 0 } : s
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGradeSettings(currentSettings);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Grade Performance Settings</h1>
        <p className="text-slate-600 mt-2">Define the expected efficiency percentage range for each operator grade against the SMV.</p>
      </header>
      
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        <div className="space-y-6">
          {currentSettings.map(setting => {
            const gradeName = operatorGrades.find(g => g.id === setting.gradeId)?.name;
            return (
              <div key={setting.gradeId} className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                <label className="sm:col-span-1 font-medium text-slate-700">{gradeName}</label>
                <div className="sm:col-span-2 grid grid-cols-2 gap-2 items-center">
                  <input
                    type="number"
                    value={setting.minEfficiency}
                    onChange={e => handleChange(setting.gradeId, 'minEfficiency', e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm"
                    placeholder="Min Efficiency %"
                  />
                   <input
                    type="number"
                    value={setting.maxEfficiency}
                    onChange={e => handleChange(setting.gradeId, 'maxEfficiency', e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm"
                    placeholder="Max Efficiency %"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200">
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#2c4e8a] hover:bg-[#213a69]">
                Save Settings
            </button>
            {saveMessage && <p className="mt-2 text-sm text-green-600 text-center">{saveMessage}</p>}
        </div>
      </form>
    </div>
  );
};

export default GradeSettingsPage;