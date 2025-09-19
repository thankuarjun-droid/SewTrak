import React, { useMemo } from 'react';
import type { OperationBulletinItem } from '../types';

interface YamazumiChartProps {
  operations: OperationBulletinItem[];
  taktTime: number; // in seconds
  operationNames: Map<string, string>;
  isBalancedView: boolean;
}

export const YamazumiChart = ({ operations, taktTime, operationNames, isBalancedView }: YamazumiChartProps) => {
  if (operations.length === 0) {
    return <div className="text-center py-10 text-slate-500 dark:text-slate-400">No operations to display.</div>;
  }
  
  const chartDataByWorkstation = useMemo(() => {
    const workstations = new Map<number, { ops: OperationBulletinItem[], totalTime: number }>();
    operations.forEach(op => {
      const wsNumber = op.workstation || op.sNo; // Fallback to sNo if not balanced
      if (!workstations.has(wsNumber)) {
        workstations.set(wsNumber, { ops: [], totalTime: 0 });
      }
      const wsData = workstations.get(wsNumber)!;
      wsData.ops.push(op);
      const opTime = (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / (op.allocatedOperators || 1);
      wsData.totalTime += opTime;
    });
    return Array.from(workstations.entries()).sort((a,b) => a[0] - b[0]);
  }, [operations]);

  const allOpsForChart = useMemo(() => {
    return chartDataByWorkstation.flatMap(([, data]) => data.ops.sort((a,b) => a.sNo - b.sNo));
  }, [chartDataByWorkstation]);

  const maxTime = Math.max(...chartDataByWorkstation.map(([,d]) => d.totalTime), taktTime, ...operations.map(op => op.pickupTime + op.sewingTime + op.trimAndDisposalTime)) * 1.1;
  if (maxTime === 0) return <div className="text-center py-10 text-slate-500 dark:text-slate-400">Operations have no time values.</div>

  return (
    <div className="w-full h-96 bg-white dark:bg-slate-800 p-4 border dark:border-slate-700 rounded-lg">
      <div className="flex h-full">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between text-xs text-slate-500 dark:text-slate-400 h-[calc(100%-2.5rem)] pr-2 flex-shrink-0">
          <span>{maxTime.toFixed(0)}s</span>
          <span>{(maxTime / 2).toFixed(0)}s</span>
          <span>0s</span>
        </div>

        {/* Chart Area */}
        <div className="flex-1 flex border-l border-b border-slate-200 dark:border-slate-600 relative">
            {/* Takt Time Line */}
            {taktTime > 0 && taktTime < maxTime && (
                <div className="absolute w-full border-t-2 border-dashed border-red-500 z-20" style={{ bottom: `${(taktTime / maxTime) * 100}%` }}>
                <span className="absolute -top-2.5 right-0 text-xs text-red-500 font-semibold bg-white dark:bg-slate-800 px-1">Takt: {taktTime.toFixed(1)}s</span>
                </div>
            )}
            {/* Bars */}
            {allOpsForChart.map((op, index) => {
              const opName = operationNames.get(op.operationId) || `Op ${op.sNo}`;
              const totalOpTime = op.pickupTime + op.sewingTime + op.trimAndDisposalTime;
              const workstationNumber = op.workstation || op.sNo;
              const isFirstInWorkstation = index === 0 || allOpsForChart[index-1].workstation !== workstationNumber;

              return (
                <div key={op.sNo} className={`h-full flex flex-col border-r dark:border-slate-700 ${isFirstInWorkstation && isBalancedView ? 'border-l-2 border-slate-400 dark:border-slate-500' : ''}`} style={{ width: `${100 / allOpsForChart.length}%` }}>
                  <div className="flex-1 flex items-end justify-center" title={`${opName}\nTotal Time: ${totalOpTime.toFixed(1)}s`}>
                    <div className="w-full flex flex-col-reverse h-full">
                      <div className="bg-red-400 hover:bg-red-500" style={{ height: `${(op.trimAndDisposalTime / maxTime) * 100}%` }} title={`Trim & Disposal: ${op.trimAndDisposalTime.toFixed(1)}s`}></div>
                      <div className="bg-green-400 hover:bg-green-500" style={{ height: `${(op.sewingTime / maxTime) * 100}%` }} title={`Sewing: ${op.sewingTime.toFixed(1)}s`}></div>
                      <div className="bg-red-400 hover:bg-red-500" style={{ height: `${(op.pickupTime / maxTime) * 100}%` }} title={`Pickup: ${op.pickupTime.toFixed(1)}s`}></div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-center text-[10px] text-slate-600 dark:text-slate-300 font-medium py-1 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-700 truncate" title={opName}>
                    {opName}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      <div className="flex justify-center gap-4 text-xs mt-2 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400"></div> Value Added (Sewing)</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400"></div> Non-Value Added (Handling)</div>
      </div>
    </div>
  );
};