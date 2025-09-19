import React, { useState } from 'react';
import type { KanbanSettings } from '../types';
import { FormField } from '../components/FormField';

interface KanbanSettingsPageProps {
  kanbanSettings: KanbanSettings;
  onSaveKanbanSettings: (newSettings: KanbanSettings) => void;
}

const KanbanSettingsPage = ({ kanbanSettings, onSaveKanbanSettings }: KanbanSettingsPageProps) => {
  const [currentSettings, setCurrentSettings] = useState(kanbanSettings);
  const [saveMessage, setSaveMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSettings(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKanbanSettings(currentSettings);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">KANBAN Settings</h1>
        <p className="text-slate-600 mt-2">Configure the rules for your KANBAN card system.</p>
      </header>

      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg space-y-6">
          <FormField label="Max Quantity per KANBAN Card" htmlFor="maxQuantityPerCard">
            <input
              type="number"
              id="maxQuantityPerCard"
              name="maxQuantityPerCard"
              value={currentSettings.maxQuantityPerCard}
              onChange={handleChange}
              min="1"
              required
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm"
            />
          </FormField>
          <FormField label="Max Active KANBAN Cards per Line" htmlFor="maxActiveCardsPerLine">
            <input
              type="number"
              id="maxActiveCardsPerLine"
              name="maxActiveCardsPerLine"
              value={currentSettings.maxActiveCardsPerLine}
              onChange={handleChange}
              min="1"
              required
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm"
            />
          </FormField>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#2c4e8a] hover:bg-[#213a69]"
          >
            Save Settings
          </button>
          {saveMessage && <p className="text-sm text-green-600 text-center">{saveMessage}</p>}
        </form>
      </div>
    </div>
  );
};

export default KanbanSettingsPage;