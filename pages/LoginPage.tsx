

import React, { useState } from 'react';
import type { Staff } from '../types';
import { SewTrakLogo } from '../components/IconComponents';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  staffList: Staff[]; // Used for demo purposes to show available users
}

const LoginPage = ({ onLogin, staffList }: LoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await onLogin(email, password);
    if (!success) {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
           <SewTrakLogo className="h-24 mx-auto" />
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>
            
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-slate-200/50 dark:bg-slate-800/50 p-4 rounded-lg text-xs">
            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Demo Users (password: "password")</h4>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                {staffList.filter(s => s.role !== 'Supervisor').slice(0, 6).map(s => (
                    <li key={s.id}><span className="font-mono">{s.email}</span> ({s.role})</li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;