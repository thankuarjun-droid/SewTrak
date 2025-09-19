import React, { useMemo } from 'react';
import type { Order, Style, DailyLinePlan, Line, FactorySettings, Employee, LineAllocation, ProductionEntry, EndLineCheck, OutputSettings, KpiSetting } from '../types';
import { KpiDisplay } from '../components/KpiDisplay';

interface PlanningDashboardPageProps {
    orders: Order[];
    styles: Style[];
    dailyLinePlans: DailyLinePlan[];
    lines: Line[];
    factorySettings: FactorySettings;
    employees: Employee[];
    lineAllocations: LineAllocation[];
    productionEntries: ProductionEntry[];
    endLineChecks: EndLineCheck[];
    outputSettings: OutputSettings;
    kpiSettings: KpiSetting[];
}

const PlanningDashboardPage = ({ orders, styles, dailyLinePlans, lines, factorySettings, employees, lineAllocations, productionEntries, endLineChecks, outputSettings, kpiSettings }: PlanningDashboardPageProps) => {
    
    const stylesMap = useMemo(() => new Map(styles.map(s => [s.id, s])), [styles]);
    const adherenceKpi = useMemo(() => kpiSettings.find(k => k.kpi === 'Plan Vs Adherence%'), [kpiSettings]);
    const capacityKpi = useMemo(() => kpiSettings.find(k => k.kpi === 'Capacity Utilisation%'), [kpiSettings]);

    const getStyleSam = (styleId: string): number => {
        const style = stylesMap.get(styleId);
        if (!style || !style.operationBulletin) return 0;
        return style.operationBulletin.reduce((sum, op) => sum + op.pickupTime + op.sewingTime + op.trimAndDisposalTime, 0) / 60;
    };
    
    const planningData = useMemo(() => {
        // --- 1. Overall Order & Plan Analysis ---
        const totalOrders = orders.length;
        const totalOrderQty = orders.reduce((sum, o) => sum + o.quantities.reduce((qSum, q) => qSum + q.quantity, 0), 0);
        const totalOrderMinutes = orders.reduce((sum, o) => {
            const sam = getStyleSam(o.styleId);
            return sum + o.quantities.reduce((qSum, q) => qSum + (q.quantity * sam), 0);
        }, 0);
        
        const plannedOrderIds = new Set((dailyLinePlans || []).map(p => p.orderNumber));
        const plannedOrders = plannedOrderIds.size;
        const unplannedOrders = totalOrders - plannedOrders;
        
        const plannedQty = (dailyLinePlans || []).reduce((sum, p) => sum + p.plannedQuantity, 0);
        const plannedMinutes = (dailyLinePlans || []).reduce((sum, p) => {
            const order = orders.find(o => o.id === p.orderNumber);
            const sam = order ? getStyleSam(order.styleId) : 0;
            return sum + (p.plannedQuantity * sam);
        }, 0);
        
        // --- 2. Capacity Analysis ---
        const workingDaysNext90 = Array.from({ length: 90 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i + 1);
            return date.getDay() !== 0; // Exclude Sundays
        }).filter(Boolean).length;
        
        const totalManpower = new Set(lineAllocations.flatMap(a => a.assignments.flatMap(as => as.employeeIds))).size;
        const availableMinutesNext90 = totalManpower * workingDaysNext90 * factorySettings.workingHoursPerDay * 60;
        
        const futurePlans = (dailyLinePlans || []).filter(p => new Date(p.date) > new Date());
        const bookedMinutesNext90 = futurePlans.reduce((sum, p) => {
            const order = orders.find(o => o.id === p.orderNumber);
            const sam = order ? getStyleSam(order.styleId) : 0;
            return sum + (p.plannedQuantity * sam);
        }, 0);
        
        const vacantMinutesNext90 = availableMinutesNext90 - bookedMinutesNext90;
        const capacityUtilization = availableMinutesNext90 > 0 ? (bookedMinutesNext90 / availableMinutesNext90) * 100 : 0;
        const avgSam = totalOrderQty > 0 ? totalOrderMinutes / totalOrderQty : 0;
        const gapInPcs = avgSam > 0 ? vacantMinutesNext90 / avgSam : 0;

        // --- 3. Past Performance Analysis ---
        const pastPlans = (dailyLinePlans || []).filter(p => new Date(p.date) < new Date());
        const performance = pastPlans.map(plan => {
            let actualQty = 0;
            if(outputSettings.source === 'endOfLine') {
                actualQty = (endLineChecks || []).filter(c => c.lineNumber === plan.lineNumber && c.timestamp.startsWith(plan.date) && (c.status === 'Pass' || c.reworkStatus === 'completed')).length;
            } else {
                const style = stylesMap.get(orders.find(o => o.id === plan.orderNumber)?.styleId || '');
                if(style && style.operationBulletin.length > 0) {
                    const lastOpId = style.operationBulletin.reduce((a,b) => a.sNo > b.sNo ? a : b).operationId;
                    actualQty = (productionEntries || [])
                        .filter(p => p.lineNumber === plan.lineNumber && p.timestamp.startsWith(plan.date) && p.operation === lastOpId)
                        .reduce((sum, p) => sum + p.productionQuantity, 0);
                }
            }
            return { ...plan, actualQty, adherence: plan.plannedQuantity > 0 ? (actualQty / plan.plannedQuantity) * 100 : 0 };
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
        
        const overallAdherence = performance.length > 0 ? performance.reduce((sum, p) => sum + p.adherence, 0) / performance.length : 0;

        // --- 4. Customer Breakdown ---
        const customerData = orders.reduce((acc, order) => {
            if (!acc[order.customer]) acc[order.customer] = { orders: 0, totalQty: 0, totalMinutes: 0 };
            acc[order.customer].orders++;
            const sam = getStyleSam(order.styleId);
            const qty = order.quantities.reduce((sum, q) => sum + q.quantity, 0);
            acc[order.customer].totalQty += qty;
            acc[order.customer].totalMinutes += qty * sam;
            return acc;
        }, {} as Record<string, { orders: number, totalQty: number, totalMinutes: number }>);
        
        return {
            kpis: {
                totalOrders, plannedOrders, unplannedOrders,
                totalMinutes: totalOrderMinutes, plannedMinutes, unplannedMinutes: totalOrderMinutes - plannedMinutes,
                capacityUtilization,
                avgOrderSize: totalOrders > 0 ? totalOrderQty / totalOrders : 0
            },
            summary: {
                orders: { planned: plannedOrders, unplanned: unplannedOrders },
                quantity: { planned: plannedQty, unplanned: totalOrderQty - plannedQty },
                minutes: { planned: plannedMinutes, unplanned: totalOrderMinutes - plannedMinutes }
            },
            customerData,
            performance,
            overallAdherence,
            capacity: { bookedMinutes: bookedMinutesNext90, vacantMinutes: vacantMinutesNext90, gapInPcs }
        };
    }, [orders, styles, dailyLinePlans, lines, factorySettings, employees, lineAllocations, productionEntries, endLineChecks, outputSettings, getStyleSam, stylesMap, kpiSettings]);

    if (!planningData) return <div>Loading...</div>;

    const getAdherenceColor = (adherence: number) => {
        const targetStart = adherenceKpi?.targetStart || 90;
        const targetStretch = adherenceKpi?.targetStretch || 98;
        if (adherence >= targetStretch) return 'text-green-600';
        if (adherence >= targetStart) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6">
            <header>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Planning Dashboard</h1>
                <p className="text-slate-600 mt-2">Analyze planning efficiency, capacity utilization, and future needs.</p>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-100 p-4 rounded-lg"><div className="text-xs font-semibold text-slate-500 uppercase">Total / Planned Orders</div><div className="text-3xl font-bold text-slate-800">{`${planningData.kpis.totalOrders} / ${planningData.kpis.plannedOrders}`}</div></div>
                <div className="bg-slate-100 p-4 rounded-lg"><div className="text-xs font-semibold text-slate-500 uppercase">Planned Minutes</div><div className="text-3xl font-bold text-slate-800">{Math.round(planningData.kpis.plannedMinutes / 1000).toLocaleString() + 'k'}</div><div className="text-sm text-slate-600">{`${Math.round(planningData.kpis.totalMinutes / 1000)}k total`}</div></div>
                <KpiDisplay kpi={capacityKpi} value={planningData.kpis.capacityUtilization} label="Capacity Utilization" format="percent" />
                <div className="bg-slate-100 p-4 rounded-lg"><div className="text-xs font-semibold text-slate-500 uppercase">Avg Order Size</div><div className="text-3xl font-bold text-slate-800">{Math.round(planningData.kpis.avgOrderSize).toLocaleString()}</div><div className="text-sm text-slate-600">units</div></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Planned vs Unplanned */}
                <div className="bg-white p-4 rounded-xl shadow-md">
                    <h3 className="font-semibold text-slate-800 mb-2">Planned vs Unplanned Summary</h3>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b text-slate-500 text-xs">
                            <th className="p-2 text-left">Metric</th>
                            <th className="p-2 text-right">Planned</th>
                            <th className="p-2 text-right">Unplanned</th>
                            <th className="p-2 text-right">Total</th>
                            <th className="p-2 text-right">% Planned</th>
                        </tr></thead>
                        <tbody>
                            {(['orders', 'quantity', 'minutes'] as const).map(metric => {
                                const data = planningData.summary[metric];
                                const total = data.planned + data.unplanned;
                                return (
                                    <tr key={metric} className="border-b">
                                        <td className="p-2 capitalize font-medium">{metric}</td>
                                        <td className="p-2 text-right font-mono">{Math.round(data.planned).toLocaleString()}</td>
                                        <td className="p-2 text-right font-mono">{Math.round(data.unplanned).toLocaleString()}</td>
                                        <td className="p-2 text-right font-mono font-bold">{Math.round(total).toLocaleString()}</td>
                                        <td className="p-2 text-right font-mono font-semibold">{total > 0 ? ((data.planned / total) * 100).toFixed(1) : 0}%</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Orders by Customer */}
                <div className="bg-white p-4 rounded-xl shadow-md">
                    <h3 className="font-semibold text-slate-800 mb-2">Orders by Customer</h3>
                    <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                        <thead><tr className="border-b text-slate-500 text-xs">
                                <th className="p-2 text-left">Customer</th>
                                <th className="p-2 text-right">Orders</th>
                                <th className="p-2 text-right">Qty</th>
                                <th className="p-2 text-right">Minutes</th>
                                <th className="p-2 text-right">Avg SAM</th>
                            </tr></thead>
                            <tbody>
                                {Object.entries(planningData.customerData).map(([customer, data]) => (
                                    <tr key={customer} className="border-b">
                                        <td className="p-2 font-medium">{customer}</td>
                                        <td className="p-2 text-right font-mono">{data.orders}</td>
                                        <td className="p-2 text-right font-mono">{data.totalQty.toLocaleString()}</td>
                                        <td className="p-2 text-right font-mono">{Math.round(data.totalMinutes).toLocaleString()}</td>
                                        <td className="p-2 text-right font-mono">{(data.totalQty > 0 ? data.totalMinutes / data.totalQty : 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Future Capacity */}
            <div className="bg-white p-4 rounded-xl shadow-md">
                 <h3 className="font-semibold text-slate-800 mb-2">Future Capacity (Next 90 Days)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-100 p-4 rounded-lg"><div className="text-xs font-semibold text-blue-500 uppercase">Booked Minutes</div><div className="text-3xl font-bold text-blue-800">{`${Math.round(planningData.capacity.bookedMinutes / 1000)}k`}</div></div>
                    <div className="bg-green-100 p-4 rounded-lg"><div className="text-xs font-semibold text-green-500 uppercase">Vacant Minutes</div><div className="text-3xl font-bold text-green-800">{`${Math.round(planningData.capacity.vacantMinutes / 1000)}k`}</div></div>
                    <div className="bg-amber-100 p-4 rounded-lg"><div className="text-xs font-semibold text-amber-500 uppercase">Gap to Fill (Est.)</div><div className="text-3xl font-bold text-amber-800">{`${Math.round(planningData.capacity.gapInPcs / 1000)}k`}</div><div className="text-sm text-amber-600">pcs</div></div>
                 </div>
            </div>

            {/* Planning Performance */}
            <div className="bg-white p-4 rounded-xl shadow-md">
                 <h3 className="font-semibold text-slate-800 mb-2">Planning Performance (Last 30 days) - Adherence: <span className="text-blue-600 font-bold">{planningData.overallAdherence.toFixed(1)}%</span></h3>
                 <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                         <thead><tr className="border-b text-slate-500 text-xs">
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-left">Line</th>
                            <th className="p-2 text-left">Order</th>
                            <th className="p-2 text-right">Planned Qty</th>
                            <th className="p-2 text-right">Actual Qty</th>
                            <th className="p-2 text-right">Adherence</th>
                        </tr></thead>
                        <tbody>
                            {planningData.performance.map(p => (
                                <tr key={p.id} className="border-b">
                                    <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                                    <td className="p-2">{lines.find(l => l.id === p.lineNumber)?.name}</td>
                                    <td className="p-2">{p.orderNumber}</td>
                                    <td className="p-2 text-right font-mono">{p.plannedQuantity.toLocaleString()}</td>
                                    <td className="p-2 text-right font-mono font-bold">{p.actualQty.toLocaleString()}</td>
                                    <td className={`p-2 text-right font-mono font-semibold ${getAdherenceColor(p.adherence)}`}>
                                        {p.adherence.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default PlanningDashboardPage;