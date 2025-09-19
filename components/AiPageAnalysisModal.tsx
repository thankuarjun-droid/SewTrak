
import React from 'react';
import { XIcon, SparkleIcon } from './IconComponents';

interface AiPageAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isLoading: boolean;
  operationName: string;
}

export const AiPageAnalysisModal = ({ isOpen, onClose, content, isLoading, operationName }: AiPageAnalysisModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col transform transition-all" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-2">
                <SparkleIcon className="w-6 h-6 text-indigo-500" />
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">AI Analysis</h2>
                    <p className="text-sm text-slate-500">Page-level insights for: {operationName}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100"><XIcon className="w-6 h-6" /></button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
            {isLoading ? (
                 <div className="space-y-6 animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-6 bg-slate-200 rounded w-1/3 mt-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                 </div>
            ) : (
                <div className="prose prose-base max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
            )}
        </main>
      </div>
    </div>
  );
};