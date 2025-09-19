
import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Update import statement for App.tsx to fix module resolution error. The original error was caused by App.tsx being a placeholder file.
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);