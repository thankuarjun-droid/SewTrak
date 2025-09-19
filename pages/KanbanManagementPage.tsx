import React, { useState, useMemo } from 'react';
import type { Order, KanbanEntry, Style, KanbanSettings, Line } from '../types';
import { KanbanCardModal } from '../components/KanbanCardModal';
import { PlusIcon, PencilIcon } from '../components/IconComponents';

interface KanbanManagementPageProps {
  lines: Line[];
  orders: Order[];
  styles: Style[];
  colors: { id: string, name: string }[];
  kanbanEntries: KanbanEntry[];
  kanbanSettings: KanbanSettings;
  onSaveKanbanEntry: (entry: KanbanEntry) => void;
}

const KanbanManagementPage = ({ lines, orders, styles, colors, kanbanEntries, kanbanSettings, onSaveKanbanEntry }: KanbanManagementPageProps) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanEntry | null>(null);
  const [modalLineId, setModalLineId] = useState<string | null>(null);

  const stylesMap = useMemo(() => new Map(styles.map(s => [s.id, s.name])), [styles]);
  const colorsMap = useMemo(() => new Map(colors.map(c => [c.id, c.name])), [colors]);

  const handleOpenEditModal = (card: KanbanEntry) => {
    setEditingCard(card);
    setModalLineId(card.lineNumber);
    setModalOpen(true);
  };
  
  const handleOpenNewModal = (lineId: string) => {
    setEditingCard(null);
    setModalLineId(lineId);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCard(null);
    setModalLineId(null);
  };

  return (
    <>
    <div className="p-4 sm:p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">KANBAN Management Board</h1>
        <p className="text-slate-600 mt-2">Manage the flow of work to each assembly line by loading and tracking KANBAN cards.</p>
      </header>

      <div className="space-y-10">
        {lines.map(line => {
            const activeCards = (kanbanEntries || []).filter(k => k.lineNumber === line.id && k.status === 'active');
            const emptySlotsCount = Math.max(0, kanbanSettings.maxActiveCardsPerLine - activeCards.length);
            const emptySlots = Array(emptySlotsCount).fill(0);
            
            return (
                <div key={line.id} className={`p-6 rounded-2xl shadow-lg ${line.color}`}>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">{line.name}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {activeCards.map(card => {
                            const order = orders.find(o => o.id === card.orderNumber);
                            const styleName = stylesMap.get(order?.styleId || '');
                            const colorName = colorsMap.get(card.colorId);
                            const progress = (card.producedOnCard / card.quantity) * 100;
                            return (
                                <div key={card.id} className="border border-slate-200 bg-white/70 backdrop-blur-sm rounded-lg p-4 space-y-3 relative overflow-hidden shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all" onClick={() => handleOpenEditModal(card)}>
                                    <div className="absolute top-0 left-0 h-full bg-green-500/20" style={{width: `${progress}%`, zIndex: 0}}></div>
                                    <div className="relative z-10">
                                        <p className="font-bold text-slate-800 flex items-center justify-between">
                                            <span>{order?.id}</span>
                                            <PencilIcon className="w-4 h-4 text-slate-400" />
                                        </p>
                                        <p className="text-sm text-slate-600">{styleName} - {colorName}</p>
                                        <p className="text-xs text-slate-500 font-mono">DC: {card.dcNumber || 'N/A'}</p>
                                        <div className="mt-4">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-sm font-medium text-slate-700">Progress</span>
                                                <span className="text-sm font-bold text-slate-800">{card.producedOnCard.toLocaleString()} / {card.quantity.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {emptySlots.map((_, index) => (
                           <div key={`empty-${index}`} className="border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center min-h-[170px]">
                                <button onClick={() => handleOpenNewModal(line.id)} className="flex flex-col items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors">
                                    <PlusIcon className="w-8 h-8"/>
                                    <span className="text-sm font-semibold">Load New Card</span>
                                </button>
                           </div>
                        ))}
                    </div>
                </div>
            )
        })}
      </div>
    </div>
    {isModalOpen && (
      <KanbanCardModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={onSaveKanbanEntry}
          cardToEdit={editingCard}
          lineId={modalLineId!}
          lines={lines}
          orders={orders}
          styles={styles}
          colors={colors}
          settings={kanbanSettings}
      />
    )}
    </>
  );
};

export default KanbanManagementPage;