import React, { useState, useMemo } from 'react';
import type { Staff, PerformanceCycle, Objective, KeyResult } from '../../types';
import { PlusIcon } from '../IconComponents';
import { ObjectiveModal } from './ObjectiveModal';
import { KeyResultUpdateModal } from './KeyResultUpdateModal';

interface MyGoalsTabProps {
    currentUser: Staff;
    performanceCycles: PerformanceCycle[];
    objectives: Objective[];
    staff: Staff[];
    onSaveObjective: (objective: Objective) => void;
    onUpdateKeyResult: (keyResult: KeyResult) => void;
}

export const MyGoalsTab = ({ currentUser, performanceCycles, objectives, staff, onSaveObjective, onUpdateKeyResult }: MyGoalsTabProps) => {
    const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
    const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
    const [updatingKeyResult, setUpdatingKeyResult] = useState<KeyResult | null>(null);

    const activeCycle = useMemo(() => {
        return performanceCycles.find(c => c.status === 'Active') || performanceCycles[0];
    }, [performanceCycles]);

    const myObjectives = useMemo(() => {
        if (!activeCycle) return [];
        return (objectives || []).filter(o => o.ownerId === currentUser.id && o.cycleId === activeCycle.id);
    }, [objectives, currentUser, activeCycle]);
    
    const handleOpenNewObjective = () => {
        setEditingObjective(null);
        setIsObjectiveModalOpen(true);
    };

    const handleEditObjective = (objective: Objective) => {
        setEditingObjective(objective);
        setIsObjectiveModalOpen(true);
    };

    const calculateObjectiveProgress = (objective: Objective) => {
        if (objective.keyResults.length === 0) return 0;
        let totalProgress = 0;
        let totalWeight = 0;

        objective.keyResults.forEach(kr => {
            const range = kr.targetValue - kr.startValue;
            if (range !== 0) {
                const progress = ((kr.currentValue - kr.startValue) / range) * 100;
                totalProgress += Math.max(0, Math.min(100, progress)) * kr.weight;
                totalWeight += kr.weight;
            }
        });
        
        return totalWeight > 0 ? totalProgress / totalWeight : 0;
    };
    
    const formatKrValue = (kr: KeyResult, value: number) => {
        switch (kr.type) {
            case 'PERCENTAGE': return `${value.toFixed(1)}%`;
            case 'CURRENCY': return `₹${value.toLocaleString()}`;
            case 'NUMBER':
            default: return value.toLocaleString();
        }
    };
    
    if (!activeCycle) {
        return <div className="text-center p-8">No active performance cycle found.</div>;
    }

    return (
        <>
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{activeCycle.name}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(activeCycle.startDate).toLocaleDateString()} - {new Date(activeCycle.endDate).toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={handleOpenNewObjective} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                        <PlusIcon className="w-5 h-5"/> New Objective
                    </button>
                </div>

                <div className="space-y-6">
                    {myObjectives.map(obj => {
                        const progress = calculateObjectiveProgress(obj);
                        return (
                        <div key={obj.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border dark:border-slate-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{obj.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{obj.description}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400">{progress.toFixed(0)}%</span>
                                    <button onClick={() => handleEditObjective(obj)} className="text-xs font-medium text-slate-500 hover:text-slate-800">Edit</button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                            
                            <div className="mt-4 space-y-3">
                                {obj.keyResults.map(kr => {
                                    const krRange = kr.targetValue - kr.startValue;
                                    const krProgress = krRange !== 0 ? ((kr.currentValue - kr.startValue) / krRange) * 100 : 0;
                                    return (
                                        <div key={kr.id} onClick={() => setUpdatingKeyResult(kr)} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <div className="flex justify-between items-center text-sm">
                                                <p className="text-slate-700 dark:text-slate-300">{kr.description}</p>
                                                <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                                    {formatKrValue(kr, kr.currentValue)} / {formatKrValue(kr, kr.targetValue)}
                                                </p>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 mt-2">
                                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.max(0, Math.min(100, krProgress))}%` }}></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )})}
                </div>
            </div>

            {isObjectiveModalOpen && (
                <ObjectiveModal
                    isOpen={isObjectiveModalOpen}
                    onClose={() => setIsObjectiveModalOpen(false)}
                    onSave={onSaveObjective}
                    objectiveToEdit={editingObjective}
                    currentUser={currentUser}
                    activeCycleId={activeCycle.id}
                />
            )}
            
            {updatingKeyResult && (
                <KeyResultUpdateModal
                    isOpen={!!updatingKeyResult}
                    onClose={() => setUpdatingKeyResult(null)}
                    onSave={onUpdateKeyResult}
                    keyResult={updatingKeyResult}
                    formatValue={(kr, val) => formatKrValue(kr, val)}
                />
            )}
        </>
    );
};