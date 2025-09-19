import React, { useState } from 'react';
import type { MasterDataItem } from '../types';
import { TrashIcon } from '../components/IconComponents';
import { downloadCsv, downloadTemplate } from '../services/exportService';

interface MasterDataManagementPageProps {
  title: string;
  items: MasterDataItem[];
  onAddItem: (name: string) => void;
  onDeleteItem?: (itemId: string) => void;
  note?: string;
}

const MasterDataManagementPage = ({ title, items = [], onAddItem, onDeleteItem, note }: MasterDataManagementPageProps) => {
  const [newItemName, setNewItemName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      onAddItem(newItemName.trim());
      setNewItemName('');
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      alert(`File "${file.name}" selected. In a real application, you would now parse this CSV.`);
      // Here you would add logic to read and process the CSV file
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">View and add new items to your master list.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Add New Item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="newItemName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Name
                </label>
                <input
                  type="text"
                  id="newItemName"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`Enter new ${title.toLowerCase().slice(0, -1)} name`}
                  className="mt-1 w-full h-10 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!newItemName.trim()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#2c4e8a] hover:bg-[#213a69] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c4e8a] disabled:bg-[#2c4e8a]/50 transition"
              >
                Add Item
              </button>
            </form>
             {note && <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 italic">{note}</p>}
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg mt-8">
             <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Data Management</h2>
             <div className="space-y-2">
                <button onClick={() => downloadTemplate(['name'])} className="w-full text-sm font-medium text-center py-2 px-4 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">Download Template</button>
                <input type="file" id="csvUpload" className="hidden" accept=".csv" onChange={handleFileUpload} />
                <label htmlFor="csvUpload" className="w-full text-sm font-medium text-center py-2 px-4 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer block">Upload CSV</label>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Existing Items ({items.length})</h2>
                <button onClick={() => downloadCsv(items, 'master_data')} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">Download CSV</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              {items.length > 0 ? (
                <ul className="space-y-2">
                  {items.map(item => (
                    <li key={item.id} className="text-slate-800 dark:text-slate-200 text-sm bg-slate-50 dark:bg-slate-700/50 px-4 py-3 rounded-md flex justify-between items-center group">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono ml-4">{item.id}</span>
                      </div>
                      {onDeleteItem && (
                        <button 
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Delete ${item.name}`}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-8">No items have been added yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterDataManagementPage;