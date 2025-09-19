import React, { useState, useMemo } from 'react';
import type { PageComponentProps, Objective, KeyResult } from '../types';
import { MyGoalsTab } from '../components/performance/MyGoalsTab';
import { UsersIcon, ChatBubbleLeftRightIcon, ClipboardCheckIcon } from '../components/IconComponents';

interface GrowthAndPerformancePageProps extends PageComponentProps {
    onSaveObjective: (objective: Objective) => void;
    onUpdateKeyResult: (keyResult: KeyResult) => void;
}

type Tab = 'goals' | 'feedback' | 'reviews' | 'oneOnOnes';

const GrowthAndPerformancePage = ({ allData, onSaveObjective, onUpdateKeyResult }: GrowthAndPerformancePageProps) => {
    const [activeTab, setActiveTab] = useState<Tab>('goals');
    
    const { currentUser, performanceCycles, objectives, staff } = allData;

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'goals':
                return <MyGoalsTab 
                            currentUser={currentUser}
                            performanceCycles={performanceCycles}
                            objectives={objectives}
                            staff={staff}
                            onSaveObjective={onSaveObjective}
                            onUpdateKeyResult={onUpdateKeyResult}
                        />;
            case 'feedback':
                return <div className="text-center p-10 text-slate-500 dark:text-slate-400">360° Feedback Feature - Coming Soon!</div>;
            case 'reviews':
                return <div className="text-center p-10 text-slate-500 dark:text-slate-400">Performance Reviews Feature - Coming Soon!</div>;
            case 'oneOnOnes':
                return <div className="text-center p-10 text-slate-500 dark:text-slate-400">1-on-1 Meetings Feature - Coming Soon!</div>;
            default:
                return null;
        }
    };

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'goals', label: 'My Goals (OKRs)', icon: ClipboardCheckIcon },
        { id: 'feedback', label: '360° Feedback', icon: UsersIcon },
        { id: 'reviews', label: 'Reviews', icon: ClipboardCheckIcon },
        { id: 'oneOnOnes', label: '1-on-1s', icon: ChatBubbleLeftRightIcon },
    ];

    return (
        <div className="p-4 sm:p-6 md:p-8 flex flex-col h-full">
            <header className="mb-6 flex-shrink-0">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Growth & Performance Hub</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Set goals, give feedback, and track your career growth.</p>
            </header>
            
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id 
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <main className="flex-1 overflow-y-auto py-6">
                {renderActiveTab()}
            </main>
        </div>
    );
};

export default GrowthAndPerformancePage;