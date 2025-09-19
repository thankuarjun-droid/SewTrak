import React, { useState } from 'react';
import type { Staff, TeamMessage } from '../types';
import { XIcon, PaperAirplaneIcon } from './IconComponents';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: Omit<TeamMessage, 'id' | 'timestamp' | 'replies'>) => void;
  staff: Staff[];
  currentUser: Staff;
}

export const MessageModal = ({ isOpen, onClose, onSend, staff, currentUser }: MessageModalProps) => {
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const staffOptions = staff
    .filter(s => s.id !== currentUser.id)
    .map(s => ({ value: s.id, label: `${s.name} (${s.role})` }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recipientIds.length === 0 || !subject.trim() || !message.trim()) {
        alert("Please select recipients and fill in the subject and message.");
        return;
    }
    onSend({
        senderId: currentUser.id,
        recipientIds,
        subject,
        message,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <header className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">New Message</h2>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-6 h-6"/></button>
            </header>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">To:</label>
                        <MultiSelectDropdown options={staffOptions} selectedValues={recipientIds} onChange={setRecipientIds} placeholder="Select recipients..." />
                    </div>
                     <div>
                        <label htmlFor="subject" className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject:</label>
                        <input type="text" id="subject" value={subject} onChange={e => setSubject(e.target.value)} className="w-full h-10 px-3 mt-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-300">Message:</label>
                        <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} rows={5} className="w-full p-3 mt-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm"/>
                    </div>
                </div>
                <footer className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-700 flex justify-end">
                    <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-[#2c4e8a] text-white font-semibold rounded-md hover:bg-[#213a69]">
                        <PaperAirplaneIcon className="w-5 h-5"/> Send
                    </button>
                </footer>
            </form>
        </div>
    </div>
  );
};
