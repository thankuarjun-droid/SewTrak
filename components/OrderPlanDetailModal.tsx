import React from 'react';
import type { Order, Style, MasterDataItem } from '../types';
import { XIcon } from './IconComponents';

interface OrderPlanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  stylesMap: Map<string, Style>;
  colorsMap: Map<string, string>;
  plannedQuantities: Map<string, number>;
  onStartPlanWithColor: (data: { orderId: string; colorId: string }) => void;
  onPlanFullOrder: (orderId: string) => void;
}

export const OrderPlanDetailModal = ({ isOpen, onClose, order, stylesMap, colorsMap, plannedQuantities, onStartPlanWithColor, onPlanFullOrder }: OrderPlanDetailModalProps) => {
  if (!isOpen) return null;

  const style = stylesMap.get(order.styleId);
  const hasRemaining = order.quantities.some(q => (q.quantity - (plannedQuantities.get(`${order.id}-${q.colorId}`) || 0)) > 0);

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Plan Order: {order.id}</h2>
            <p className="text-sm text-slate-500">{style?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            {hasRemaining && (
                <button 
                    onClick={() => onPlanFullOrder(order.id)}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700"
                >
                    Plan Full Order
                </button>
            )}
            <button onClick={onClose}><XIcon className="w-6 h-6"/></button>
          </div>
        </header>
        <main className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {order.quantities.map(q => {
              const key = `${order.id}-${q.colorId}`;
              const planned = plannedQuantities.get(key) || 0;
              const remaining = q.quantity - planned;
              
              return (
                <div key={q.colorId} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800">{colorsMap.get(q.colorId) || q.colorId}</p>
                    <p className="text-xs text-slate-500">
                      Total: {q.quantity.toLocaleString()} | Planned: {planned.toLocaleString()} | 
                      <span className={`font-bold ${remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                         {remaining > 0 ? ` Rem: ${remaining.toLocaleString()}`: 'Completed'}
                      </span>
                    </p>
                  </div>
                  {remaining > 0 && (
                     <button 
                        onClick={() => onStartPlanWithColor({ orderId: order.id, colorId: q.colorId })}
                        className="px-4 py-1.5 bg-[#2c4e8a] text-white text-xs font-semibold rounded-md hover:bg-[#213a69]"
                      >
                        Start With This Color
                      </button>
                  )}
                </div>
              );
            })}
            {!hasRemaining && (
                <p className="text-center text-slate-500 py-8">This order is fully planned.</p>
             )}
          </div>
        </main>
      </div>
    </div>
  );
};
