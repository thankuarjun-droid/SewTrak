import React, { useState, useMemo, useEffect } from 'react';
import type { ProductionEntry, Order, Style, MasterDataItem, KanbanEntry } from '../types';
import { getProductionInsights } from '../services/geminiService';
import { markdownToHtml } from '../services/utils';
import { SparkleIcon } from '../components/IconComponents';

interface AiInsightsPageProps {
  productionEntries: ProductionEntry[];
  kanbanEntries: KanbanEntry[];
  orders: Order[];
  styles: Style[];
  lines: MasterDataItem[];
  operations: MasterDataItem[];
  colors: MasterDataItem[];
}

const getTodayString = () => new Date().toISOString().split('T')[0];

const AiInsightsPage = ({ productionEntries, kanbanEntries, orders, styles, lines, operations }: AiInsightsPageProps) => {
  const [filterDate] = useState(getTodayString());
  const [filterLine, setFilterLine] = useState(lines[0]?.id || '');
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const stylesMap = useMemo(() => new Map(styles.map(s => [s.id, s])), [styles]);
  const operationsMap = useMemo(() => new Map(operations.map(o => [o.id, o.name])), [operations]);

  const activeOrderForLine = useMemo(() => {
    const lineKanban = kanbanEntries.filter(k => k.lineNumber === filterLine && k.status === 'active');
    if (lineKanban.length > 0) {
      return orders.find(o => o.id === lineKanban[0].orderNumber);
    }
    return null;
  }, [filterLine, kanbanEntries, orders]);

  const dashboardData = useMemo(() => {
    if (!filterLine || !activeOrderForLine) return null;

    const style = stylesMap.get(activeOrderForLine.styleId);
    if (!style?.operationBulletin || style.operationBulletin.length === 0) return null;
    
    const entriesForLineAndOrder = productionEntries.filter(
        e => e.lineNumber === filterLine && e.orderNumber === activeOrderForLine.id && e.timestamp.startsWith(filterDate)
    );
    
    const totalSmvProduced = entriesForLineAndOrder.reduce((sum, entry) => {
        const op = style.operationBulletin.find(ob => ob.operationId === entry.operation);
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

    const opChartData = style.operationBulletin
      .sort((a,b) => a.sNo - b.sNo)
      .map(opItem => {
        const opId = opItem.operationId;
        const opName = operationsMap.get(opId) || 'Unknown';
        const outputTodayForOp = entriesForLineAndOrder.filter(e => e.operation === opId).reduce((s, e) => s + e.productionQuantity, 0);
        const prevOpId = opItem.sNo > 1 ? style.operationBulletin.find(op => op.sNo === opItem.sNo - 1)?.operationId : null;
        const loadedToLine = kanbanEntries.filter(k => k.lineNumber === filterLine && k.orderNumber === activeOrderForLine.id && k.timestamp.startsWith(filterDate)).reduce((sum, k) => sum + k.quantity, 0);
        const prevOpOutput = prevOpId ? entriesForLineAndOrder.filter(e => e.operation === prevOpId).reduce((s, e) => s + e.productionQuantity, 0) : loadedToLine;
        const wip = prevOpOutput - outputTodayForOp;
        return { opName, todayOutput: outputTodayForOp, hourOutput: 0, wip: Math.max(0, wip) };
    });

    const bottleneck = opChartData.reduce((maxWipOp, currentOp) => currentOp.wip > maxWipOp.wip ? currentOp : maxWipOp, {opName: '', wip: -1});

    return { efficiency, opChartData, bottleneck: bottleneck.wip > 0 ? bottleneck : null };
  }, [filterLine, filterDate, productionEntries, activeOrderForLine, stylesMap, operationsMap, kanbanEntries]);

  const fetchInsights = async () => {
    if (!dashboardData || !activeOrderForLine || !filterLine) return;
    
    const lineName = lines.find(l => l.id === filterLine)?.name || 'Selected Line';

    setIsLoading(true);
    try {
      const result = await getProductionInsights(
        lineName,
        activeOrderForLine.name,
        dashboardData.opChartData,
        dashboardData.bottleneck,
        dashboardData.efficiency
      );
      setInsights(result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching insights:", error);
      setInsights("Could not load insights at this time.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [dashboardData, activeOrderForLine, filterLine]);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">AI Production Insights</h1>
          <p className="text-slate-600 mt-2">Get real-time analysis and recommendations from Gemini.</p>
        </div>
        <button onClick={fetchInsights} disabled={isLoading} className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            <SparkleIcon className="w-5 h-5"/>
            {isLoading ? 'Analyzing...' : 'Refresh Insights'}
        </button>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-md max-w-xl">
          <label htmlFor="line-select-ai" className="block text-sm font-medium text-slate-700">Select Production Line</label>
          <select id="line-select-ai" value={filterLine} onChange={e => setFilterLine(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 h-10 text-base border-slate-300 rounded-md shadow-sm">
            {lines.map(line => (<option key={line.id} value={line.id}>{line.name}</option>))}
          </select>
      </div>

      <main className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-6 bg-slate-200 rounded w-1/3 mt-4"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        ) : insights ? (
            <div>
                <div className="prose prose-lg max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: markdownToHtml(insights) }} />
                {lastUpdated && <p className="text-xs text-slate-400 mt-6 italic">Last updated: {lastUpdated.toLocaleTimeString()}</p>}
            </div>
        ) : (
          <div className="text-center py-16 text-slate-500">
            <p>No actionable insights for this line at the moment.</p>
            <p className="text-sm">This could be because there's no active order or no production data for today.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AiInsightsPage;