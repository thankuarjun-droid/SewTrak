import React, { useState } from 'react';
import type { OutputSettings } from '../types';

interface OutputSettingsPageProps {
  outputSettings: OutputSettings;
  onSaveOutputSettings: (newSettings: OutputSettings) => void;
}

const OutputSettingsPage = ({ outputSettings, onSaveOutputSettings }: OutputSettingsPageProps) => {
  const [currentSettings, setCurrentSettings] = useState(outputSettings);
  const [saveMessage, setSaveMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentSettings({ source: e.target.value as 'lastOperation' | 'endOfLine' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveOutputSettings(currentSettings);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Output Calculation Settings</h1>
        <p className="text-slate-600 mt-2">Choose the source for calculating final production output and efficiency.</p>
      </header>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg space-y-6">
          <div>
            <label className="text-base font-medium text-slate-900">Production Output Source</label>
            <p className="text-sm text-slate-500">This setting determines how the final production output is counted across all dashboards and reports.</p>
            <fieldset className="mt-4">
              <legend className="sr-only">Output Source</legend>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="lastOperation"
                      name="source"
                      type="radio"
                      value="lastOperation"
                      checked={currentSettings.source === 'lastOperation'}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="lastOperation" className="font-medium text-slate-700">Last Operation Output</label>
                    <p className="text-slate-500">Output is counted when a unit is processed at the final operation in a style's bulletin. (Standard Method)</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="endOfLine"
                      name="source"
                      type="radio"
                      value="endOfLine"
                      checked={currentSettings.source === 'endOfLine'}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="endOfLine" className="font-medium text-slate-700">End-of-Line Inspection Pass Count</label>
                    <p className="text-slate-500">Output is only counted when a unit passes the final End-of-Line Inspection. This is a more quality-focused approach.</p>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
          
           <div className="pt-6 border-t border-slate-200">
             <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#2c4e8a] hover:bg-[#213a69]"
              >
                Save Settings
              </button>
              {saveMessage && <p className="mt-2 text-sm text-green-600 text-center">{saveMessage}</p>}
           </div>
        </form>
      </div>
    </div>
  );
};

export default OutputSettingsPage;