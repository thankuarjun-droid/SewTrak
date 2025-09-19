import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { XIcon, TrashIcon } from './IconComponents';

type Lap = 'pickup' | 'sewing' | 'trimAndDisposal';
const LAP_SEQUENCE: Lap[] = ['pickup', 'sewing', 'trimAndDisposal'];

interface Cycle {
    cycleNumber: number;
    pickupTime: number;
    sewingTime: number;
    trimAndDisposalTime: number;
    totalObservedTime: number;
    selected: boolean;
}

interface TimeCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (times: { pickup: number; sewing: number; trim: number }) => void;
    operationName: string;
}

const useLapStopwatch = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [currentLap, setCurrentLap] = useState<Lap | null>(null);
    const [lapTimes, setLapTimes] = useState<Partial<Record<Lap, number>>>({});
    const lapStartRef = useRef<number>(0);
    const timerRef = useRef<number | null>(null);
    const [displayTime, setDisplayTime] = useState(0);

    const start = useCallback(() => {
        setIsRunning(true);
        setCurrentLap(LAP_SEQUENCE[0]);
        lapStartRef.current = Date.now();
        if(timerRef.current) clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => setDisplayTime(Date.now() - lapStartRef.current), 50);
    }, []);

    const nextLap = useCallback(() => {
        if (!isRunning || !currentLap) return undefined;
        const now = Date.now();
        const lapDuration = (now - lapStartRef.current) / 1000;
        const newLapTimes = { ...lapTimes, [currentLap]: lapDuration };
        setLapTimes(newLapTimes);

        const nextLapIndex = LAP_SEQUENCE.indexOf(currentLap) + 1;
        if (nextLapIndex < LAP_SEQUENCE.length) {
            setCurrentLap(LAP_SEQUENCE[nextLapIndex]);
            lapStartRef.current = now;
            if(timerRef.current) clearInterval(timerRef.current);
            timerRef.current = window.setInterval(() => setDisplayTime(Date.now() - lapStartRef.current), 50);
            return undefined;
        } else {
            setIsRunning(false);
            setCurrentLap(null);
            if(timerRef.current) clearInterval(timerRef.current);
            setDisplayTime(0);
            return newLapTimes;
        }
    }, [isRunning, currentLap, lapTimes]);
    
    const reset = useCallback(() => {
        if(timerRef.current) clearInterval(timerRef.current);
        setIsRunning(false);
        setCurrentLap(null);
        setLapTimes({});
        setDisplayTime(0);
    }, []);

    useEffect(() => {
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    return { isRunning, currentLap, lapTimes, displayTime, start, nextLap, reset };
}

export const TimeCaptureModal = ({ isOpen, onClose, onSave, operationName }: TimeCaptureModalProps) => {
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const { isRunning, currentLap, lapTimes, displayTime, start, nextLap, reset } = useLapStopwatch();
    const [isNextCycleReady, setIsNextCycleReady] = useState(false);

    const handleMainButton = () => {
        if (!isRunning) {
            start();
            setIsNextCycleReady(false);
        } else {
            const finalLapTimes = nextLap();
            if (finalLapTimes) {
                const totalObserved = Object.values(finalLapTimes).reduce((sum, time) => sum + time, 0);
                const newCycle: Cycle = {
                    cycleNumber: cycles.length + 1,
                    pickupTime: finalLapTimes.pickup || 0,
                    sewingTime: finalLapTimes.sewing || 0,
                    trimAndDisposalTime: finalLapTimes.trimAndDisposal || 0,
                    totalObservedTime: totalObserved,
                    selected: true,
                };
                setCycles(prev => [...prev, newCycle]);
                reset();
                setIsNextCycleReady(true);
            }
        }
    };

    const handleSaveAndClose = () => {
        const selectedCycles = cycles.filter(c => c.selected);
        if (selectedCycles.length === 0) {
            alert("Please select at least one cycle to save.");
            return;
        }
        const avgPickup = selectedCycles.reduce((sum, c) => sum + c.pickupTime, 0) / selectedCycles.length;
        const avgSewing = selectedCycles.reduce((sum, c) => sum + c.sewingTime, 0) / selectedCycles.length;
        const avgTrim = selectedCycles.reduce((sum, c) => sum + c.trimAndDisposalTime, 0) / selectedCycles.length;
        onSave({ pickup: avgPickup, sewing: avgSewing, trim: avgTrim });
        onClose();
    };

    const handleCycleSelection = (cycleNumber: number) => {
        setCycles(prev => prev.map(c => c.cycleNumber === cycleNumber ? { ...c, selected: !c.selected } : c));
    };

    const handleDeleteCycle = (cycleNumber: number) => {
        setCycles(prev => prev.filter(c => c.cycleNumber !== cycleNumber).map((c, i) => ({ ...c, cycleNumber: i + 1 })));
    };

    const getButtonText = () => {
        if (!isRunning) return `Start Cycle ${cycles.length + 1}`;
        if (currentLap === 'pickup') return 'Lap (Pickup)';
        if (currentLap === 'sewing') return 'Lap (Sewing)';
        if (currentLap === 'trimAndDisposal') return 'Lap (Trim & Dispose)';
        return '...';
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Time Capture: {operationName}</h2>
                    <button onClick={onClose}><XIcon className="w-6 h-6"/></button>
                </header>
                <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                    {/* Stopwatch */}
                    <div className="flex flex-col justify-between items-center bg-slate-50 p-4 rounded-lg">
                         <div className="text-center">
                            <p className="text-lg font-medium text-slate-500">
                                {isRunning ? `Timing: ${currentLap}` : `Cycle #${cycles.length + 1}`}
                            </p>
                            <p className="font-mono text-7xl text-slate-800 tracking-tighter my-4">
                                {(displayTime / 1000).toFixed(2)}
                            </p>
                        </div>
                        <div className="w-full max-w-xs">
                            <button onClick={handleMainButton} className="w-full py-3 text-lg font-semibold text-white rounded-lg bg-[#2c4e8a] hover:bg-[#213a69]">
                                {getButtonText()}
                            </button>
                        </div>
                    </div>
                    {/* Cycles List */}
                    <div className="flex flex-col">
                        <h3 className="text-md font-semibold text-slate-800 mb-2">Captured Cycles</h3>
                        <div className="flex-1 overflow-y-auto border rounded-md">
                           <table className="w-full text-sm">
                               <thead className="bg-slate-100 sticky top-0"><tr className="text-left">
                                   <th className="p-2 w-8"></th>
                                   <th className="p-2">P</th>
                                   <th className="p-2">S</th>
                                   <th className="p-2">T&D</th>
                                   <th className="p-2">Total</th>
                                   <th className="p-2"></th>
                               </tr></thead>
                               <tbody>
                                   {cycles.map(c => (
                                       <tr key={c.cycleNumber} className={`border-t ${c.selected ? 'bg-indigo-50' : ''}`}>
                                           <td className="p-2"><input type="checkbox" checked={c.selected} onChange={() => handleCycleSelection(c.cycleNumber)} /></td>
                                           <td className="p-2 font-mono">{c.pickupTime.toFixed(2)}</td>
                                           <td className="p-2 font-mono">{c.sewingTime.toFixed(2)}</td>
                                           <td className="p-2 font-mono">{c.trimAndDisposalTime.toFixed(2)}</td>
                                           <td className="p-2 font-mono font-semibold">{c.totalObservedTime.toFixed(2)}</td>
                                           <td className="p-2"><button onClick={() => handleDeleteCycle(c.cycleNumber)}><TrashIcon className="w-4 h-4 text-red-400"/></button></td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                           {cycles.length === 0 && <p className="text-center text-slate-400 p-8">No cycles recorded yet.</p>}
                        </div>
                    </div>
                </main>
                 <footer className="flex-shrink-0 p-4 bg-slate-50 flex justify-end">
                     <button onClick={handleSaveAndClose} disabled={cycles.filter(c => c.selected).length === 0} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-slate-300">
                        Save Average & Close
                    </button>
                 </footer>
            </div>
        </div>
    );
};
