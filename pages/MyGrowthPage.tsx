
import React from 'react';
import type { PageComponentProps } from '../types';

const MyGrowthPage = (props: PageComponentProps) => {
    return (
        <div className="p-4 sm:p-6 md:p-10">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">My Growth</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">This is a placeholder for your personal growth and performance page.</p>
        </div>
    );
};

export default MyGrowthPage;
