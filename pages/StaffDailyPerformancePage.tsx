import React, { useState, useMemo } from 'react';
import type { Staff, StaffPerformanceRecord, StaffKpi, ProductionEntry, InLineAudit, EndLineCheck, Line, Style, TimeStudy, Order, DailyLinePlan, NonConformanceReport, Employee } from '../types';
import { StaffPerformanceRecordModal } from '../components/StaffPerformanceRecordModal';

interface AllData {
    currentUser: Staff;
    lines: Line[];
    staff: Staff[];
    employees: Employee[];
    staffPerformanceRecords: StaffPerformanceRecord[];
    staffKpis: StaffKpi[];
    productionEntries: ProductionEntry[];
    inLineAudits: InLineAudit[];
    endLineChecks: EndLineCheck[];
    styles: Style[];
    timeStudies: TimeStudy[];
    orders: Order[];
    dailyLinePlans: DailyLinePlan[];
    nonConformanceReports: NonConformanceReport[];
}

interface StaffDailyPerformancePageProps {
  allData: AllData;
  onSaveRecord: (record: StaffPerformanceRecord) => void;
}

const getStatusChip = (status: StaffPerformanceRecord['status']) => {
    switch(status) {
        case 'Approved': case 'Closed': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
        case 'Pending Manager Approval': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
        case 'Pending Supervisor Approval': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
        case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
        case 'Pending Self-Rating': default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    }
};

const StaffDailyPerformancePage = ({ allData, onSaveRecord }: StaffDailyPerformancePageProps) => {
    const { currentUser, staffPerformanceRecords } = allData;
    const [modalData, setModalData] = useState<StaffPerformanceRecord | null>(null);

    const myRecords = useMemo(() => {
        return (staffPerformanceRecords || [])
            .filter(r => r.staffId === currentUser.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [staffPerformanceRecords, currentUser]);

    const calculateAutoMetrics = (staffMember: Staff, date: string, allData: AllData): Record<string, number> => {
        const { staffKpis, productionEntries, inLineAudits, endLineChecks, styles, timeStudies, orders, dailyLinePlans, nonConformanceReports, employees } = allData;
        const metrics: Record<string, number> = {};
        const autoKpis = (staffKpis || []).filter(k => k.role === staffMember.role && k.source === 'Automatic');
        const stylesMap = new Map((styles || []).map(s => [s.id, s]));

        autoKpis.forEach(kpi => {
            let value = 0;
            const isManagerOrAdmin = staffMember.role === 'Production Manager' || staffMember.role === 'Admin';
            const supervisedLines = isManagerOrAdmin ? new Set(allData.lines.map(l => l.id)) : new Set(staffMember.lineAssignments);

            // --- COMMON LOGIC ---
            const relevantEntries = (productionEntries || []).filter(p => supervisedLines.has(p.lineNumber) && p.timestamp.startsWith(date));
            const relevantChecks = (endLineChecks || []).filter(c => supervisedLines.has(c.lineNumber) && c.timestamp.startsWith(date));
            
            // --- KPI CALCULATIONS ---
            switch (kpi.kpi) {
                case "Team's Daily Efficiency":
                case "Overall Line Efficiency (OWE)":
                case "Total Factory OWE (Today)": {
                    if(relevantEntries.length > 0) {
                        const totalSmvProduced = relevantEntries.reduce((sum, entry) => {
                            const style = stylesMap.get(entry.styleNumber);
                            const op = style?.operationBulletin?.find(ob => ob.operationId === entry.operation);
                            const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
                            return sum + (smv * entry.productionQuantity);
                        }, 0);
                        const uniqueHoursWorked = new Set(relevantEntries.map(p => `${p.employeeId}-${p.hourCounter}`)).size;
                        value = uniqueHoursWorked > 0 ? (totalSmvProduced / (uniqueHoursWorked * 60)) * 100 : 0;
                    }
                    break;
                }
                case "Team's RFT":
                case "Factory RFT%": {
                    const totalChecked = relevantChecks.length;
                    if(totalChecked > 0) {
                        const defects = relevantChecks.filter(c => c.status === 'Rework' || c.status === 'Reject').length;
                        value = ((totalChecked - defects) / totalChecked) * 100;
                    } else { value = 100; }
                    break;
                }
                case "Downtime Management":
                    value = relevantEntries.reduce((sum, p) => sum + p.downTime, 0);
                    break;
                case "Audits Completed":
                    value = (inLineAudits || []).filter(a => a.auditorId === staffMember.id && a.timestamp.startsWith(date)).length;
                    break;
                case "Time Studies Conducted":
                    value = (timeStudies || []).filter(ts => new Date(ts.timestamp).toISOString().split('T')[0] === date).length;
                    break;
                case "Plan vs. Adherence %": {
                    const relevantPlans = (dailyLinePlans || []).filter(p => supervisedLines.has(p.lineNumber) && p.date === date);
                    const totalPlanned = relevantPlans.reduce((sum, p) => sum + p.plannedQuantity, 0);
                    const totalActual = relevantChecks.filter(c => c.status === 'Pass' || c.reworkStatus === 'completed').length;
                    value = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 100;
                    break;
                }
                case "On-Time Delivery %": {
                     // For simplicity, this reflects all orders completed this month, not just today.
                     const [year, month] = date.split('-').map(Number);
                     const startOfMonth = new Date(year, month - 1, 1);
                     const endOfMonth = new Date(year, month, 0, 23, 59, 59);

                     const completedOrdersThisMonth: Order[] = [];
                     const orderShippedQty = new Map<string, number>();
                     (endLineChecks || []).forEach(c => {
                        const checkDate = new Date(c.timestamp);
                        if (checkDate >= startOfMonth && checkDate <= endOfMonth && (c.status === 'Pass' || c.reworkStatus === 'completed')) {
                            orderShippedQty.set(c.orderNumber, (orderShippedQty.get(c.orderNumber) || 0) + 1);
                        }
                     });
                     
                     (orders || []).forEach(order => {
                        const totalOrderQty = order.quantities.reduce((sum, q) => sum + q.quantity, 0);
                        const shipped = orderShippedQty.get(order.id) || 0;
                        if (shipped >= totalOrderQty) {
                            completedOrdersThisMonth.push(order);
                        }
                     });
                     
                     if (completedOrdersThisMonth.length > 0) {
                         const onTimeCount = completedOrdersThisMonth.filter(o => {
                             const lastCheck = (endLineChecks || []).filter(c => c.orderNumber === o.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                             return lastCheck && new Date(lastCheck.timestamp) <= new Date(o.deliveryDate + 'T23:59:59');
                         }).length;
                         value = (onTimeCount / completedOrdersThisMonth.length) * 100;
                     } else { value = 100; }
                    break;
                }
                case "Assembly Cost / Garment": {
                    const uniqueEmps = new Set(relevantEntries.map(e => e.employeeId));
                    const totalCost = Array.from(uniqueEmps).reduce((sum, empId) => {
                        const emp = (employees || []).find(e => e.id === empId);
                        const hours = new Set(relevantEntries.filter(e=>e.employeeId === empId).map(e => e.hourCounter)).size;
                        return sum + (emp ? (emp.ctc / 8) * hours : 0);
                    }, 0);
                    const totalOutput = relevantChecks.filter(c => c.status === 'Pass' || c.reworkStatus === 'completed').length;
                    value = totalOutput > 0 ? totalCost / totalOutput : 0;
                    break;
                }
                case "Total Factory Output (Today)": {
                    value = relevantChecks.filter(c => c.status === 'Pass' || c.reworkStatus === 'completed').length;
                    break;
                }
                case "Overall On-Time Delivery % (All Orders)": { // Re-using logic, could be optimized
                     const [year, month] = date.split('-').map(Number);
                     const startOfMonth = new Date(year, month - 1, 1);
                     const endOfMonth = new Date(year, month, 0, 23, 59, 59);

                     const completedOrdersThisMonth: Order[] = [];
                     const orderShippedQty = new Map<string, number>();
                     (endLineChecks || []).forEach(c => {
                        const checkDate = new Date(c.timestamp);
                        if (checkDate >= startOfMonth && checkDate <= endOfMonth && (c.status === 'Pass' || c.reworkStatus === 'completed')) {
                            orderShippedQty.set(c.orderNumber, (orderShippedQty.get(c.orderNumber) || 0) + 1);
                        }
                     });
                     
                     (orders || []).forEach(order => {
                        const totalOrderQty = order.quantities.reduce((sum, q) => sum + q.quantity, 0);
                        const shipped = orderShippedQty.get(order.id) || 0;
                        if (shipped >= totalOrderQty) {
                            completedOrdersThisMonth.push(order);
                        }
                     });
                     
                     if (completedOrdersThisMonth.length > 0) {
                         const onTimeCount = completedOrdersThisMonth.filter(o => {
                             const lastCheck = (endLineChecks || []).filter(c => c.orderNumber === o.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                             return lastCheck && new Date(lastCheck.timestamp) <= new Date(o.deliveryDate + 'T23:59:59');
                         }).length;
                         value = (onTimeCount / completedOrdersThisMonth.length) * 100;
                     } else { value = 100; }
                    break;
                }
                case "Total Open NCs":
                    value = (nonConformanceReports || []).filter(nc => nc.status === 'Open').length;
                    break;
                case "Capacity Utilization % (Next 30d)": {
                    const today = new Date();
                    const futureDate = new Date();
                    futureDate.setDate(today.getDate() + 30);
                    const futurePlans = (dailyLinePlans || []).filter(p => new Date(p.date) > today && new Date(p.date) <= futureDate);
                    const bookedMinutes = futurePlans.reduce((sum, p) => {
                        const order = (orders || []).find(o => o.id === p.orderNumber);
                        const style = order ? stylesMap.get(order.styleId) : null;
                        const sam = (style && style.operationBulletin) ? style.operationBulletin.reduce((s, op) => s + op.pickupTime + op.sewingTime + op.trimAndDisposalTime, 0) / 60 : 0;
                        return sum + (p.plannedQuantity * sam);
                    }, 0);
                    const totalManpower = (employees || []).filter(e=>e.designation.toLowerCase().includes('operator')).length;
                    const availableMinutes = totalManpower * 22 * 8 * 60; // Approx 22 working days in 30 days
                    value = availableMinutes > 0 ? (bookedMinutes / availableMinutes) * 100 : 0;
                    break;
                }
            }
            metrics[kpi.id] = parseFloat(value.toFixed(2));
        });
        return metrics;
    };

    const handleOpenTodaysReview = () => {
        const today = new Date().toISOString().split('T')[0];
        let todayRecord = (staffPerformanceRecords || []).find(r => r.staffId === currentUser.id && r.date === today);

        if (!todayRecord) {
            todayRecord = {
                id: `${currentUser.id}-${today}`,
                staffId: currentUser.id,
                date: today,
                autoMetrics: {},
                manualTasks: [],
                selfRating: 0,
                selfComments: '',
                status: 'Pending Self-Rating',
                lastUpdated: new Date().toISOString()
            };
        }
        
        if(todayRecord.status === 'Pending Self-Rating' || todayRecord.status === 'Rejected') {
            const autoMetrics = calculateAutoMetrics(currentUser, today, allData);
            todayRecord = { ...todayRecord, autoMetrics };
        }
        
        setModalData(todayRecord);
    };

    const handleSaveAndClose = (record: StaffPerformanceRecord) => {
        onSaveRecord(record);
        setModalData(null);
    };

    const todayRecordStatus = myRecords.find(r => r.date === new Date().toISOString().split('T')[0])?.status;
    const isTodaySubmitted = todayRecordStatus && todayRecordStatus !== 'Pending Self-Rating' && todayRecordStatus !== 'Rejected';

    return (
        <>
            <div className="p-4 sm:p-6 md:p-8">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">My Daily Performance</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">Submit your daily self-review and track your performance history.</p>
                    </div>
                    <button onClick={handleOpenTodaysReview} disabled={isTodaySubmitted} className="mt-4 sm:mt-0 px-6 py-2 bg-[#2c4e8a] text-white font-semibold rounded-md hover:bg-[#213a69] disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                        {isTodaySubmitted ? 'Submitted for Today' : "Submit Today's Review"}
                    </button>
                </header>

                <main className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-lg">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">My Review History</h2>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white dark:bg-slate-900"><tr className="border-b dark:border-slate-700">
                            <th className="p-2 text-left font-semibold text-slate-600 dark:text-slate-300">Date</th>
                            <th className="p-2 text-left font-semibold text-slate-600 dark:text-slate-300">Status</th>
                            <th className="p-2 text-right font-semibold text-slate-600 dark:text-slate-300">Action</th>
                        </tr></thead>
                        <tbody>
                            {myRecords.map(record => (
                                <tr key={record.id} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="p-2 font-medium">{record.date}</td>
                                <td className="p-2">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(record.status)}`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="p-2 text-right">
                                    <button onClick={() => setModalData(record)} className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-semibold rounded-full">
                                        View Details
                                    </button>
                                </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                </main>
            </div>
            {modalData && (
                <StaffPerformanceRecordModal
                    isOpen={!!modalData}
                    onClose={() => setModalData(null)}
                    onSave={handleSaveAndClose}
                    record={modalData}
                    allData={allData as any}
                />
            )}
        </>
    );
};

export default StaffDailyPerformancePage;