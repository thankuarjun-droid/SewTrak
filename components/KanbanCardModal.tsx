
import React, { useState, useMemo, useEffect } from 'react';
import type { MasterDataItem, Order, KanbanEntry, Style, KanbanSettings, Line } from '../types';
import { FormField } from './FormField';
import { XIcon } from './IconComponents';

interface KanbanCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: KanbanEntry) => void;
    cardToEdit: KanbanEntry | null;
    lineId: string;
    lines: Line[];
    orders: Order[];
    styles: Style[];
    colors: MasterDataItem[];
    settings: KanbanSettings;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export const KanbanCardModal = ({ 
    isOpen, onClose, onSave, cardToEdit, lineId, lines, orders, styles, colors, settings 
}: KanbanCardModalProps) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [colorId, setColorId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [dcNumber, setDcNumber] = useState('');
  const [dcDate, setDcDate] = useState(getTodayString());
  
  const isEditing = useMemo(() => cardToEdit !== null, [cardToEdit]);
  const line = useMemo(() => lines.find(l => l.id === lineId), [lineId, lines]);
  const selectedOrder = useMemo(() => orders.find(o => o.id === orderNumber), [orderNumber, orders]);
  const stylesMap = useMemo(() => new Map(styles.map(s => [s.id, s.name])), [styles]);
  const colorsMap = useMemo(() => new Map(colors.map(c => [c.id, c.name])), [colors]);

  const availableColorsForOrder = useMemo(() => {
    if (!selectedOrder) return [];
    return selectedOrder.quantities.map(q => ({
      id: q.colorId,
      name: colorsMap.get(q.colorId) || 'Unknown Color',
    }));
  }, [selectedOrder, colorsMap]);
  
  useEffect(() => {
      if (cardToEdit) {
          setOrderNumber(cardToEdit.orderNumber);
          setColorId(cardToEdit.colorId);
          setQuantity(String(cardToEdit.quantity));
          setDcNumber(cardToEdit.dcNumber);
          setDcDate(cardToEdit.dcDate);
      } else {
          setOrderNumber('');
          setColorId('');
          setQuantity(String(settings.maxQuantityPerCard));
          setDcNumber('');
          setDcDate(getTodayString());
      }
  }, [cardToEdit, settings.maxQuantityPerCard]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!lineId || !orderNumber || !colorId || !qty || qty <= 0 || !dcNumber.trim() || !dcDate) {
      alert('Please fill out all fields.');
      return;
    }
    if (qty > settings.maxQuantityPerCard) {
        alert(`Quantity cannot exceed the KANBAN setting of ${settings.maxQuantityPerCard}.`);
        return;
    }

    const entryToSave: KanbanEntry = {
        id: cardToEdit?.id || `KAN-${Date.now()}`,
        timestamp: cardToEdit?.timestamp || new Date().toISOString(),
        lineNumber: lineId,
        orderNumber,
        colorId,
        quantity: qty,
        status: cardToEdit?.status || 'active',
        producedOnCard: cardToEdit?.producedOnCard || 0,
        dcNumber: dcNumber.trim(),
        dcDate,
    };

    onSave(entryToSave);
    onClose();
  };

  if (!isOpen || !line) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{isEditing ? 'Edit KANBAN Card' : 'Load New KANBAN Card'}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close modal"><XIcon className="w-6 h-6" /></button>
        </header>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className={`p-3 rounded-md text-center font-semibold text-slate-800 ${line.color}`}>
                Loading to: {line.name}
            </div>

            <FormField label="From Order" htmlFor="kanbanOrder">
                <select id="kanbanOrder" value={orderNumber} onChange={e => { setOrderNumber(e.target.value); setColorId(''); }} required className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm">
                    <option value="" disabled>Select an Order</option>
                    {orders.map(order => <option key={order.id} value={order.id}>{order.name}</option>)}
                </select>
            </FormField>

            {selectedOrder && <div className="text-sm text-slate-500 bg-slate-100 p-2 rounded-md text-center">Style: <span className="font-medium text-slate-700">{stylesMap.get(selectedOrder.styleId)}</span></div>}

            <FormField label="Color" htmlFor="kanbanColor">
                <select id="kanbanColor" value={colorId} onChange={e => setColorId(e.target.value)} required disabled={!orderNumber} className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm disabled:bg-slate-100">
                    <option value="" disabled>Select a Color</option>
                    {availableColorsForOrder.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </FormField>
            
            <FormField label={`Quantity on Card (Max: ${settings.maxQuantityPerCard})`} htmlFor="kanbanQuantity">
                <input type="number" id="kanbanQuantity" value={quantity} onChange={e => setQuantity(e.target.value)} required min="1" max={settings.maxQuantityPerCard} className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Cutting DC #" htmlFor="dcNumber">
                    <input type="text" id="dcNumber" value={dcNumber} onChange={e => setDcNumber(e.target.value)} required className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" />
                </FormField>
                <FormField label="DC Date" htmlFor="dcDate">
                    <input type="date" id="dcDate" value={dcDate} onChange={e => setDcDate(e.target.value)} required className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" />
                </FormField>
            </div>

            <footer className="flex justify-end pt-4">
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                    {isEditing ? 'Save Changes' : 'Load Card'}
                </button>
            </footer>
        </form>
      </div>
    </div>
  );
};