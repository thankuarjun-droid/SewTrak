import React, { useState, useMemo } from 'react';
import type { KanbanEntry, Order, Style, Line, AqlInspection, NonConformanceReport } from '../types';

// AQL Level II, 2.5 Major, 4.0 Minor from a simplified table
const AQL_TABLE = [
    { lotMin: 2, lotMax: 8, sample: 2, maj: 0, min: 0 },
    { lotMin: 9, lotMax: 15, sample: 3, maj: 0, min: 0 },
    { lotMin: 16, lotMax: 25, sample: 5, maj: 0, min: 0 },
    { lotMin: 26, lotMax: 50, sample: 8, maj: 0, min: 1 },
    { lotMin: 51, lotMax: 90, sample: 13, maj: 1, min: 1 },
    { lotMin: 91, lotMax: 150, sample: 20, maj: 1, min: 2 },
    { lotMin: 151, lotMax: 280, sample: 32, maj: 2, min: 3 },
    { lotMin: 281, lotMax: 500, sample: 50, maj: 3, min: 5 },
    { lotMin: 501, lotMax: 1200, sample: 80, maj: 5, min: 7 },
    { lotMin: 1201, lotMax: 3200, sample: 125, maj: 7, min: 10 },
];

const getAqlParams = (lotSize: number) => {
    return AQL_TABLE.find(r => lotSize >= r.lotMin && lotSize <= r.lotMax) || AQL_TABLE[AQL_TABLE.length-1];
}

interface AqlInspectionPageProps {
  kanbanEntries: KanbanEntry[];
  inspections: AqlInspection[];
  orders: Order[];
  styles: Style[];
  lines: Line[];
  onSaveAql: (aql: AqlInspection) => void;
  onSaveNcReport: (nc: NonConformanceReport) => void; // To handle NC creation
}

const AqlInspectionPage = ({ kanbanEntries = [], inspections = [], orders = [], styles = [], lines = [], onSaveAql }: AqlInspectionPageProps) => {
  const [inspectingCard, setInspectingCard] = useState<KanbanEntry | null>(null);
  const [defectsFound, setDefectsFound] = useState({ major: 0, minor: 0 });
  const [result, setResult] = useState<'Pass' | 'Fail' | null>(null);

  const maps = useMemo(() => ({
    orders: new Map(orders.map(o => [o.id, o])),
    styles: new Map(styles.map(s => [s.id, s.name])),
    lines: new Map(lines.map(l => [l.id, l.name])),
  }), [orders, styles, lines]);
  
  const cardsToInspect = useMemo(() => (kanbanEntries || []).filter(k => k.status === 'closed' && !(inspections || []).some(i => i.kanbanCardId === k.id)), [kanbanEntries, inspections]);
  
  const aqlParams = useMemo(() => inspectingCard ? getAqlParams(inspectingCard.quantity) : null, [inspectingCard]);

  const handleStartInspection = (card: KanbanEntry) => {
    setInspectingCard(card);
    setDefectsFound({ major: 0, minor: 0 });
    setResult(null);
  }

  const handleCheckResult = () => {
    if (!aqlParams) return;
    const isPass = defectsFound.major <= aqlParams.maj && defectsFound.minor <= aqlParams.min;
    setResult(isPass ? 'Pass' : 'Fail');
  }

  const handleSave = () => {
    if (!inspectingCard || !aqlParams || !result) return;
    const newAql: AqlInspection = {
        id: `AQL-${inspectingCard.id}`,
        kanbanCardId: inspectingCard.id,
        timestamp: new Date().toISOString(),
        offeredQty: inspectingCard.quantity,
        sampleSize: aqlParams.sample,
        majorDefectsFound: defectsFound.major,
        minorDefectsFound: defectsFound.minor,
        result,
    };
    onSaveAql(newAql);
    setInspectingCard(null);
  }

  return (
    <>
      <div className="p-4 sm:p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">AQL Inspection</h1>
          <p className="text-slate-600 mt-2">Perform final AQL checks on completed KANBAN cards.</p>
        </header>

        <div className="bg-white p-4 rounded-xl shadow-md">
            <h2 className="font-semibold text-slate-800 mb-2">KANBAN Cards Ready for Inspection</h2>
            <div className="max-h-[70vh] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white"><tr className="border-b">
                        <th className="p-2 text-left">Line</th>
                        <th className="p-2 text-left">Order</th>
                        <th className="p-2 text-left">Quantity</th>
                        <th className="p-2 text-right">Action</th>
                    </tr></thead>
                    <tbody>
                        {cardsToInspect.map(card => (
                            <tr key={card.id} className="border-b hover:bg-slate-50">
                                <td className="p-2">{maps.lines.get(card.lineNumber)}</td>
                                <td className="p-2">{maps.orders.get(card.orderNumber)?.name}</td>
                                <td className="p-2">{card.quantity}</td>
                                <td className="p-2 text-right">
                                    <button onClick={() => handleStartInspection(card)} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">Inspect</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {cardsToInspect.length === 0 && <p className="text-center py-8 text-slate-400">No cards are ready for inspection.</p>}
            </div>
        </div>
      </div>

      {inspectingCard && aqlParams && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <header className="p-4 border-b">
                    <h2 className="font-semibold">AQL for KANBAN: {inspectingCard.id}</h2>
                    <p className="text-xs text-slate-500">Lot Size: {inspectingCard.quantity}, Sample Size: {aqlParams.sample}</p>
                </header>
                <main className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm">Major Defects Found</label>
                            <input type="number" value={defectsFound.major} onChange={e => setDefectsFound({...defectsFound, major: parseInt(e.target.value) || 0})} className="mt-1 w-full h-10 px-2 border-slate-300 rounded-md" />
                            <p className="text-xs text-slate-500 mt-1">Accept if &le; {aqlParams.maj}</p>
                        </div>
                         <div>
                            <label className="text-sm">Minor Defects Found</label>
                            <input type="number" value={defectsFound.minor} onChange={e => setDefectsFound({...defectsFound, minor: parseInt(e.target.value) || 0})} className="mt-1 w-full h-10 px-2 border-slate-300 rounded-md" />
                             <p className="text-xs text-slate-500 mt-1">Accept if &le; {aqlParams.min}</p>
                        </div>
                    </div>
                    {result && (
                        <div className={`p-4 text-center rounded-lg font-bold text-2xl ${result === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {result}
                        </div>
                    )}
                </main>
                <footer className="p-4 bg-slate-50 flex justify-between items-center">
                    <button onClick={() => setInspectingCard(null)} className="text-sm text-slate-600">Cancel</button>
                    {!result ? (
                         <button onClick={handleCheckResult} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md">Check Result</button>
                    ) : (
                         <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md">Save Inspection</button>
                    )}
                </footer>
            </div>
        </div>
      )}
    </>
  );
};

export default AqlInspectionPage;