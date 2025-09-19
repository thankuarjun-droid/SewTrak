import React, { useMemo } from 'react';
import type { Order, Style, KpiSetting, ProductionEntry, EndLineCheck, InLineAudit, AqlInspection, NonConformanceReport, Defect, Operation, Staff, FactorySettings, DailyLinePlan, KanbanEntry } from '../types';
import { KpiDisplay } from './KpiDisplay';
import { PlusIcon } from './IconComponents';

interface OrderReportDetailProps {
  order: Order;
  allData: {
    styles: Style[];
    kpiSettings: KpiSetting[];
    productionEntries: ProductionEntry[];
    endLineChecks: EndLineCheck[];
    inLineAudits: InLineAudit[];
    aqlInspections: AqlInspection[];
    nonConformanceReports: NonConformanceReport[];
    defects: Defect[];
    operations: Operation[];
    staff: Staff[];
    employees: { id: string, name: string, ctc: number }[];
    factorySettings: FactorySettings;
    dailyLinePlans: DailyLinePlan[];
    kanbanEntries: KanbanEntry[];
  };
  onCreateNc: (source: string, sourceId: string, details: string) => void;
}

const ReportSection = ({ title, children, gridCols = 'grid-cols-2 md:grid-cols-4' }: { title: string, children: React.ReactNode, gridCols?: string }) => (
    <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-base font-semibold text-slate-800 mb-3 pb-2 border-b">{title}</h3>
        <dl className={`grid gap-4 ${gridCols}`}>{children}</dl>
    </div>
);

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="text-sm font-semibold text-slate-800">{value}</dd>
    </div>
);

export const OrderReportDetail = ({ order, allData, onCreateNc }: OrderReportDetailProps) => {
  const { styles, kpiSettings, productionEntries, endLineChecks, inLineAudits, aqlInspections, nonConformanceReports, defects, operations, staff, employees, factorySettings, dailyLinePlans, kanbanEntries } = allData;

  const kpis = useMemo(() => {
    const style = styles.find(s => s.id === order.styleId);
    if (!style) return null;

    const orderQty = order.quantities.reduce((sum, q) => sum + q.quantity, 0);
    const orderChecks = (endLineChecks || []).filter(c => c.orderNumber === order.id);
    const shippedChecks = orderChecks.filter(c => c.status === 'Pass' || c.reworkStatus === 'completed');
    const shippedQty = shippedChecks.length;
    
    // Delivery
    const lastShipDate = shippedChecks.length > 0 ? new Date(shippedChecks.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp) : null;
    const onTimeDelivery = lastShipDate ? lastShipDate <= new Date(order.deliveryDate) : false;
    const delayDays = lastShipDate ? Math.ceil((lastShipDate.getTime() - new Date(order.deliveryDate).getTime()) / (1000 * 3600 * 24)) : 0;
    const orderLeadTime = Math.ceil((new Date(order.deliveryDate).getTime() - new Date(order.poDate).getTime()) / (1000 * 3600 * 24));
    const shortageExcess = orderQty > 0 ? ((shippedQty - orderQty) / orderQty) * 100 : 0;
    
    // Financial & Production
    const orderEntries = (productionEntries || []).filter(p => p.orderNumber === order.id);
    const startProdDate = orderEntries.length > 0 ? new Date(orderEntries.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0].timestamp) : null;
    const endProdDate = orderEntries.length > 0 ? new Date(orderEntries.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp) : null;
    const assemblyLeadTime = startProdDate && endProdDate ? Math.ceil((endProdDate.getTime() - startProdDate.getTime()) / (1000 * 3600 * 24)) + 1 : 0;
    
    const uniqueStaffHours = new Map<string, Set<string>>();
    orderEntries.forEach(e => {
        if(!uniqueStaffHours.has(e.employeeId)) uniqueStaffHours.set(e.employeeId, new Set());
        uniqueStaffHours.get(e.employeeId)!.add(`${e.timestamp.split('T')[0]}-${e.hourCounter}`);
    });
    const totalAssemblyCost = Array.from(uniqueStaffHours.entries()).reduce((sum, [empId, hoursSet]) => {
        const emp = employees.find(e => e.id === empId);
        return sum + (emp ? (emp.ctc / factorySettings.workingHoursPerDay) * hoursSet.size : 0);
    }, 0);
    const assemblyCostPerGarment = shippedQty > 0 ? totalAssemblyCost / shippedQty : 0;
    
    const totalSmvProduced = orderEntries.reduce((sum, entry) => {
        const op = style.operationBulletin.find(ob => ob.operationId === entry.operation);
        const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
        return sum + (smv * entry.productionQuantity);
    }, 0);
    const totalMinutesWorked = Array.from(uniqueStaffHours.values()).reduce((sum, hours) => sum + hours.size * 60, 0);
    const avgLineEfficiency = totalMinutesWorked > 0 ? (totalSmvProduced / totalMinutesWorked) * 100 : 0;
    
    const orderPlans = (dailyLinePlans || []).filter(p => p.orderNumber === order.id);
    const plannedQty = orderPlans.reduce((sum, p) => sum + p.plannedQuantity, 0);
    const planAdherence = plannedQty > 0 ? (shippedQty / plannedQty) * 100 : 100;
    
    // Style Changeover Time Calculation
    let styleChangeoverTime: number | null = null;
    if (orderEntries.length > 0 && startProdDate) {
        const firstEntry = orderEntries.find(e => new Date(e.timestamp).getTime() === startProdDate.getTime());
        if(firstEntry) {
            const lineId = firstEntry.lineNumber;
            const currentOrderStartTime = startProdDate.getTime();

            const previousEntriesOnLine = (productionEntries || [])
                .filter(p => p.lineNumber === lineId && p.orderNumber !== order.id && new Date(p.timestamp).getTime() < currentOrderStartTime)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            if (previousEntriesOnLine.length > 0) {
                const previousOrderEndTime = new Date(previousEntriesOnLine[0].timestamp).getTime();
                styleChangeoverTime = (currentOrderStartTime - previousOrderEndTime) / (1000 * 60); // in minutes
            }
        }
    }

    // Quality
    const totalChecked = orderChecks.length;
    const reworkCount = orderChecks.filter(c => c.status === 'Rework').length;
    const rejectCount = orderChecks.filter(c => c.status === 'Reject').length;
    const rft = totalChecked > 0 ? ((totalChecked - reworkCount - rejectCount) / totalChecked) * 100 : 100;

    const topDefects = Array.from(orderChecks.reduce((acc, check) => {
        if(check.defectId) acc.set(check.defectId, (acc.get(check.defectId) || 0) + 1);
        return acc;
    }, new Map<string, number>()).entries()).sort((a,b) => b[1] - a[1]).slice(0,3);
    
    const topDefectOps = Array.from(orderChecks.reduce((acc, check) => {
        if(check.responsibleOpId) acc.set(check.responsibleOpId, (acc.get(check.responsibleOpId) || 0) + 1);
        return acc;
    }, new Map<string, number>()).entries()).sort((a,b) => b[1] - a[1]).slice(0,3);
    
    const orderAqls = (aqlInspections || []).filter(a => (kanbanEntries || []).find(k => k.id === a.kanbanCardId)?.orderNumber === order.id);
    const aqlPassCount = orderAqls.filter(a => a.result === 'Pass').length;
    const aqlPassPercent = orderAqls.length > 0 ? (aqlPassCount / orderAqls.length) * 100 : 100;

    return {
        orderQty, shippedQty, onTimeDelivery: onTimeDelivery ? 1 : 0, delayDays, orderLeadTime, shortageExcess,
        totalAssemblyCost, assemblyCostPerGarment, startProdDate, endProdDate, assemblyLeadTime, avgLineEfficiency, planAdherence, styleChangeoverTime,
        rft, rework: totalChecked > 0 ? (reworkCount / totalChecked) * 100 : 0, rejection: totalChecked > 0 ? (rejectCount / totalChecked) * 100 : 0, aqlPassPercent,
        topDefects, topDefectOps,
        openNcs: (nonConformanceReports || []).filter(nc => (nc.sourceId.includes(order.id) || orderChecks.some(c => c.id === nc.sourceId)) && nc.status === 'Open'),
        rejectCount
    };
  }, [order, styles, kpiSettings, productionEntries, endLineChecks, inLineAudits, aqlInspections, nonConformanceReports, defects, operations, staff, employees, factorySettings, dailyLinePlans, kanbanEntries]);

  const findKpi = (kpiName: string) => kpiSettings.find(k => k.kpi === kpiName);
  
  const defectsMap = useMemo(() => new Map(defects.map(d => [d.id, d.name])), [defects]);
  const operationsMap = useMemo(() => new Map(operations.map(o => [o.id, o.name])), [operations]);

  if (!kpis) return <div className="p-4 text-center">Could not find style information for this order.</div>;
  const deliveryStatus = kpis.shippedQty >= kpis.orderQty ? 'Shipped' : kpis.shippedQty > 0 ? 'Partially Shipped' : 'Not Shipped';

  return (
    <div className="space-y-4 p-4 bg-slate-100/50 rounded-lg">
        {/* Order Info */}
        <div className="bg-white p-4 rounded-xl shadow-md">
            <dl className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <InfoItem label="Customer" value={order.customer} />
                <InfoItem label="Order Quantity" value={kpis.orderQty.toLocaleString()} />
                <InfoItem label="PO Date" value={new Date(order.poDate).toLocaleDateString()} />
                <InfoItem label="Delivery Date" value={new Date(order.deliveryDate).toLocaleDateString()} />
                <InfoItem label="Delivery Status" value={deliveryStatus} />
                <InfoItem label="Quantity Shipped" value={kpis.shippedQty.toLocaleString()} />
            </dl>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReportSection title="Delivery Performance">
                <KpiDisplay kpi={findKpi('On time Delivery')} value={kpis.onTimeDelivery} label="On Time?" format="boolean" />
                <KpiDisplay kpi={findKpi('Delay/Advance Days')} value={kpis.delayDays} label="Delay/Advance" unit="days" />
                <KpiDisplay kpi={findKpi('Order Lead Time')} value={kpis.orderLeadTime} label="Lead Time" unit="days" />
                <KpiDisplay kpi={findKpi('Shortage/Excess %')} value={kpis.shortageExcess} label="Shortage/Excess" format="percent" />
            </ReportSection>

             <ReportSection title="Financials">
                <KpiDisplay kpi={findKpi('Total Assembly Cost')} value={kpis.totalAssemblyCost} label="Total Assembly Cost" format="currency" />
                <KpiDisplay kpi={findKpi('Assembly Cost/Garment')} value={kpis.assemblyCostPerGarment} label="Cost / Garment" format="currency" />
            </ReportSection>
        </div>

        <ReportSection title="Production Performance" gridCols="grid-cols-2 md:grid-cols-3">
            <InfoItem label="Assembly Start" value={kpis.startProdDate ? kpis.startProdDate.toLocaleDateString() : 'N/A'} />
            <InfoItem label="Assembly End" value={kpis.endProdDate ? kpis.endProdDate.toLocaleDateString() : 'N/A'} />
            <InfoItem label="Assembly Lead Time" value={`${kpis.assemblyLeadTime} days`} />
            <KpiDisplay kpi={findKpi('Average Line Efficiency')} value={kpis.avgLineEfficiency} label="Avg. Line Efficiency" format="percent" />
            <KpiDisplay kpi={findKpi('Plan Vs Adherence%')} value={kpis.planAdherence} label="Plan Adherence" format="percent" />
            <KpiDisplay kpi={findKpi('Style Changeover Time')} value={kpis.styleChangeoverTime} label="Style Changeover Time" unit="mins" />
        </ReportSection>
        
        <ReportSection title="Quality Performance" gridCols="grid-cols-2 md:grid-cols-4">
            <KpiDisplay kpi={findKpi('RFT%')} value={kpis.rft} label="RFT %" format="percent" />
            <KpiDisplay kpi={findKpi('Rework%')} value={kpis.rework} label="Rework %" format="percent" />
            <KpiDisplay kpi={findKpi('Rejection%')} value={kpis.rejection} label="Rejection %" format="percent" />
            <KpiDisplay kpi={findKpi('AQL Pass%')} value={kpis.aqlPassPercent} label="AQL Pass %" format="percent" />
        </ReportSection>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-md space-y-2">
                 <h3 className="text-sm font-semibold text-slate-800">Top 3 Rework Defects</h3>
                 {kpis.topDefects.map(([id, count]) => <p key={id} className="text-xs">{defectsMap.get(id)}: {count} times</p>)}
            </div>
             <div className="bg-white p-4 rounded-xl shadow-md space-y-2">
                 <h3 className="text-sm font-semibold text-slate-800">Top 3 Rework Operations</h3>
                 {kpis.topDefectOps.map(([id, count]) => <p key={id} className="text-xs">{operationsMap.get(id)}: {count} times</p>)}
            </div>
        </div>

         <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-2">
                 <h3 className="text-base font-semibold text-slate-800">Open Non-Conformances ({kpis.openNcs.length})</h3>
                 <button onClick={() => onCreateNc('Order Review', order.id, `NC related to order ${order.id}.`)} className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full"><PlusIcon className="w-3 h-3"/>New NC</button>
            </div>
            {kpis.openNcs.length > 0 && <ul className="text-xs space-y-1">{kpis.openNcs.map(nc => <li key={nc.id}>{nc.ncNumber}: {nc.details} (Due: {nc.dueDate})</li>)}</ul>}
        </div>

        <ReportSection title="Quantity Tracking" gridCols="grid-cols-4">
            <InfoItem label="Order Quantity (Feed)" value={kpis.orderQty.toLocaleString()} />
            <InfoItem label="Shipped (Passed + Repaired)" value={kpis.shippedQty.toLocaleString()} />
            <InfoItem label="Rejected" value={kpis.rejectCount.toLocaleString()} />
            <InfoItem label="Good Garments (WIP)" value={(kpis.orderQty - kpis.shippedQty - kpis.rejectCount).toLocaleString()} />
        </ReportSection>
    </div>
  );
};