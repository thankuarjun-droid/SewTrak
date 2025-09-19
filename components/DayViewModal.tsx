import React from 'react';
import type { DailyLinePlan, Line, Order, Style } from '../types';
import { XIcon } from './IconComponents';

interface DayViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  lines: Line[];
  dailyLinePlans: DailyLinePlan[];
  orders: Order[];
  stylesMap: Map<string, Style>;
  colorsMap: Map<string, string>;
  planColorMap: Map<string, string>;
  onEditPlan: (plan: DailyLinePlan) => void;
  onAddNewPlan: (data: { lineId: string; date: string }) => void;
}

export const DayViewModal = ({ isOpen, onClose, dateStr, lines, dailyLinePlans, orders, stylesMap, colorsMap, planColorMap, onEditPlan, onAddNewPlan }: DayViewModalProps) => {
  if (!isOpen) return null;

  const date = new Date(dateStr);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  const formattedDate = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Day View</h2>
            <p className="text-sm text-slate-500">{formattedDate}</p>
          </div>
          <button onClick={onClose}><XIcon className="w-6 h-6"/></button>
        </header>
        <main className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {lines.map(line => {
              const plan = dailyLinePlans.find(p => p.lineNumber === line.id && p.date === dateStr);
              const order = plan ? orders.find(o => o.id === plan.orderNumber) : null;
              const style = order ? stylesMap.get(order.styleId) : null;
              const colorName = plan ? colorsMap.get(plan.colorId) : '';
              const planColor = plan ? planColorMap.get(`${plan.orderNumber}-${plan.colorId}`) : 'transparent';

              return (
                <div key={line.id} className="grid grid-cols-3 gap-4 items-center p-3 bg-slate-50 rounded-lg border-l-4" style={{borderColor: plan ? planColor : 'transparent'}}>
                  <div className="col-span-1 font-semibold text-slate-800">{line.name}</div>
                  {plan && order ? (
                    <>
                      <div className="col-span-1 text-sm">
                        <p className="font-bold text-slate-800">{order.id} - {colorName}</p>
                        <p className="text-slate-600 truncate">{style?.name}</p>
                        <p className="font-semibold text-slate-800 mt-1">{plan.plannedQuantity.toLocaleString()} pcs</p>
                      </div>
                      <div className="col-span-1 text-right">
                        <button onClick={() => {onClose(); onEditPlan(plan)}} className="px-3 py-1.5 bg-white border text-slate-700 text-xs font-semibold rounded-md">Edit</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-1 text-sm text-green-600">Available</div>
                       <div className="col-span-1 text-right">
                        <button onClick={() => {onClose(); onAddNewPlan({ lineId: line.id, date: dateStr })}} className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-md">Add Plan</button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};