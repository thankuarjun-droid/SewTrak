import React from 'react';

interface GaugeChartProps {
  value: number; // 0 to 100
  label: string;
  targetStart?: number;
  targetStretch?: number;
}

const GaugeChart = ({ value, label, targetStart = 60, targetStretch = 75 }: GaugeChartProps) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const angle = (clampedValue / 100) * 180;
  const color =
    clampedValue < targetStart ? '#ef4444' : // red-500
    clampedValue < targetStretch ? '#f59e0b' : // amber-500
    '#22c55e'; // green-500

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <svg viewBox="0 0 100 55" className="w-full">
        {/* Background arc */}
        <path
          d={describeArc(50, 50, 40, 0, 180)}
          fill="none"
          stroke="#e5e7eb" // gray-200
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={describeArc(50, 50, 40, 0, angle)}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease-in-out, stroke 0.5s ease' }}
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <div className="text-4xl font-bold text-slate-800" style={{ color }}>
          {clampedValue.toFixed(1)}<span className="text-2xl">%</span>
        </div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
      </div>
    </div>
  );
};

export default GaugeChart;