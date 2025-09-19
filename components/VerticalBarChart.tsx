import React from 'react';

interface ChartData {
  opName: string;
  todayOutput: number;
  wip: number;
  hourOutput: number;
  note?: string; // For annotations like "3 Machines"
}

interface VerticalBarChartProps {
  data: ChartData[];
  title: string;
  displayMode?: 'both' | 'output' | 'wip';
}

const VerticalBarChart = ({ data, title, displayMode = 'both' }: VerticalBarChartProps) => {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex flex-col p-4 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{title}</h3>
                <div className="flex-1 flex items-center justify-center text-slate-500">No data available for this view.</div>
            </div>
        );
    }

    const maxVal = Math.max(...data.flatMap(d => [d.wip, d.todayOutput]), 1);

    const showWip = displayMode === 'both' || displayMode === 'wip';
    const showOutput = displayMode === 'both' || displayMode === 'output';
    const barContainerClass = showWip && showOutput ? 'gap-1' : '';
    const barWidthClass = showWip && showOutput ? 'w-1/2' : 'w-full';

    return (
        <div className="w-full h-full flex flex-col p-4 bg-white dark:bg-slate-800 rounded-xl shadow-md">
            {/* Title */}
            <h3 className="flex-shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{title}</h3>
            
            {/* Main Chart Area */}
            <div className="flex-1 w-full flex flex-col min-h-0">
                {/* Data Values (Top) */}
                <div className="h-5 flex-shrink-0 grid gap-x-2" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
                    {data.map((d, i) => (
                        <div key={`${d.opName}-${i}-val`} className={`flex items-end justify-center text-xs font-bold text-slate-700 dark:text-slate-300 ${barContainerClass}`}>
                            {showWip && <div className={`${barWidthClass} text-center truncate`}>{d.wip > 0 ? d.wip : ''}</div>}
                            {showOutput && <div className={`${barWidthClass} text-center truncate`}>{d.todayOutput > 0 ? d.todayOutput : ''}</div>}
                        </div>
                    ))}
                </div>

                {/* Bars Area */}
                <div className="flex-1 grid gap-x-2" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
                    {data.map((d, i) => (
                        <div key={`${d.opName}-${i}-bar`} className={`flex justify-center items-end ${barContainerClass}`}>
                            {showWip && (
                                <div className={`${barWidthClass} bg-amber-400 rounded-t-sm transition-all duration-300`}
                                     style={{ height: `${(d.wip / maxVal) * 100}%` }}
                                     title={`WIP: ${d.wip}`}>
                                </div>
                            )}
                            {showOutput && (
                                <div className={`${barWidthClass} bg-sky-500 rounded-t-sm transition-all duration-300`}
                                     style={{ height: `${(d.todayOutput / maxVal) * 100}%` }}
                                     title={`Today Output: ${d.todayOutput}`}>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* X-Axis Labels (Bottom) */}
                <div className="h-8 flex-shrink-0 border-t dark:border-slate-700 mt-2 pt-1 grid gap-x-2" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
                    {data.map((d, i) => (
                        <div key={`${d.opName}-${i}-label`} className="text-center text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate px-1 flex flex-col items-center justify-center">
                            <span>{d.opName}</span>
                            {d.note && <span className="text-[9px] bg-yellow-200 text-yellow-800 px-1 rounded-full">{d.note}</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex-shrink-0 flex justify-center gap-4 text-xs mt-2">
                {showOutput && <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-sky-500"></div><span>Production</span></div>}
                {showWip && <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-amber-400"></div><span>WIP</span></div>}
            </div>
        </div>
    );
};

export default VerticalBarChart;
