import React, { useState } from 'react';
import type { GamificationSettings, LevelDefinition } from '../types';
import { FormField } from '../components/FormField';
import { PlusIcon, TrashIcon } from '../components/IconComponents';
import * as Avatars from '../components/LevelAvatars';

const avatarMap = Avatars as unknown as Record<string, React.FC<any>>;

interface LeaderboardSettingsPageProps {
  gamificationSettings: GamificationSettings;
  levelDefinitions: LevelDefinition[];
  onSaveGamificationSettings: (settings: GamificationSettings, levels: LevelDefinition[]) => void;
}

const LeaderboardSettingsPage = ({ gamificationSettings, levelDefinitions, onSaveGamificationSettings }: LeaderboardSettingsPageProps) => {
  const [currentSettings, setCurrentSettings] = useState(gamificationSettings);
  const [currentLevels, setCurrentLevels] = useState(levelDefinitions || []);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSettings(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleLevelChange = (index: number, field: keyof LevelDefinition, value: string | number) => {
    setCurrentLevels(prev => {
      const newLevels = [...prev];
      (newLevels[index] as any)[field] = value;
      return newLevels;
    });
  };
  
  const handleAddLevel = () => {
    const lastLevel = currentLevels[currentLevels.length - 1];
    setCurrentLevels(prev => [...prev, {
        level: (lastLevel?.level || 0) + 1,
        name: 'New Level',
        pointsRequired: (lastLevel?.pointsRequired || 0) + 10000,
        avatar: 'Avatar20'
    }]);
  };
  
  const handleRemoveLevel = (index: number) => {
    if(currentLevels.length <= 1) {
        alert("You must have at least one level.");
        return;
    }
    setCurrentLevels(prev => prev.filter((_, i) => i !== index));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGamificationSettings(currentSettings, currentLevels);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Leaderboard Settings</h1>
        <p className="text-slate-600 mt-2">Configure points, coins, and levels for the gamification system.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Points & Coins Configuration</h2>
            <FormField label="Points for Daily Attendance" htmlFor="pointsForAttendance">
              <input type="number" id="pointsForAttendance" name="pointsForAttendance" value={currentSettings.pointsForAttendance} onChange={handleSettingsChange} className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
            <FormField label="Points per 1,000 Production Units" htmlFor="pointsPerProductionUnit">
              <input type="number" id="pointsPerProductionUnit" name="pointsPerProductionUnit" value={currentSettings.pointsPerProductionUnit} onChange={handleSettingsChange} className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
             <FormField label="Points per 1% Efficiency (above baseline)" htmlFor="pointsPerEfficiencyPercent">
              <input type="number" id="pointsPerEfficiencyPercent" name="pointsPerEfficiencyPercent" value={currentSettings.pointsPerEfficiencyPercent} onChange={handleSettingsChange} className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
            <FormField label="Efficiency Baseline (%)" htmlFor="efficiencyBaseline">
              <input type="number" id="efficiencyBaseline" name="efficiencyBaseline" value={currentSettings.efficiencyBaseline} onChange={handleSettingsChange} className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
            <FormField label="Points per 1% RFT (Right First Time)" htmlFor="pointsPerRFTPercent">
              <input type="number" id="pointsPerRFTPercent" name="pointsPerRFTPercent" value={currentSettings.pointsPerRFTPercent} onChange={handleSettingsChange} className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
            <FormField label="Points for Achieving a Milestone" htmlFor="pointsForMilestone">
              <input type="number" id="pointsForMilestone" name="pointsForMilestone" value={currentSettings.pointsForMilestone} onChange={handleSettingsChange} className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
            <FormField label="Points for Defect-Free Work (per day)" htmlFor="pointsForNoDefects">
              <input type="number" id="pointsForNoDefects" name="pointsForNoDefects" value={currentSettings.pointsForNoDefects} onChange={handleSettingsChange} className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
            <FormField label="Points for Helping a Teammate" htmlFor="pointsForHelping">
              <input type="number" id="pointsForHelping" name="pointsForHelping" value={currentSettings.pointsForHelping} onChange={handleSettingsChange} className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
            <FormField label="Points for Completing Training" htmlFor="pointsForTraining">
              <input type="number" id="pointsForTraining" name="pointsForTraining" value={currentSettings.pointsForTraining} onChange={handleSettingsChange} className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
            <FormField label="Points required for 1 Coin" htmlFor="coinConversionRate">
              <input type="number" id="coinConversionRate" name="coinConversionRate" value={currentSettings.coinConversionRate} onChange={handleSettingsChange} className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800">Level Definitions</h2>
            <div className="space-y-3 mt-4 max-h-96 overflow-y-auto pr-2">
                {currentLevels.sort((a,b) => a.level - b.level).map((level, index) => {
                    const AvatarComponent = avatarMap[level.avatar];
                    return (
                        <div key={index} className="grid grid-cols-5 gap-2 items-center">
                             <div className="flex items-center gap-2">
                                {AvatarComponent && <AvatarComponent className="w-8 h-8"/>}
                                <span className="font-semibold text-slate-600">Lvl {level.level}</span>
                             </div>
                            <input type="text" value={level.name} onChange={e => handleLevelChange(index, 'name', e.target.value)} placeholder="Level Name" className="col-span-2 h-9 px-2 border-slate-300 rounded-md"/>
                            <input type="number" value={level.pointsRequired} onChange={e => handleLevelChange(index, 'pointsRequired', parseInt(e.target.value) || 0)} placeholder="Points" className="h-9 px-2 border-slate-300 rounded-md text-right"/>
                            <button type="button" onClick={() => handleRemoveLevel(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full justify-self-center"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    )
                })}
            </div>
            <button type="button" onClick={handleAddLevel} className="mt-4 w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-300 rounded-md text-slate-600 hover:bg-slate-100">
                <PlusIcon className="w-5 h-5" />
                Add New Level
            </button>
          </div>
        </div>
        <div className="flex justify-center">
            <div className="w-full max-w-sm">
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#2c4e8a] hover:bg-[#213a69]">
                    Save All Settings
                </button>
                {saveMessage && <p className="mt-2 text-sm text-green-600 text-center">{saveMessage}</p>}
            </div>
        </div>
      </form>
    </div>
  );
};

export default LeaderboardSettingsPage;