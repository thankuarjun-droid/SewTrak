import React from 'react';
import type { PageComponentProps, Notification, TeamMessage, TeamMessageReply, Staff, Page } from '../types';
import { SewTrakLogo, ChartBarIcon, UsersIcon, WrenchIcon } from '../components/IconComponents';
import { NotificationCenter } from '../components/NotificationCenter';

interface HomePageProps extends PageComponentProps {
    notifications: Notification[];
    teamMessages: TeamMessage[];
    staff: Staff[];
    onMarkRead: (id: string) => void;
    onSendMessage: (msg: Omit<TeamMessage, 'id' | 'timestamp' | 'replies'>) => void;
    onReply: (msgId: string, reply: Omit<TeamMessageReply, 'id' | 'timestamp'>) => void;
}


const HomePage = ({ allData, onNavigate, notifications, teamMessages, staff, onMarkRead, onSendMessage, onReply }: HomePageProps) => {
  const { currentUser } = allData;

  const quickLinks = [
    { name: 'Dashboard', icon: ChartBarIcon, page: 'dashboard' },
    { name: 'Production Entry', icon: WrenchIcon, page: 'production' },
    { name: 'Employee Master', icon: UsersIcon, page: 'employees' },
  ] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 h-full bg-slate-50 dark:bg-slate-800/50">
        <div className="lg:col-span-2 flex flex-col items-center justify-center text-center">
            <SewTrakLogo className="h-28" />
            <h1 className="mt-8 text-4xl font-bold text-slate-800 dark:text-slate-100">
                Welcome, {currentUser.name}!
            </h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                You are logged in as a {currentUser.role}.
            </p>

            <div className="mt-12 w-full max-w-2xl">
                <h2 className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Quick Links</h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {quickLinks.map(link => (
                    <button
                    key={link.page}
                    onClick={() => onNavigate(link.page)}
                    className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all"
                    >
                    <link.icon className="w-10 h-10 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    <span className="mt-3 font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{link.name}</span>
                    </button>
                ))}
                </div>
            </div>
        </div>

        <div className="lg:col-span-1 h-full">
            <NotificationCenter 
                currentUser={currentUser}
                notifications={notifications}
                teamMessages={teamMessages}
                staff={staff}
                onMarkRead={onMarkRead}
                onSendMessage={onSendMessage}
                onReply={onReply}
                onNavigate={onNavigate}
            />
        </div>
    </div>
  );
};

export default HomePage;