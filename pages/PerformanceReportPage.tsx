import React, { useState, useMemo } from 'react';
import type { Staff, StaffPerformanceRecord, StaffKpi, Line } from '../types';
import GaugeChart from '../components/GaugeChart';

interface AllData {
    currentUser: Staff;
    lines: Line[];
    staff: Staff[];
    staffPerformanceRecords: StaffPerformanceRecord[];
    staffKpis: StaffKpi[];
}

interface PerformanceReportPageProps {
  allData: AllData;
}

type Period = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

const PerformanceReportPage = ({ allData }: PerformanceReportPageProps) => {
    const { currentUser, staff, staffPerformanceRecords, staffKpis } = allData;
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('Monthly');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedStaffId, setSelectedStaffId] = useState('');

    const myTeam = useMemo(() => {
        if (currentUser.role === 'Admin' || currentUser.role === 'Production Manager') {
            return staff.filter(s => s.role !== 'Operator');
        }
        if (currentUser.role === 'Supervisor') {
            const supervisedLines = new Set(currentUser.lineAssignments);
            return staff.filter(s => s.lineAssignments.some(lineId => supervisedLines.has(lineId)));
        }
        return [currentUser];
    }, [currentUser, staff]);

    // Set default selection to the first team member if none is selected
    useState(() => {
        if (!selectedStaffId && myTeam.length > 0) {
            setSelectedStaffId(myTeam[0].id);
        }
    });

    const reportData = useMemo(() => {
        if (!selectedStaffId) return null;

        const staffMember = staff.find(s => s.id === selectedStaffId);
        if (!staffMember) return null;

        const now = selectedDate;
        let startDate: Date, endDate: Date;

        switch (selectedPeriod) {
            case 'Daily':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                break;
            case 'Weekly':
                const firstDay = now.getDate() - now.getDay() + 1;
                startDate = new Date(now.setDate(firstDay));
                startDate.setHours(0,0,0,0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23,59,59,999);
                break;
            case 'Quarterly':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
                break;
            case 'Yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            case 'Monthly':
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
        }

        const relevantRecords = (staffPerformanceRecords || []).filter(r => {
            const recordDate = new Date(r.date);
            return r.staffId === selectedStaffId && recordDate >= startDate && recordDate <= endDate;
        });

        const myKpis = staffKpis.filter(kpi => kpi.role === staffMember.role);
        
        const aggregatedMetrics: Record<string, { sum: number, count: number }> = {};
        relevantRecords.forEach(record => {
            Object.entries(record.autoMetrics).forEach(([kpiId, value]) => {
                if (!aggregatedMetrics[kpiId]) aggregatedMetrics[kpiId] = { sum: 0, count: 0 };
                aggregatedMetrics[kpiId].sum += value;
                aggregatedMetrics[kpiId].count++;
            });
        });

        let totalWeightedScore = 0;
        let totalWeight = 0;
        myKpis.forEach(kpi => {
            const metric = aggregatedMetrics[kpi.id];
            if (metric && metric.count > 0) {
                const avgValue = metric.sum / metric.count;
                const isDownGood = (kpi.kpi.toLowerCase().includes('cost') || kpi.kpi.toLowerCase().includes('downtime'));
                const performanceRatio = kpi.target > 0 ? (isDownGood ? kpi.target / (avgValue || 1) : avgValue / kpi.target) : 1;
                totalWeightedScore += Number(performanceRatio) * Number(kpi.weight);
                totalWeight += Number(kpi.weight);
            }
        });

        const weightedScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 100;
        
        return {
            weightedScore,
            records: relevantRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };

    }, [selectedStaffId, selectedPeriod, selectedDate, staff, staffPerformanceRecords, staffKpis]);

    const handleDateChange = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate);
        const increment = direction === 'prev' ? -1 : 1;
        switch (selectedPeriod) {
            case 'Daily': newDate.setDate(newDate.getDate() + increment); break;
            case 'Weekly': newDate.setDate(newDate.getDate() + 7 * increment); break;
            case 'Monthly': newDate.setMonth(newDate.getMonth() + increment); break;
            case 'Quarterly': newDate.setMonth(newDate.getMonth() + 3 * increment); break;
            case 'Yearly': newDate.setFullYear(newDate.getFullYear() + increment); break;
        }
        setSelectedDate(newDate);
    };

    const getPeriodLabel = () => {
        switch (selectedPeriod) {
            case 'Daily': return selectedDate.toLocaleDateString();
            case 'Weekly': {
                const start = new Date(selectedDate);
                start.setDate(start.getDate() - start.getDay() + 1);
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
            }
            case 'Monthly': return selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
            case 'Quarterly': return `Q${Math.floor(selectedDate.getMonth() / 3) + 1} ${selectedDate.getFullYear()}`;
            case 'Yearly': return selectedDate.getFullYear();
        }
    }


    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Performance Reports</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Analyze individual performance over various time periods.</p>
            </header>

            <div className="bg-white p-4 rounded-xl shadow-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium">Staff Member</label>
                        <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} className="w-full h-10 px-2 mt-1 border-slate-300 rounded-md">
                            {myTeam.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div className="flex bg-slate-100 p-1 rounded-lg">
                        {(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'] as Period[]).map(p => (
                            <button key={p} onClick={() => setSelectedPeriod(p)} className={`w-full text-center text-sm py-1.5 rounded-md ${selectedPeriod === p ? 'bg-white shadow-sm font-semibold' : 'text-slate-600'}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center justify-center">
                        <button onClick={() => handleDateChange('prev')} className="px-4 h-10 border rounded-l-md">&lt;</button>
                        <div className="h-10 px-4 border-y flex items-center justify-center text-sm font-semibold text-center w-48">{getPeriodLabel()}</div>
                        <button onClick={() => handleDateChange('next')} className="px-4 h-10 border rounded-r-md">&gt;</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-lg flex items-center justify-center">
                    <GaugeChart value={reportData?.weightedScore || 0} label={`Overall ${selectedPeriod} Score`} />
                </div>
                <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-lg">
                    <h3 className="font-semibold text-slate-700">Performance Trend</h3>
                    <div className="h-48 flex items-center justify-center text-slate-400">Trend chart coming soon...</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-lg mt-6">
                <h3 className="font-semibold text-slate-700">Detailed Records ({reportData?.records.length || 0})</h3>
                <div className="max-h-96 overflow-y-auto mt-2">
                    {reportData && reportData.records.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white">
                                <tr className="border-b">
                                    <th className="p-2 text-left font-semibold">Date</th>
                                    <th className="p-2 text-left font-semibold">Status</th>
                                    <th className="p-2 text-left font-semibold">Self Rating</th>
                                    <th className="p-2 text-left font-semibold">CAPA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.records.map(record => (
                                    <tr key={record.id} className="border-b hover:bg-slate-50">
                                        <td className="p-2">{record.date}</td>
                                        <td className="p-2">{record.status}</td>
                                        <td className="p-2">{record.selfRating} / 5</td>
                                        <td className="p-2">{record.capa ? 'Yes' : 'No'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center py-10 text-slate-500">No records found for this period.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PerformanceReportPage;