import React from 'react';

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string;
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number, innerRadius: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const innerStart = polarToCartesian(x, y, innerRadius, endAngle);
  const innerEnd = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y} Z`;
};


export const DonutChart = ({ data, centerLabel, centerValue }: DonutChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-400 dark:text-slate-500">
        No data available
      </div>
    );
  }

  let startAngle = 0;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {data.map((item) => {
            const angle = (item.value / total) * 360;
            if (angle === 0) return null;
            const endAngle = startAngle + angle;
            const path = describeArc(50, 50, 50, startAngle, endAngle, 35);
            startAngle = endAngle;
            return <path key={item.label} d={path} fill={item.color} />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{centerValue !== undefined ? centerValue : total.toLocaleString()}</span>
            {centerLabel && <span className="text-xs text-slate-500 dark:text-slate-400">{centerLabel}</span>}
        </div>
      </div>
      <div className="mt-4 space-y-1 w-full max-w-xs">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="text-slate-600 dark:text-slate-300 truncate">{item.label}</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 ml-2">
              {item.value.toLocaleString()} ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
