import React from 'react';
import type { DailyLinePlan, Line, MasterDataItem } from '../types';
import { XIcon, PencilIcon, TrashIcon } from './IconComponents';

interface ExistingPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  dailyLinePlans: DailyLinePlan[];
  lines: Line[];
  colorsMap: Map<string, string>;
  onEdit: (plan: DailyLinePlan) => void;
  onDelete: (planId: string) => void;
}

export const ExistingPlansModal = ({ isOpen, onClose, orderId, dailyLinePlans, lines, colorsMap, onEdit, onDelete }: ExistingPlansModalProps) => {
  if (!isOpen) return null;

  const plansForOrder = dailyLinePlans
    .filter(p => p.orderNumber === orderId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const linesMap = new Map(lines.map(l => [l.id, l.name]));

  const handleDelete = (planId: string) => {
    if (window.confirm('Are you sure you want to delete this planned day?')) {
        onDelete(planId);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col h-[70vh]" onClick={e => e.stopPropagation()}>
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Existing Plans for Order: {orderId}</h2>
          <button onClick={onClose}><XIcon className="w-6 h-6"/></button>
        </header>
        <main className="flex-1 p-4 overflow-y-auto">
          {plansForOrder.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="p-2 text-left font-semibold">Date</th>
                  <th className="p-2 text-left font-semibold">Line</th>
                  <th className="p-2 text-left font-semibold">Color</th>
                  <th className="p-2 text-right font-semibold">Quantity</th>
                  <th className="p-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plansForOrder.map(plan => (
                  <tr key={plan.id} className="border-b hover:bg-slate-50">
                    <td className="p-2">{new Date(plan.date).toLocaleDateString()}</td>
                    <td className="p-2">{linesMap.get(plan.lineNumber)}</td>
                    <td className="p-2">{colorsMap.get(plan.colorId)}</td>
                    <td className="p-2 text-right font-mono">{plan.plannedQuantity.toLocaleString()}</td>
                    <td className="p-2">
                      <div className="flex justify-end items-center gap-2">
                        <button onClick={() => onEdit(plan)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-md" aria-label="Edit Plan">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(plan.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md" aria-label="Delete Plan">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-slate-500 py-10">No plans have been saved for this order yet.</p>
          )}
        </main>
      </div>
    </div>
  );
};