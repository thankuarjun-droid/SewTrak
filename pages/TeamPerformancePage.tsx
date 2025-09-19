import React from 'react';
import type { PageComponentProps } from '../types';
import StaffPerformanceDashboard from './StaffPerformanceDashboard';

// FIX: Cast props to 'any' to pass through the necessary onSaveRecord handler from App.tsx.
const TeamPerformancePage = (props: PageComponentProps) => {
    return <StaffPerformanceDashboard {...props as any} />;
};

export default TeamPerformancePage;
