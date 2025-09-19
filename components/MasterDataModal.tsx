import React, { useState, useEffect } from 'react';
import type { MasterDataItem } from '../types';
import { XIcon } from './IconComponents';

type ModalType = 'lines' | 'reasons';

interface MasterDataModalProps {
  modalType: ModalType;
  onClose: () => void;
  onAddItem: (name: string, type: ModalType) => void;
  items: MasterDataItem[];
}

const CONFIG: Record<ModalType, { title: string; label: string }> = {
    lines: { title: 'Manage Line Numbers', label: 'New Line Name' },
    reasons: { title: 'Manage Downtime Reasons', label: 'New Reason Description' },
};

export const MasterDataModal = ({ modalType, onClose, onAddItem, items }: MasterDataModalProps) => {
  const [newItemName, setNewItemName] = useState('');
  const { title, label } = CONFIG[modalType];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim()) {
      onAddItem(newItemName.trim(), modalType);
      setNewItemName('');
    }
  };
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);


  return (
    <div 
      className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Close modal">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={label}
              className="flex-grow h-10 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
              autoFocus
            />
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 transition" disabled={!newItemName.trim()}>
              Add
            </button>
          </form>
          
          <div className="mt-4 max-h-60 overflow-y-auto pr-2">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Existing Items:</h3>
            {items.length > 0 ? (
              <ul className="space-y-1">
                {items.map(item => (
                  <li key={item.id} className="text-slate-700 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-md">
                    {item.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">No items yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};