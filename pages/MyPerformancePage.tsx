import React from 'react';
import type { PageComponentProps } from '../types';
import StaffDailyPerformancePage from './StaffDailyPerformancePage';

// FIX: Replace placeholder content with the functional StaffDailyPerformancePage.
const MyPerformancePage = (props: PageComponentProps) => {
    // The props passed from App.tsx are richer than PageComponentProps
    // and include the handlers needed by StaffDailyPerformancePage.
    return <StaffDailyPerformancePage {...props as any} />;
};

export default MyPerformancePage;
