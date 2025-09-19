import React from 'react';

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${x} ${y} Z`;
};

export const PieChart = ({ data }: PieChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="flex items-center justify-center h-full text-sm text-slate-400">No data to display</div>;
  
  let startAngle = 0;

  return (
    <div className="flex items-center h-full">
      <svg viewBox="0 0 100 100" className="w-32 h-32">
        {data.map(item => {
          const angle = (item.value / total) * 360;
          const endAngle = startAngle + angle;
          const path = describeArc(50, 50, 50, startAngle, endAngle);
          startAngle = endAngle;
          return <path key={item.label} d={path} fill={item.color} />;
        })}
      </svg>
      <div className="ml-4 space-y-2">
        {data.map(item => (
          <div key={item.label} className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: item.color }}></div>
            <span className="text-slate-600">{item.label}:</span>
            <span className="font-semibold text-slate-800 ml-1">
              {item.value} ({((item.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
