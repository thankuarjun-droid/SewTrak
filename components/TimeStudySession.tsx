import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Employee, AllowanceSettings, CycleRecord, TimeStudy, Machine } from '../types';
import { XIcon, TrashIcon } from './IconComponents';
import { PercentageBar } from './PercentageBar';

type Lap = 'pickup' | 'sewing' | 'trimAndDisposal';
const LAP_SEQUENCE: Lap[] = ['pickup', 'sewing', 'trimAndDisposal'];

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
        if (!isRunning || !currentLap) return;
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


interface TimeStudySessionProps {
    employee: Employee;
    operationName: string;
    operationId: string;
    styleId: string;
    machine: Machine;
    allowanceSettings: AllowanceSettings;
    onFinish: (study: Omit<TimeStudy, 'id' | 'timestamp'>, wasFreeStudy: boolean) => void;
    onCancel: () => void;
    wasFreeStudy: boolean;
}

export const TimeStudySession = ({ employee, operationName, operationId, styleId, machine, allowanceSettings, onFinish, onCancel, wasFreeStudy }: TimeStudySessionProps) => {
    const [cycles, setCycles] = useState<CycleRecord[]>([]);
    const { isRunning, currentLap, lapTimes, displayTime, start, nextLap, reset } = useLapStopwatch();
    const [isNextCycleReady, setIsNextCycleReady] = useState(false);

    const calculateStandardTime = (observedTime: number): number => {
        const { personalAndFatigue, bundle } = allowanceSettings;
        const machineAllowance = machine.allowance || 0;
        const totalAllowancePercent = personalAndFatigue + bundle + machineAllowance;
        const basicTime = observedTime; // Assuming 100% rating for now
        return basicTime * (1 + totalAllowancePercent / 100);
    };

    const handleMainButton = () => {
        if (!isRunning) {
            start();
            setIsNextCycleReady(false);
        } else {
            const finalLapTimes = nextLap();
            if (finalLapTimes) { // This means it was the last lap
                const totalObserved = Object.values(finalLapTimes).reduce((sum, time) => sum + time, 0);
                const standardTime = calculateStandardTime(totalObserved);
                const newCycle: CycleRecord = {
                    cycleNumber: cycles.length + 1,
                    pickupTime: finalLapTimes.pickup || 0,
                    sewingTime: finalLapTimes.sewing || 0,
                    trimAndDisposalTime: finalLapTimes.trimAndDisposal || 0,
                    totalObservedTime: totalObserved,
                    basicTime: totalObserved,
                    standardTime,
                    selected: true,
                };
                setCycles(prev => [...prev, newCycle]);
                reset();
                setIsNextCycleReady(true);
            }
        }
    };
    
    const selectedCycles = useMemo(() => cycles.filter(c => c.selected), [cycles]);

    const handleFinishStudy = () => {
        if(selectedCycles.length < 3) {
            alert("Please select at least 3 cycles before finishing the study.");
            return;
        }
        const totalObserved = selectedCycles.reduce((sum, c) => sum + c.totalObservedTime, 0);
        const totalStandard = selectedCycles.reduce((sum, c) => sum + c.standardTime, 0);
        
        const studyData: Omit<TimeStudy, 'id' | 'timestamp'> = {
            employeeId: employee.id,
            employeeGradeId: employee.operatorGradeId,
            operationId,
            styleId,
            machineId: machine.id,
            machineName: machine.name,
            cycles: cycles, // Save all cycles, including deselected ones
            averageObservedTime: totalObserved / selectedCycles.length,
            averageStandardTime: totalStandard / selectedCycles.length
        };
        onFinish(studyData, wasFreeStudy);
    };

    const getButtonText = () => {
        if (!isRunning) {
            if (isNextCycleReady) return `Start Next Cycle (${cycles.length + 1})`;
            return `Start Cycle ${cycles.length + 1}`;
        }
        if (currentLap === 'pickup') return 'Lap (Pickup)';
        if (currentLap === 'sewing') return 'Lap (Sewing)';
        if (currentLap === 'trimAndDisposal') return 'Lap (Trim & Dispose)';
        return '...';
    };

    const handleCycleSelection = (cycleNumber: number) => {
        setCycles(prev => prev.map(c => c.cycleNumber === cycleNumber ? { ...c, selected: !c.selected } : c));
    };

    const handleDeleteCycle = (cycleNumber: number) => {
        setCycles(prev => prev.filter(c => c.cycleNumber !== cycleNumber).map((c, i) => ({ ...c, cycleNumber: i + 1 })));
    };

    const averageSelectedTime = useMemo(() => {
        if (selectedCycles.length === 0) return 0;
        return selectedCycles.reduce((sum, c) => sum + c.totalObservedTime, 0) / selectedCycles.length;
    }, [selectedCycles]);

    const summaryData = useMemo(() => {
        if (selectedCycles.length === 0) return { avgObserved: 0, avgStandard: 0, capacity: 0 };
        const totalObserved = selectedCycles.reduce((sum, c) => sum + c.totalObservedTime, 0);
        const totalStandard = selectedCycles.reduce((sum, c) => sum + c.standardTime, 0);
        const avgObserved = totalObserved / selectedCycles.length;
        const avgStandard = totalStandard / selectedCycles.length;
        const capacity = avgStandard > 0 ? 3600 / avgStandard : 0;
        return { avgObserved, avgStandard, capacity };
    }, [selectedCycles]);
    
    const barChartData = useMemo(() => {
        if (selectedCycles.length === 0) return [];
        const avgPickup = selectedCycles.reduce((sum, c) => sum + c.pickupTime, 0) / selectedCycles.length;
        const avgSewing = selectedCycles.reduce((sum, c) => sum + c.sewingTime, 0) / selectedCycles.length;
        const avgTD = selectedCycles.reduce((sum, c) => sum + c.trimAndDisposalTime, 0) / selectedCycles.length;
        return [
            { label: 'Pickup', value: avgPickup, color: '#38bdf8' }, // sky-400
            { label: 'Sewing', value: avgSewing, color: '#3b82f6' }, // blue-500
            { label: 'Trim & Disposal', value: avgTD, color: '#f59e0b' }, // amber-500
        ];
    }, [selectedCycles]);

    return (
        <div className="fixed inset-0 bg-slate-100 z-50 p-4 sm:p-6 md:p-8 flex flex-col">
            <header className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{operationName}</h1>
                    <p className="text-slate-600 mt-1">Time Study for: <span className="font-semibold">{employee.name}</span></p>
                </div>
                <button onClick={onCancel} className="p-2 rounded-full text-slate-500 hover:bg-slate-200">
                    <XIcon className="w-6 h-6" />
                </button>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 flex-1 overflow-y-auto">
                {/* Stopwatch Section */}
                <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-between lg:col-span-2">
                    <div className="text-center">
                        <p className="text-lg font-medium text-slate-500">
                            {isRunning ? `Timing: ${currentLap}` : `Cycle #${cycles.length + 1}`}
                        </p>
                        <p className="font-mono text-8xl text-slate-800 tracking-tighter my-4">
                            {(displayTime / 1000).toFixed(2)}
                        </p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <button onClick={handleMainButton} className={`w-full max-w-xs py-4 text-xl font-semibold text-white rounded-lg shadow-md transition-colors ${isNextCycleReady ? 'bg-green-600 hover:bg-green-700' : 'bg-[#2c4e8a] hover:bg-[#213a69]'}`}>
                            {getButtonText()}
                        </button>
                         {isRunning && <button onClick={reset} className="text-sm text-slate-500 hover:text-slate-800">Cancel Cycle</button>}
                    </div>
                </div>
                {/* Results Table */}
                <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col lg:col-span-3">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Captured Cycles ({selectedCycles.length} selected)</h2>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="sticky top-0 bg-white">
                                <tr className="border-b">
                                    <th className="p-2 font-medium w-8"><input type="checkbox" className="hidden"/></th>
                                    <th className="p-2 font-medium">#</th>
                                    <th className="p-2 font-medium">Pick</th>
                                    <th className="p-2 font-medium">Sew</th>
                                    <th className="p-2 font-medium">T&D</th>
                                    <th className="p-2 font-medium">Observed</th>
                                    <th className="p-2 font-medium">Std.</th>
                                    <th className="p-2 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cycles.map(c => {
                                    const deviation = averageSelectedTime > 0 ? (c.totalObservedTime - averageSelectedTime) / averageSelectedTime : 0;
                                    const sentimentColor = deviation > 0.15 ? 'text-red-600' : deviation < -0.15 ? 'text-green-600' : 'text-slate-700';
                                    return (
                                        <tr key={c.cycleNumber} className={c.selected ? 'bg-slate-50' : ''}>
                                            <td className="p-2"><input type="checkbox" checked={c.selected} onChange={() => handleCycleSelection(c.cycleNumber)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"/></td>
                                            <td className="p-2 font-mono text-slate-500">{c.cycleNumber}</td>
                                            <td className="p-2 font-mono">{c.pickupTime.toFixed(2)}</td>
                                            <td className="p-2 font-mono">{c.sewingTime.toFixed(2)}</td>
                                            <td className="p-2 font-mono">{c.trimAndDisposalTime.toFixed(2)}</td>
                                            <td className={`p-2 font-mono font-semibold ${sentimentColor}`}>{c.totalObservedTime.toFixed(3)}</td>
                                            <td className="p-2 font-mono font-bold text-indigo-700">{c.standardTime.toFixed(3)}</td>
                                            <td className="p-2 text-center">
                                                <button onClick={() => handleDeleteCycle(c.cycleNumber)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {cycles.length === 0 && <p className="text-center py-8 text-slate-400 italic">Start the timer to begin capturing cycles.</p>}
                    </div>
                    {selectedCycles.length > 0 && (
                        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <div className="space-y-4">
                               <PercentageBar data={barChartData} />
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <div className="font-semibold text-slate-800">{summaryData.avgObserved.toFixed(3)}s</div>
                                        <div className="text-xs text-slate-500">Avg. Observed</div>
                                    </div>
                                     <div>
                                        <div className="font-semibold text-slate-800">{summaryData.avgStandard.toFixed(3)}s</div>
                                        <div className="text-xs text-slate-500">Avg. Standard</div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg text-indigo-600">{summaryData.capacity.toFixed(0)}</div>
                                        <div className="text-xs text-slate-500">Units/Hr</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <button onClick={handleFinishStudy} disabled={selectedCycles.length < 3} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-slate-300">
                                    Finish & Save Study
                                </button>
                                {selectedCycles.length < 3 && <p className="text-xs text-slate-500 mt-2">Select at least 3 cycles to finish.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};