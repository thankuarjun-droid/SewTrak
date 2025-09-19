
import React from 'react';

interface PercentageBarProps {
  data: { label: string; value: number; color: string }[];
  compact?: boolean;
}

export const PercentageBar = ({ data, compact = false }: PercentageBarProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="w-full bg-slate-200 rounded-full h-6 flex items-center justify-center text-xs text-slate-500">
        No data
      </div>
    );
  }

  return (
    <div>
      <div className="flex w-full h-6 rounded-full overflow-hidden bg-slate-200">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          return (
            <div
              key={index}
              className="flex items-center justify-center transition-all duration-300"
              style={{ width: `${percentage}%`, backgroundColor: item.color }}
              title={`${item.label}: ${item.value.toFixed(2)}s (${percentage.toFixed(0)}%)`}
            >
              <span className="text-white text-[10px] font-bold">
                {item.value.toFixed(2)}s
              </span>
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className="mt-2 flex justify-center flex-wrap gap-x-4 gap-y-1">
          {data.map((item) => (
            <div key={item.label} className="flex items-center text-xs">
              <div
                className="w-3 h-3 rounded-sm mr-1.5"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
