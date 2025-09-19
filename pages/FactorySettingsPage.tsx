import React, { useState } from 'react';
import type { FactorySettings } from '../types';
import { FormField } from '../components/FormField';

interface FactorySettingsPageProps {
  factorySettings: FactorySettings;
  onSaveFactorySettings: (newSettings: FactorySettings) => void;
}

const FactorySettingsPage = ({ factorySettings, onSaveFactorySettings }: FactorySettingsPageProps) => {
  const [currentSettings, setCurrentSettings] = useState(factorySettings);
  const [saveMessage, setSaveMessage] = useState('');

  const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSettings(prev => ({
      ...prev,
      organizationDetails: { ...prev.organizationDetails, [name]: value },
    }));
  };

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setCurrentSettings(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
        setCurrentSettings(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
             setCurrentSettings(prev => ({
                ...prev,
                organizationDetails: { ...prev.organizationDetails, logoBase64: reader.result as string },
            }));
        };
        reader.readAsDataURL(file);
    } else {
        alert("Please select a valid image file.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFactorySettings(currentSettings);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Factory Settings</h1>
        <p className="text-slate-600 mt-2">Configure general details and operational modes for your factory.</p>
      </header>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Organization Details</h2>
            <FormField label="Organization Name" htmlFor="name">
                <input type="text" id="name" name="name" value={currentSettings.organizationDetails.name} onChange={handleOrgChange} className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
            <FormField label="Address" htmlFor="address">
                <input type="text" id="address" name="address" value={currentSettings.organizationDetails.address} onChange={handleOrgChange} className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
            <FormField label="Logo" htmlFor="logoUpload">
                <input type="file" id="logoUpload" accept="image/*" onChange={handleLogoUpload} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                {currentSettings.organizationDetails.logoBase64 && <img src={currentSettings.organizationDetails.logoBase64} alt="Logo Preview" className="mt-2 h-16 object-contain rounded-md bg-slate-100 p-1"/>}
            </FormField>
          </div>

          <div className="space-y-4 border-t pt-6">
            <h2 className="text-lg font-semibold text-slate-800">Operational Settings</h2>
             <FormField label="Working Hours Per Day" htmlFor="workingHoursPerDay">
                <input type="number" id="workingHoursPerDay" name="workingHoursPerDay" value={currentSettings.workingHoursPerDay} onChange={handleGeneralChange} className="w-full h-10 px-3 border-slate-300 rounded-md" />
            </FormField>
             <FormField label="Default Planning Mode" htmlFor="planningMode">
                <select id="planningMode" name="planningMode" value={currentSettings.planningMode} onChange={handleGeneralChange} className="w-full h-10 px-3 border-slate-300 rounded-md">
                    <option value="Manual">Manual</option>
                    <option value="AI-Assisted">AI-Assisted</option>
                </select>
            </FormField>
            <div className="flex items-center">
              <input type="checkbox" id="iotDeviceMode" name="iotDeviceMode" checked={currentSettings.iotDeviceMode} onChange={handleGeneralChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
              <label htmlFor="iotDeviceMode" className="ml-2 block text-sm text-slate-900">Enable IoT Device Mode</label>
            </div>
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

export default FactorySettingsPage;