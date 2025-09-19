import React, { useState } from 'react';
import type { Staff, Notification, TeamMessage, TeamMessageReply, Page } from '../types';
import { BellIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, PlusIcon } from './IconComponents';
import { MessageModal } from './MessageModal';

interface NotificationCenterProps {
  currentUser: Staff;
  notifications: Notification[];
  teamMessages: TeamMessage[];
  staff: Staff[];
  onMarkRead: (id: string) => void;
  onSendMessage: (msg: Omit<TeamMessage, 'id' | 'timestamp' | 'replies'>) => void;
  onReply: (msgId: string, reply: Omit<TeamMessageReply, 'id' | 'timestamp'>) => void;
  onNavigate: (page: Page) => void;
}

export const NotificationCenter = ({ currentUser, notifications, teamMessages, staff, onMarkRead, onSendMessage, onReply, onNavigate }: NotificationCenterProps) => {
    const [activeTab, setActiveTab] = useState<'alerts' | 'messages'>('alerts');
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState<TeamMessage | null>(null);
    const [replyText, setReplyText] = useState('');

    const staffMap = new Map(staff.map(s => [s.id, s]));
    const unreadAlertsCount = notifications.filter(n => n.userId === currentUser.id && !n.read).length;
    
    const myMessages = teamMessages.filter(m => m.recipientIds.includes(currentUser.id) || m.recipientIds.includes('all') || m.senderId === currentUser.id);

    const handleReply = (messageId: string) => {
        if (!replyText.trim()) return;
        onReply(messageId, { senderId: currentUser.id, message: replyText });
        setReplyText('');
        setReplyingTo(null);
    };

    const handleSendMessage = (message: Omit<TeamMessage, 'id' | 'timestamp' | 'replies'>) => {
        onSendMessage(message);
        setIsMessageModalOpen(false);
    }
    
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg h-[85vh] flex flex-col">
            <header className="flex-shrink-0 p-2 border-b dark:border-slate-700">
                <nav className="flex items-center justify-around bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1">
                    <button onClick={() => setActiveTab('alerts')} className={`flex items-center justify-center gap-2 w-1/2 py-2 text-sm font-semibold rounded-md ${activeTab === 'alerts' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
                        <BellIcon className="w-5 h-5"/> Alerts {unreadAlertsCount > 0 && <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{unreadAlertsCount}</span>}
                    </button>
                    <button onClick={() => setActiveTab('messages')} className={`flex items-center justify-center gap-2 w-1/2 py-2 text-sm font-semibold rounded-md ${activeTab === 'messages' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>
                        <ChatBubbleLeftRightIcon className="w-5 h-5"/> Messages
                    </button>
                </nav>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === 'alerts' && (
                    <div>
                        <h3 className="font-semibold mb-2 text-slate-700 dark:text-slate-200">Your Notifications</h3>
                        {notifications.filter(n => n.userId === currentUser.id).length === 0 && <p className="text-sm text-slate-500 text-center py-8">No notifications yet.</p>}
                        {notifications.filter(n => n.userId === currentUser.id).map(n => (
                            <div key={n.id} className={`p-3 rounded-lg border-l-4 ${n.read ? 'bg-slate-50 dark:bg-slate-700/30 border-slate-300 dark:border-slate-600' : 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400'}`}>
                                <p className="text-sm text-slate-800 dark:text-slate-200">{n.message}</p>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex justify-between items-center">
                                    <span>{new Date(n.timestamp).toLocaleString()}</span>
                                    <div>
                                        {n.link && <button onClick={() => onNavigate(n.link!.page)} className="font-semibold text-indigo-600 dark:text-indigo-400 mr-2">View</button>}
                                        {!n.read && <button onClick={() => onMarkRead(n.id)} className="font-semibold text-slate-500 hover:text-slate-700">Dismiss</button>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 {activeTab === 'messages' && (
                    <div>
                         <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Team Messages</h3>
                            <button onClick={() => setIsMessageModalOpen(true)} className="flex items-center gap-1 text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold"><PlusIcon className="w-4 h-4"/> New</button>
                        </div>
                        {myMessages.map(msg => (
                            <div key={msg.id} className="p-3 border-b dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400">From: <span className="font-semibold">{staffMap.get(msg.senderId)?.name}</span></p>
                                <p className="font-bold text-sm mt-1 text-slate-800 dark:text-slate-200">{msg.subject}</p>
                                <p className="text-sm mt-1 text-slate-600 dark:text-slate-300">{msg.message}</p>
                                {msg.replies.map(reply => (
                                    <div key={reply.id} className="mt-2 ml-4 p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Reply from: <span className="font-semibold">{staffMap.get(reply.senderId)?.name}</span></p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{reply.message}</p>
                                    </div>
                                ))}
                                {replyingTo?.id === msg.id ? (
                                    <div className="mt-2 flex items-center gap-2">
                                        <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." className="flex-grow h-9 px-2 text-sm border-slate-300 rounded-md" autoFocus/>
                                        <button onClick={() => handleReply(msg.id)} className="p-2 bg-indigo-600 text-white rounded-md"><PaperAirplaneIcon className="w-4 h-4"/></button>
                                    </div>
                                ) : (
                                    <button onClick={() => setReplyingTo(msg)} className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-2">Reply</button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
            {isMessageModalOpen && <MessageModal isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} onSend={handleSendMessage} staff={staff} currentUser={currentUser} />}
        </div>
    );
};
