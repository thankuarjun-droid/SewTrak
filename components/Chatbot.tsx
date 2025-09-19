
import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, XIcon, SparkleIcon, TrashIcon } from './IconComponents';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onClear: () => void;
}

export const Chatbot = ({ isOpen, onClose, messages, onSendMessage, isLoading, onClear }: ChatbotProps) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-5 w-full max-w-md h-[60vh] z-50 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 transform transition-all duration-300 ease-in-out">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
            <SparkleIcon className="w-6 h-6 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Navvi AI Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={onClear} 
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full disabled:opacity-50"
                aria-label="Clear conversation"
                disabled={messages.length === 0 || isLoading}
            >
                <TrashIcon className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full" aria-label="Close chat">
                <XIcon className="w-6 h-6" />
            </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                <SparkleIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2"/>
                <p className="font-medium">Welcome to your AI Analyst!</p>
                <p className="text-sm">Ask me anything about the data on this page.</p>
                <p className="text-xs mt-4 italic">e.g., "What was the total output for Line 1?" or "Which operation has the highest WIP?"</p>
            </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0"><SparkleIcon className="w-5 h-5 text-white" /></div>}
            <div
              className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2.5 text-sm ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-lg'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-lg'
              }`}
            >
              <div className="prose prose-sm max-w-none text-inherit prose-strong:text-inherit" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}></div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0"><SparkleIcon className="w-5 h-5 text-white" /></div>
                <div className="max-w-xs rounded-2xl px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the data..."
            className="flex-grow bg-transparent h-12 p-2 focus:outline-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};