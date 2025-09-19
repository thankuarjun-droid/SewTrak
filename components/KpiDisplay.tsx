import React from 'react';
import type { KpiSetting } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from './IconComponents';

interface KpiDisplayProps {
  kpi?: KpiSetting;
  value: number | null | undefined;
  label: string;
  unit?: string;
  format?: 'number' | 'currency' | 'percent' | 'boolean';
}

const KpiDisplayInner = ({ kpi, value, label, unit, format = 'number' }: KpiDisplayProps) => {
  
  const formattedValue = () => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    if (format === 'boolean') return value >= 1 ? 'Yes' : 'No';
    switch (format) {
      case 'currency': return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percent': return `${value.toFixed(1)}%`;
      case 'number':
      default:
        return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
    }
  };

  const isValueAvailable = value !== null && value !== undefined && !isNaN(value);

  if (!kpi) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-md h-full">
        <h3 className="text-sm font-medium text-slate-500 truncate">{label}</h3>
        <p className="mt-1 text-3xl font-semibold text-slate-900">
          {formattedValue()}
          {unit && isValueAvailable && <span className="text-base font-medium text-slate-600 ml-1">{unit}</span>}
        </p>
      </div>
    );
  }

  const { direction, targetStart, targetStretch } = kpi;
  
  let color = 'text-slate-900';
  let isGood = false;

  if (isValueAvailable) {
    if (format === 'boolean') {
        isGood = value >= targetStart;
        color = isGood ? 'text-green-600' : 'text-red-600';
    } else if (direction === 'Up') {
      isGood = value >= targetStart;
      if (value >= targetStretch) color = 'text-green-600';
      else if (value >= targetStart) color = 'text-amber-600';
      else color = 'text-red-600';
    } else if (direction === 'Down') {
      isGood = value <= targetStart;
      if (value <= targetStretch) color = 'text-green-600';
      else if (value <= targetStart) color = 'text-amber-600';
      else color = 'text-red-600';
    }
  }


  return (
    <div className="bg-white p-5 rounded-xl shadow-md h-full">
      <h3 className="text-sm font-medium text-slate-500 truncate">{label}</h3>
       <p className={`mt-1 text-3xl font-semibold flex items-baseline gap-1 ${color}`}>
        {formattedValue()}
        {unit && isValueAvailable && <span className="text-base font-medium text-slate-600 ml-1">{unit}</span>}
        {isValueAvailable && direction !== 'Neutral' && (
            isGood 
                ? <ArrowUpIcon className="w-4 h-4 text-green-500" /> 
                : <ArrowDownIcon className="w-4 h-4 text-red-500" />
        )}
      </p>
    </div>
  );
};


export const KpiDisplay = (props: Omit<KpiDisplayProps, 'label'> & { label: string | React.ReactNode }) => {
    if (typeof props.label === 'string') {
        return <KpiDisplayInner {...props as KpiDisplayProps} />;
    }
    return <div>{props.label}</div>;
};