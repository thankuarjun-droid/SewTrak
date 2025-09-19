import React from 'react';

interface TrendData {
  hour: number;
  hourOutput: number;
}

interface LineTrendChartProps {
  data: TrendData[];
  title: string;
}

// Helper functions for creating a smooth SVG path
const line = (pointA: {x:number, y:number}, pointB: {x:number, y:number}) => {
  const lengthX = pointB.x - pointA.x;
  const lengthY = pointB.y - pointA.y;
  return {
    length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
    angle: Math.atan2(lengthY, lengthX)
  };
};

const controlPoint = (current: {x:number, y:number}, previous: {x:number, y:number}, next: {x:number, y:number}, reverse?: boolean) => {
  const p = previous || current;
  const n = next || current;
  const smoothing = 0.2;
  const l = line(p, n);
  const angle = l.angle + (reverse ? Math.PI : 0);
  const length = l.length * smoothing;
  const x = current.x + Math.cos(angle) * length;
  const y = current.y + Math.sin(angle) * length;
  return [x, y];
};

const createSmoothPath = (points: {x:number, y:number}[]) => {
  if (points.length < 2) return `M ${points[0]?.x || 0},${points[0]?.y || 0}`;
  return points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
    const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
    return `${acc} C ${cpsX.toFixed(2)},${cpsY.toFixed(2)} ${cpeX.toFixed(2)},${cpeY.toFixed(2)} ${point.x.toFixed(2)},${point.y.toFixed(2)}`;
  }, '');
};


const LineTrendChart = ({ data, title }: LineTrendChartProps) => {
    // Calculate cumulative data
    let cumulative = 0;
    const cumulativeData = data.map(d => {
        cumulative += d.hourOutput;
        return { ...d, cumulativeOutput: cumulative };
    });

    const maxHourVal = Math.max(...data.map(d => d.hourOutput), 1);
    const maxCumVal = Math.max(...cumulativeData.map(d => d.cumulativeOutput), 1);
    
    // Linear regression for trend line
    const n = data.length > 1 ? data.length : 1;
    const sumX = data.reduce((s, d) => s + d.hour, 0);
    const sumY = data.reduce((s, d) => s + d.hourOutput, 0);
    const sumXY = data.reduce((s, d) => s + d.hour * d.hourOutput, 0);
    const sumX2 = data.reduce((s, d) => s + d.hour * d.hour, 0);
    const denominator = n * sumX2 - sumX * sumX;
    const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    
    const trendStart = slope * (data[0]?.hour || 1) + intercept;
    const trendEnd = slope * (data[n-1]?.hour || 10) + intercept;

    const hourlyPoints = data.map(d => ({ x: (d.hour - 1) * (100 / 9), y: 100 - (d.hourOutput / maxHourVal) * 95 }));
    const cumulativePoints = cumulativeData.map(d => ({ x: (d.hour - 1) * (100 / 9), y: 100 - (d.cumulativeOutput / maxCumVal) * 95 }));

    const hourlyPath = createSmoothPath(hourlyPoints);
    const cumulativePath = createSmoothPath(cumulativePoints);

    const hourlyAreaPath = `${hourlyPath} L ${hourlyPoints[hourlyPoints.length-1]?.x.toFixed(2) || 100},100 L ${hourlyPoints[0]?.x.toFixed(2) || 0},100 Z`;
    const cumulativeAreaPath = `${cumulativePath} L ${cumulativePoints[cumulativePoints.length-1]?.x.toFixed(2) || 100},100 L ${cumulativePoints[0]?.x.toFixed(2) || 0},100 Z`;

    return (
        <div className="w-full h-full relative flex flex-col">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 text-center">{title}</h3>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full flex-1">
                <defs>
                    <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
                    </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map(v => (
                    <line key={v} x1="0" y1={100 - v * 95} x2="100" y2={100 - v * 95} stroke="#e5e7eb" strokeWidth="0.5" />
                ))}

                {/* Cumulative Area and Line */}
                <path d={cumulativeAreaPath} fill="url(#cumulativeGradient)" />
                <path d={cumulativePath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

                {/* Hourly Area and Line */}
                <path d={hourlyAreaPath} fill="url(#hourlyGradient)" />
                <path d={hourlyPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                 
                {/* Trend Line */}
                <line 
                    x1="0" y1={100 - (trendStart / maxHourVal) * 95} 
                    x2="100" y2={100 - (trendEnd / maxHourVal) * 95} 
                    stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" 
                />

                {/* Data points */}
                {hourlyPoints.map((p, i) => (
                    <circle key={`p-${i}`} cx={p.x} cy={p.y} r="1.5" fill="#3b82f6" />
                ))}
            </svg>
            <div className="flex-shrink-0 flex justify-between text-xs text-slate-400 mt-2 px-1">
                {data.map(d => <span key={d.hour}>H{d.hour}</span>)}
            </div>
             <div className="flex-shrink-0 flex justify-center gap-4 text-xs mt-2 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-500"></div><span>Hourly</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-amber-500"></div><span>Cumulative</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-red-500"></div><span className="italic">Trend</span></div>
            </div>
        </div>
    );
};

export default LineTrendChart;
