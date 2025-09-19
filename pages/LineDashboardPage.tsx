import React, { useState, useMemo, useEffect } from 'react';
import type { ProductionEntry, Order, Style, Line, KanbanEntry, LineAllocation, OutputSettings, EndLineCheck, Operation, Employee, FactorySettings, KpiSetting, InLineAudit, Defect, Staff, DailyLinePlan } from '../types';
import VerticalBarChart from '../components/VerticalBarChart';
import LineTrendChart from '../components/LineTrendChart';
import DonutChart from '../components/DonutChart';
import { PlayIcon, PauseIcon, ArrowLeftIcon, ArrowRightIcon } from '../components/IconComponents';

interface LineDashboardPageProps {
  productionEntries: ProductionEntry[];
  kanbanEntries: KanbanEntry[];
  orders: Order[];
  styles: Style[];
  lines: Line[];
  operations: Operation[];
  employees: Employee[];
  lineAllocations: LineAllocation[];
  outputSettings: OutputSettings;
  endLineChecks: EndLineCheck[];
  factorySettings: FactorySettings;
  kpiSettings: KpiSetting[];
  inLineAudits: InLineAudit[];
  defects: Defect[];
  staff: Staff[];
  dailyLinePlans: DailyLinePlan[];
}

const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const adjustedToday = new Date(today.getTime() - (offset * 60 * 1000));
    return adjustedToday.toISOString().split('T')[0];
}

const KpiCard = ({ title, value, subValue, colorClass = 'text-white' }: { title: string; value: string | number; subValue?: string; colorClass?: string }) => (
    <div className="bg-slate-800 p-4 rounded-lg text-center shadow-lg h-full flex flex-col justify-center">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</h3>
        <p className={`mt-1 text-5xl font-extrabold ${colorClass}`}>{value}</p>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
    </div>
);

const QualityKpiCard = ({ title, value, rate, bgColor, textColor }: { title: string, value: string | number, rate?: string, bgColor: string, textColor: string }) => (
    <div className={`${bgColor} p-4 rounded-lg text-center shadow-lg`}>
        <h3 className={`text-sm font-medium uppercase tracking-wider opacity-90 ${textColor}`}>{title}</h3>
        <p className={`text-5xl font-extrabold mt-1 ${textColor}`}>{value}</p>
        {rate && <p className={`text-base font-bold ${textColor}`}>{rate}</p>}
    </div>
);


const LineDashboardPage = (props: LineDashboardPageProps) => {
    const { lines = [], productionEntries = [], kanbanEntries = [], orders = [], styles = [], operations = [], lineAllocations = [], outputSettings, endLineChecks = [], factorySettings, dailyLinePlans = [], inLineAudits = [], defects = [] } = props;
    const [activeLineIndex, setActiveLineIndex] = useState(0);
    const [selectedDate, setSelectedDate] = useState(getTodayString());
    const [currentView, setCurrentView] = useState<'production' | 'quality'>('production');
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        if (!isPlaying || lines.length === 0) {
            return;
        }
        const timer = setInterval(() => {
            setCurrentView(prevView => {
                if (prevView === 'production') {
                    return 'quality';
                } else {
                    setActiveLineIndex(prevIndex => (prevIndex + 1) % lines.length);
                    return 'production';
                }
            });
        }, 6000);
        return () => clearInterval(timer);
    }, [lines.length, isPlaying]);

    const activeLine = lines[activeLineIndex];
    const filterLine = activeLine?.id || '';
    
    const handleNextLine = () => {
        setIsPlaying(false);
        setActiveLineIndex(prevIndex => (prevIndex + 1) % lines.length);
        setCurrentView('production');
    };

    const handlePrevLine = () => {
        setIsPlaying(false);
        setActiveLineIndex(prevIndex => (prevIndex - 1 + lines.length) % lines.length);
        setCurrentView('production');
    };

    const currentHour = useMemo(() => {
        if (selectedDate === getTodayString()) {
            return new Date().getHours() - 7;
        }
        return factorySettings.workingHoursPerDay;
    }, [selectedDate, factorySettings.workingHoursPerDay]);

    const activePlan = useMemo(() => {
        return dailyLinePlans.find(p => p.lineNumber === filterLine && p.date === selectedDate);
    }, [filterLine, selectedDate, dailyLinePlans]);

    const activeOrder = useMemo(() => {
        if (activePlan) return orders.find(o => o.id === activePlan.orderNumber);
        const lineKanban = (kanbanEntries || []).filter(k => k.lineNumber === filterLine && k.status === 'active');
        if (lineKanban.length > 0) return orders.find(o => o.id === lineKanban[0].orderNumber);
        return null;
    }, [filterLine, kanbanEntries, orders, activePlan]);
    
    const activeStyle = useMemo(() => {
        if (!activeOrder) return null;
        return styles.find(s => s.id === activeOrder.styleId);
    }, [activeOrder, styles]);

    const dashboardData = useMemo(() => {
        if (!filterLine || !activeStyle || !activeOrder) return null;

        const entriesForLineAndOrder = (productionEntries || []).filter(
            e => e.lineNumber === filterLine && e.orderNumber === activeOrder.id && e.timestamp.startsWith(selectedDate)
        );

        const totalSmvProduced = entriesForLineAndOrder.reduce((sum, entry) => {
            const op = activeStyle.operationBulletin.find(ob => ob.operationId === entry.operation);
            const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
            return sum + (smv * entry.productionQuantity);
        }, 0);

        const staffHoursMap = new Map<string, Set<number>>();
        entriesForLineAndOrder.forEach(entry => {
            if (!staffHoursMap.has(entry.employeeId)) staffHoursMap.set(entry.employeeId, new Set());
            staffHoursMap.get(entry.employeeId)!.add(entry.hourCounter);
        });
        const totalAvailableMinutes = Array.from(staffHoursMap.values()).reduce((sum, hours) => sum + hours.size * 60, 0);
        const efficiency = totalAvailableMinutes > 0 ? (totalSmvProduced / totalAvailableMinutes) * 100 : 0;
        
        let todayOutput = 0;
        if (outputSettings.source === 'endOfLine') {
            const todaysChecks = (endLineChecks || []).filter(e => e.timestamp.startsWith(selectedDate) && e.lineNumber === filterLine);
            todayOutput = todaysChecks.filter(c => c.status === 'Pass' || c.reworkStatus === 'completed').length;
        } else {
             if(activeStyle && activeStyle.operationBulletin.length > 0) {
                const lastOpId = activeStyle.operationBulletin.reduce((a,b) => a.sNo > b.sNo ? a : b).operationId;
                todayOutput = entriesForLineAndOrder.filter(e => e.operation === lastOpId).reduce((s, e) => s + e.productionQuantity, 0);
            }
        }
        
        const hourlyTarget = activePlan ? (activePlan.plannedQuantity / factorySettings.workingHoursPerDay) : 0;
        const cumulativeTarget = hourlyTarget * Math.max(1, currentHour);
        const deviation = cumulativeTarget > 0 ? ((todayOutput - cumulativeTarget) / cumulativeTarget) * 100 : 0;
        const currentHourOutput = entriesForLineAndOrder.filter(e => e.hourCounter === currentHour).reduce((sum, e) => sum + e.productionQuantity, 0);

        const opChartData = activeStyle.operationBulletin.sort((a,b) => a.sNo - b.sNo).map(opItem => {
            const opId = opItem.operationId;
            const opName = operations.find(o => o.id === opId)?.name || 'Unknown';
            const outputTodayForOp = entriesForLineAndOrder.filter(e => e.operation === opId).reduce((s, e) => s + e.productionQuantity, 0);
            const prevOpId = opItem.sNo > 1 ? activeStyle.operationBulletin.find(op => op.sNo === opItem.sNo - 1)?.operationId : null;
            const loadedToLine = (kanbanEntries || []).filter(k => k.lineNumber === filterLine && k.orderNumber === activeOrder.id && k.status === 'active').reduce((sum, k) => sum + k.quantity, 0);
            const prevOpOutput = prevOpId ? entriesForLineAndOrder.filter(e => e.operation === prevOpId).reduce((s, e) => s + e.productionQuantity, 0) : loadedToLine;
            const wip = prevOpOutput - outputTodayForOp;
            const hourOutput = entriesForLineAndOrder.filter(e => e.operation === opId && e.hourCounter === currentHour).reduce((s, e) => s + e.productionQuantity, 0);
            
            const note = opItem.allocatedOperators && opItem.allocatedOperators > 1 ? `${opItem.allocatedOperators} machines` : undefined;

            return { opName, todayOutput: outputTodayForOp, hourOutput, wip: Math.max(0, wip), note };
        });

        return { efficiency, todayOutput, hourlyTarget, cumulativeTarget, deviation, currentHourOutput, opChartData };
    }, [filterLine, selectedDate, currentHour, productionEntries, activeOrder, activeStyle, operations, kanbanEntries, outputSettings, endLineChecks, activePlan, factorySettings.workingHoursPerDay]);

    const hourlyTrendData = useMemo(() => {
        if (!activeStyle || !dashboardData) return Array.from({ length: 10 }, (_, i) => ({ hour: i + 1, hourOutput: 0 }));
        const hourlyData = new Map<number, number>();
        for (let i = 1; i <= 10; i++) hourlyData.set(i, 0);

        const entries = (productionEntries || []).filter(e => e.lineNumber === filterLine && e.orderNumber === activeOrder?.id && e.timestamp.startsWith(selectedDate));
        
        if (outputSettings.source === 'endOfLine') {
            // Cannot reliably get hourly output from end-line checks, so we use last op for trend.
        }

        if(activeStyle && activeStyle.operationBulletin.length > 0) {
            const lastOpId = activeStyle.operationBulletin.reduce((a,b) => a.sNo > b.sNo ? a : b).operationId;
            entries.forEach(e => {
                if(e.operation === lastOpId) {
                    hourlyData.set(e.hourCounter, (hourlyData.get(e.hourCounter) || 0) + e.productionQuantity);
                }
            });
        }
        
        return Array.from(hourlyData.entries()).map(([hour, hourOutput]) => ({ hour, hourOutput }));
    }, [activeStyle, dashboardData, productionEntries, filterLine, activeOrder, selectedDate, outputSettings]);

    const qualityData = useMemo(() => {
        // IN-LINE AUDIT DATA
        const lineAuditsToday = (inLineAudits || []).filter(a => a.lineNumber === filterLine && a.timestamp.startsWith(selectedDate));
        const auditStatus = { Green: 0, Yellow: 0, Red: 0 };
        lineAuditsToday.forEach(audit => {
            audit.records.forEach(record => {
                auditStatus[record.status]++;
            });
        });
        const donutData = [
            { label: 'Green', value: auditStatus.Green, color: '#22c55e' },
            { label: 'Yellow', value: auditStatus.Yellow, color: '#f59e0b' },
            { label: 'Red', value: auditStatus.Red, color: '#ef4444' },
        ];

        // END-OF-LINE DATA
        const lineChecksToday = (endLineChecks || []).filter(c => c.lineNumber === filterLine && c.timestamp.startsWith(selectedDate));
        const okCount = lineChecksToday.filter(c => c.status === 'Pass' || (c.status === 'Rework' && c.reworkStatus === 'completed')).length;
        const defectCount = lineChecksToday.filter(c => c.status === 'Rework' || c.status === 'Reject').length;
        const totalChecked = okCount + defectCount;
        const defectRate = totalChecked > 0 ? (defectCount / totalChecked) * 100 : 0;

        const topDefectCounts = new Map<string, number>();
        lineChecksToday.forEach(c => {
            if (c.defectId && (c.status === 'Rework' || c.status === 'Reject')) {
                const defectName = (defects || []).find(d => d.id === c.defectId)?.name || 'Unknown Defect';
                topDefectCounts.set(defectName, (topDefectCounts.get(defectName) || 0) + 1);
            }
        });
        
        const topDefectsChartData = Array.from(topDefectCounts.entries())
            .sort((a,b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ opName: name, todayOutput: count, wip: 0, hourOutput: 0 }));

        return { donutData, okCount, defectCount, defectRate, topDefectsChartData };
    }, [filterLine, selectedDate, inLineAudits, endLineChecks, defects]);


    if (!activeLine) {
        return <div className="p-10 text-center">Please create at least one production line.</div>;
    }

    const renderProductionView = () => (
        <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard title="Efficiency (OWE)" value={`${dashboardData?.efficiency.toFixed(1) || 0}%`} />
                <KpiCard title="Today's Output" value={dashboardData?.todayOutput.toLocaleString() || 0} />
                <KpiCard title="Hourly Target" value={dashboardData?.hourlyTarget.toFixed(0) || 0} />
                <KpiCard title="Deviation" value={`${dashboardData?.deviation.toFixed(1) || 0}%`} colorClass={dashboardData && dashboardData.deviation >= 0 ? 'text-green-400' : 'text-red-400'} subValue={`Target: ${dashboardData?.cumulativeTarget.toFixed(0) || 0}`} />
                <KpiCard title="This Hour" value={dashboardData?.currentHourOutput.toLocaleString() || 0} />
            </div>

            {/* Main Chart Area */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
                {/* Top row with two bar charts */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                    <VerticalBarChart data={dashboardData?.opChartData || []} title="Operation-wise Production (Today)" displayMode="output"/>
                    <VerticalBarChart data={dashboardData?.opChartData || []} title="Work-in-Progress (WIP)" displayMode="wip"/>
                </div>
                {/* Bottom row with trend chart */}
                <div className="h-1/3 flex-shrink-0 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex flex-col">
                    <LineTrendChart data={hourlyTrendData} title="Hourly Production Trend"/>
                </div>
            </div>
        </div>
    );

    const renderQualityView = () => (
      <div className="flex-1 flex flex-col gap-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QualityKpiCard title="OK" value={qualityData?.okCount.toLocaleString() || 0} bgColor="bg-green-600" textColor="text-white" />
              <QualityKpiCard title="Defect" value={qualityData?.defectCount.toLocaleString() || 0} bgColor="bg-amber-500" textColor="text-white" />
              <QualityKpiCard title="Defect Rate" value={`${qualityData?.defectRate.toFixed(2) || 0}%`} bgColor="bg-red-600" textColor="text-white" />
          </div>

          {/* Chart Area */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex flex-col items-center justify-center">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">In-Line Audit Status</h3>
                  <div className="flex-1 w-full"><DonutChart data={qualityData.donutData} /></div>
              </div>
              <div className="lg:col-span-3">
                  <VerticalBarChart data={qualityData.topDefectsChartData} title="Top 5 End-of-Line Defects" displayMode="output" />
              </div>
          </div>
      </div>
    );

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900 p-4">
        {/* Header */}
        <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold text-slate-800 ${activeLine.color}`}>
                    {activeLine.name.replace('Line ', '')}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{activeLine.name} Dashboard</h1>
                    <p className="text-slate-600 dark:text-slate-400">Order: <span className="font-semibold">{activeOrder?.name || 'N/A'}</span> | Style: <span className="font-semibold">{activeStyle?.name || 'N/A'}</span></p>
                </div>
            </div>
             <div className="flex items-center gap-4 mt-2 md:mt-0">
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-10 px-2 border-slate-300 rounded-md shadow-sm text-sm" />
                <div className="bg-slate-200 p-1 rounded-lg flex text-sm">
                    <button onClick={() => setCurrentView('production')} className={`px-3 py-1 rounded-md ${currentView === 'production' ? 'bg-white shadow-sm' : ''}`}>Production</button>
                    <button onClick={() => setCurrentView('quality')} className={`px-3 py-1 rounded-md ${currentView === 'quality' ? 'bg-white shadow-sm' : ''}`}>Quality</button>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handlePrevLine} className="p-2 rounded-full bg-white hover:bg-slate-200 shadow-sm"><ArrowLeftIcon className="w-5 h-5"/></button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded-full bg-white hover:bg-slate-200 shadow-sm">
                        {isPlaying ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                    </button>
                    <button onClick={handleNextLine} className="p-2 rounded-full bg-white hover:bg-slate-200 shadow-sm"><ArrowRightIcon className="w-5 h-5"/></button>
                </div>
            </div>
        </header>

        {/* Main content */}
        {currentView === 'production' ? renderProductionView() : renderQualityView()}
    </div>
  );
};

export default LineDashboardPage;