import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { DailyLinePlan, Line, Order, Style, FactorySettings, Employee, LineAllocation, MasterDataItem, ProductionEntry, EndLineCheck, KanbanEntry, KanbanSettings, Defect } from '../types';
import { FormField } from './FormField';
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, ArrowDownIcon, XIcon, SparkleIcon } from './IconComponents';
import * as geminiService from '../services/geminiService';

type Manpower = { operators: number, helpers: number, checkers: number };
type PlanCell = {
  qty: number;
  efficiency: number;
  manpower: Manpower;
  target: number;
  colorPlans: Map<string, number>; // colorId -> qty
};

interface LinePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plans: DailyLinePlan[]) => void;
  onDelete: (planId: string) => void;
  initialData: {
    orderId: string;
    colorId?: string;
    plan?: DailyLinePlan | null
  };
  lines: Line[];
  orders: Order[];
  styles: Style[];
  dailyLinePlans: DailyLinePlan[];
  colors: MasterDataItem[];
  plannedQuantities: Map<string, number>;
  factorySettings: FactorySettings;
  employees: Employee[];
  lineAllocations: LineAllocation[];
  onViewExistingPlans: (orderId: string) => void;
  planColorMap: Map<string, string>;
  productionEntries: ProductionEntry[];
  endLineChecks: EndLineCheck[];
  defects: Defect[];
  kanbanEntries: KanbanEntry[];
  kanbanSettings: KanbanSettings;
}

const toUtcDate = (dateStr: string): Date => new Date(dateStr + 'T12:00:00Z');
const toYyyyMmDd = (date: Date): string => date.toISOString().split('T')[0];

const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
}

export const LinePlanModal = (props: LinePlanModalProps) => {
  const { 
      isOpen, onClose, onSave, onDelete, initialData, lines, orders, styles, 
      dailyLinePlans, colors, plannedQuantities, factorySettings, employees, lineAllocations,
      productionEntries, endLineChecks, kanbanEntries, kanbanSettings, defects
  } = props;

  const [mode, setMode] = useState<'manual' | 'ai'>(factorySettings.planningMode.toLowerCase() as 'manual' | 'ai');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  
  // Manual State
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [colorSequence, setColorSequence] = useState<{colorId: string, startDate: string}[]>([]);
  
  // AI State
  const [aiNumLines, setAiNumLines] = useState(2);
  const [aiUserRequest, setAiUserRequest] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<geminiService.AIPlanResponse | null>(null);

  // Common State
  const [plans, setPlans] = useState<Map<string, { [lineId: string]: PlanCell }>>(new Map());
  const [completionDate, setCompletionDate] = useState<Date | null>(null);

  const planTableContainerRef = useRef<HTMLDivElement>(null);

  const stylesMap = useMemo(() => new Map(styles.map(s => [s.id, s])), [styles]);
  const ordersMap = useMemo(() => new Map(orders.map(o => [o.id, o])), [orders]);
  const colorsMap = useMemo(() => new Map(colors.map(c => [c.id, c.name])), [colors]);
  
  const selectedOrder = ordersMap.get(orderId);
  const selectedStyle = selectedOrder ? stylesMap.get(selectedOrder.styleId) : null;
  
  const getStandardManpower = useCallback((style: Style | null | undefined): Manpower => {
    if (!style?.operationBulletin?.length) return { operators: 0, helpers: 0, checkers: 0 };
    const operators = style.operationBulletin.reduce((sum, op) => sum + (op.allocatedOperators || 1), 0);
    return { operators, helpers: Math.ceil(operators / 5), checkers: Math.ceil(operators / 10) };
  }, []);

  const totalSmv = useMemo(() => {
    if (!selectedStyle) return 0;
    return selectedStyle.operationBulletin.reduce((sum, op) => sum + op.pickupTime + op.sewingTime + op.trimAndDisposalTime, 0) / 60;
  }, [selectedStyle]);

  const resetState = useCallback(() => {
    setSelectedLines([]);
    setColorSequence([]);
    setPlans(new Map());
    setError('');
    setCompletionDate(null);
    setAiNumLines(2);
    setAiUserRequest('');
    setAiResponse(null);
  }, []);

  useEffect(() => {
    resetState();
    const currentOrderId = initialData.orderId;
    setOrderId(currentOrderId);

    const order = ordersMap.get(currentOrderId);
    if (order) {
        const todayStr = toYyyyMmDd(new Date());
        setColorSequence(order.quantities.map(q => ({ colorId: q.colorId, startDate: todayStr })));
    }

    const existingPlansForOrder = dailyLinePlans.filter(p => p.orderNumber === currentOrderId);
    if (existingPlansForOrder.length > 0) {
        const newPlansData = new Map<string, { [lineId: string]: PlanCell }>();
        const linesUsed = new Set<string>();
        let maxDate: Date | null = null;

        existingPlansForOrder.forEach(plan => {
            linesUsed.add(plan.lineNumber);
            const date = toUtcDate(plan.date);
            if (!maxDate || date > maxDate) {
                maxDate = date;
            }

            if (!newPlansData.has(plan.date)) newPlansData.set(plan.date, {});
            const dayPlans = newPlansData.get(plan.date)!;

            if (!dayPlans[plan.lineNumber]) {
                dayPlans[plan.lineNumber] = {
                    qty: 0,
                    efficiency: 0,
                    manpower: plan.plannedManpower,
                    target: 0,
                    colorPlans: new Map()
                };
            }
            const cell = dayPlans[plan.lineNumber];
            cell.qty += plan.plannedQuantity;
            cell.colorPlans.set(plan.colorId, (cell.colorPlans.get(plan.colorId) || 0) + plan.plannedQuantity);
        });
        
        const style = stylesMap.get(order?.styleId || '');
        if (style) {
             const sam = style.operationBulletin.reduce((sum, op) => sum + op.pickupTime + op.sewingTime + op.trimAndDisposalTime, 0) / 60;
             if (sam > 0) {
                 newPlansData.forEach(dayPlan => {
                    Object.values(dayPlan).forEach(lineData => {
                        lineData.efficiency = (lineData.qty * sam) / (lineData.manpower.operators * factorySettings.workingHoursPerDay * 60) * 100;
                        lineData.target = (lineData.manpower.operators * factorySettings.workingHoursPerDay * 60 * ((style.targetEfficiency || 85) / 100)) / sam;
                    });
                });
             }
        }
        
        setPlans(newPlansData);
        setSelectedLines(Array.from(linesUsed));
        setCompletionDate(maxDate);
    }
  }, [initialData, resetState, ordersMap, dailyLinePlans, stylesMap, factorySettings.workingHoursPerDay]);

  const planningSummary = useMemo(() => {
    if (!selectedOrder) return null;
    
    // This calculates remaining based on the global state, which is fine for display
    const remainingByColor = new Map<string, number>();
    selectedOrder.quantities.forEach(q => {
        const alreadyPlannedGlobally = plannedQuantities.get(`${orderId}-${q.colorId}`) || 0;
        remainingByColor.set(q.colorId, Math.max(0, q.quantity - alreadyPlannedGlobally));
    });

    return {
        totalOrderQty: selectedOrder.quantities.reduce((sum, q) => sum + q.quantity, 0),
        remainingByColor,
        totalRemaining: Array.from(remainingByColor.values()).reduce((s,q) => s + q, 0)
    };
  }, [selectedOrder, plannedQuantities, orderId]);

  const nextAvailableDates = useMemo(() => {
    const map = new Map<string, string>();
    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);

    lines.forEach(line => {
        const lastPlanDateStr = (dailyLinePlans || [])
            .filter(p => p.lineNumber === line.id)
            .map(p => p.date)
            .sort()
            .pop();

        let nextAvailableDate = new Date(today);

        if (lastPlanDateStr) {
            const lastPlanDate = toUtcDate(lastPlanDateStr);
            if (lastPlanDate >= today) {
                nextAvailableDate = new Date(lastPlanDate);
                nextAvailableDate.setUTCDate(nextAvailableDate.getUTCDate() + 1);
            }
        }
        
        while (nextAvailableDate.getUTCDay() === 0) { // Skip Sunday
            nextAvailableDate.setUTCDate(nextAvailableDate.getUTCDate() + 1);
        }
        
        map.set(line.id, toYyyyMmDd(nextAvailableDate));
    });
    return map;
  }, [lines, dailyLinePlans]);
  
  const handlePlanChange = (date: string, lineId:string, colorId: string, newQty: number) => {
    setPlans(prev => {
        const newPlans = new Map(prev);
        const dayData = newPlans.get(date);
        if(!dayData || !dayData[lineId]) return prev;

        const cellData = { ...dayData[lineId] };
        const newColorPlans = new Map(cellData.colorPlans);
        newColorPlans.set(colorId, newQty);
        
        const newTotalQty = Array.from(newColorPlans.values()).reduce((sum, q) => sum + q, 0);
        
        const manpower = cellData.manpower;
        let newEfficiency = 0;
        if(manpower.operators > 0 && totalSmv > 0) {
            newEfficiency = (newTotalQty * totalSmv) / (manpower.operators * factorySettings.workingHoursPerDay * 60) * 100;
        }

        const updatedDayData = { ...dayData };
        updatedDayData[lineId] = {
            ...cellData,
            qty: newTotalQty,
            efficiency: newEfficiency,
            colorPlans: newColorPlans,
        };
        
        // Check if the entire day is now empty
        const isDayEmpty = Object.values(updatedDayData).every(cell => cell.qty <= 0);
        
        if (isDayEmpty) {
            newPlans.delete(date);
        } else {
            newPlans.set(date, updatedDayData);
        }

        return newPlans;
    });
  };

  const handleManpowerChange = (date: string, lineId: string, type: keyof Manpower, value: number) => {
    setPlans(prev => {
        const newPlans = new Map(prev);
        const dayData = newPlans.get(date);
        if(!dayData || !dayData[lineId]) return prev;

        const cellData = { ...dayData[lineId] };
        const newManpower = { ...cellData.manpower, [type]: value };

        let newEfficiency = 0;
        if(newManpower.operators > 0 && totalSmv > 0) {
           newEfficiency = (cellData.qty * totalSmv) / (newManpower.operators * factorySettings.workingHoursPerDay * 60) * 100;
        }
        
        dayData[lineId] = {
            ...cellData,
            manpower: newManpower,
            efficiency: newEfficiency,
        };

        newPlans.set(date, { ...dayData });
        return newPlans;
    });
  };

  const handleGeneratePlan = () => {
    if (selectedLines.length === 0 || !selectedOrder || !selectedStyle) return;
    setError('');
    setAiResponse(null);
    
    // Clear previous plans before generating a new one
    setPlans(new Map());

    const manpower = getStandardManpower(selectedStyle);
    if (manpower.operators === 0 || totalSmv === 0) {
        setError("Cannot generate plan: Style must have operations with time values to calculate SAM.");
        return;
    }
    const targetEfficiency = selectedStyle.targetEfficiency || 85;
    const dailyCapacityPerLine = (manpower.operators * factorySettings.workingHoursPerDay * 60 * (targetEfficiency / 100)) / totalSmv;

    const fullQtyByColor = new Map<string, number>();
    selectedOrder.quantities.forEach(q => fullQtyByColor.set(q.colorId, q.quantity));
    
    let remainingQtyByColor = new Map(fullQtyByColor);
    const newPlansData = new Map<string, { [lineId: string]: PlanCell }>();
    let totalQtyToPlan = Array.from(fullQtyByColor.values()).reduce((s,q) => s + q, 0);
    let totalPlannedQty = 0;
    
    const startDates = selectedLines.map(lineId => toUtcDate(nextAvailableDates.get(lineId)!));
    let currentDate = new Date(Math.min(...startDates.map(d => d.getTime())));
    let lastPlanDate: Date | null = null;
    
    const lineDayCounters = new Map<string, number>(selectedLines.map(l => [l, 0]));
    let loopGuard = 0;

    while (totalPlannedQty < totalQtyToPlan - 0.001 && loopGuard < 365) {
        loopGuard++;
        if (currentDate.getUTCDay() !== 0) { // Skip Sunday
            for (const lineId of selectedLines) {
                if (currentDate < toUtcDate(nextAvailableDates.get(lineId)!)) continue;
                if (totalPlannedQty >= totalQtyToPlan - 0.001) continue;

                const dayCounter = lineDayCounters.get(lineId)!;
                const dateStr = toYyyyMmDd(currentDate);
                
                const colorPlans = new Map<string, number>();
                let plannedForDay = 0;

                for (const color of colorSequence) {
                    if (currentDate < toUtcDate(color.startDate)) continue;
                    
                    const remaining = remainingQtyByColor.get(color.colorId) || 0;
                    if (remaining > 0) {
                        const canPlan = dailyCapacityPerLine - plannedForDay;
                        const qtyToPlan = Math.min(remaining, canPlan);
                        
                        if (qtyToPlan > 0) {
                            colorPlans.set(color.colorId, (colorPlans.get(color.colorId) || 0) + qtyToPlan);
                            remainingQtyByColor.set(color.colorId, remaining - qtyToPlan);
                            totalPlannedQty += qtyToPlan;
                            plannedForDay += qtyToPlan;
                        }
                    }
                    if (plannedForDay >= dailyCapacityPerLine) break;
                }
                
                if (plannedForDay > 0) {
                    if (!newPlansData.has(dateStr)) newPlansData.set(dateStr, {});
                    const efficiency = (plannedForDay * totalSmv) / (manpower.operators * factorySettings.workingHoursPerDay * 60) * 100;
                    newPlansData.get(dateStr)![lineId] = { qty: Math.round(plannedForDay), efficiency, manpower, target: Math.round(dailyCapacityPerLine), colorPlans };
                    lastPlanDate = new Date(currentDate);
                }
                
                lineDayCounters.set(lineId, dayCounter + 1);
            }
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    // Clean up any trailing empty days that might have been created due to floating point inaccuracies
    const sortedDates = Array.from(newPlansData.keys()).sort();
    for (let i = sortedDates.length - 1; i >= 0; i--) {
        const date = sortedDates[i];
        const dayData = newPlansData.get(date);
        if (dayData && Object.values(dayData).every(cell => cell.qty <= 0)) {
            newPlansData.delete(date);
        } else {
            // First non-empty day from the end found, stop trimming
            break;
        }
    }

    const finalSortedDates = Array.from(newPlansData.keys()).sort();
    lastPlanDate = finalSortedDates.length > 0 ? toUtcDate(finalSortedDates[finalSortedDates.length - 1]) : null;

    setPlans(newPlansData);
    setCompletionDate(lastPlanDate);
  };
  
  const handleGenerateAiPlan = async () => {
    if (!planningSummary || !selectedOrder || !selectedStyle) {
      setError('Could not retrieve order details for AI planning.');
      return;
    }
    
    setIsAiLoading(true);
    setError('');
    setPlans(new Map());
    setAiResponse(null);

    try {
        const aiResponseData = await geminiService.getAIPlanSuggestion(
            selectedOrder,
            selectedStyle,
            lines,
            employees,
            lineAllocations,
            nextAvailableDates,
            planningSummary.remainingByColor,
            aiUserRequest || 'Generate an optimal plan.',
            colorSequence,
            aiNumLines,
            styles,
            productionEntries,
            endLineChecks,
            defects,
            kanbanEntries,
            kanbanSettings
        );
        
        setAiResponse(aiResponseData);

        if (aiResponseData.recommendations.length > 0) {
            // Pre-apply the first recommendation
            handleApplyAiPlan(aiResponseData.linesPlan);
        }

    } catch(err: any) {
        setError(`AI planning failed: ${err.message}`);
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleApplyAiPlan = (linesPlan: geminiService.AIPlanResponse['linesPlan']) => {
    if (!selectedStyle) return;

    const aiPlannedLines = linesPlan.map(lp => lp.lineId);
    setSelectedLines(aiPlannedLines);

    const manpower = getStandardManpower(selectedStyle);
    const targetEfficiency = selectedStyle.targetEfficiency || 85;
    const sam = totalSmv;

    const newPlansData = new Map<string, { [lineId: string]: PlanCell }>();
    let maxDate: Date | null = null;
    
    linesPlan.forEach(lineData => {
        lineData.plan.forEach(dayPlan => {
            const dateStr = dayPlan.date;
            const planDate = toUtcDate(dateStr);
            if (!maxDate || planDate > maxDate) {
                maxDate = planDate;
            }

            if (!newPlansData.has(dateStr)) {
                newPlansData.set(dateStr, {});
            }

            const dayPlans = newPlansData.get(dateStr)!;
            
            if (!dayPlans[lineData.lineId]) {
                 const target = sam > 0 ? (manpower.operators * factorySettings.workingHoursPerDay * 60 * (targetEfficiency / 100)) / sam : 0;
                 dayPlans[lineData.lineId] = { qty: 0, efficiency: 0, manpower, target, colorPlans: new Map() };
            }
            
            const cell = dayPlans[lineData.lineId];
            cell.qty += dayPlan.quantity;
            cell.colorPlans.set(dayPlan.colorId, (cell.colorPlans.get(dayPlan.colorId) || 0) + dayPlan.quantity);
        });
    });
    
    newPlansData.forEach(dayPlan => {
        Object.values(dayPlan).forEach(lineData => {
            if (sam > 0) {
                lineData.efficiency = (lineData.qty * sam) / (lineData.manpower.operators * factorySettings.workingHoursPerDay * 60) * 100;
            }
        });
    });
    
    setPlans(newPlansData);
    setCompletionDate(maxDate);
    // Auto-scroll to table
    setTimeout(() => {
        planTableContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const handleSavePlan = () => {
    if (!selectedOrder) return;
    const flatPlans: DailyLinePlan[] = [];
    const existingPlanIdsToDelete = dailyLinePlans.filter(p => p.orderNumber === orderId).map(p => p.id);

    // First, delete all existing plans for this order. We'll add back the new ones.
    // This simplifies update logic greatly.
    existingPlanIdsToDelete.forEach(id => onDelete(id));
    
    plans.forEach((dayData, date) => {
        Object.entries(dayData).forEach(([lineNumber, cellData]) => {
            cellData.colorPlans.forEach((quantity, colorId) => {
                if(Math.round(quantity) > 0) {
                    flatPlans.push({
                        id: '', // API will create ID
                        date,
                        lineNumber,
                        orderNumber: selectedOrder.id,
                        colorId,
                        plannedQuantity: Math.round(quantity),
                        plannedManpower: cellData.manpower
                    });
                }
            })
        });
    });
    
    onSave(flatPlans);
    onClose();
  };
  
    const handleLineToggle = (lineId: string) => {
        setSelectedLines(prev =>
            prev.includes(lineId) ? prev.filter(l => l !== lineId) : [...prev, lineId]
        );
    };

    const handleColorSequenceChange = (index: number, field: 'startDate', value: string) => {
        setColorSequence(prev => {
            const newSeq = [...prev];
            (newSeq[index] as any)[field] = value;
            return newSeq;
        });
    };

  if (!isOpen || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-7xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <header className="flex-shrink-0 p-4 border-b dark:border-slate-700 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Production Plan: {orderId}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedStyle?.name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => props.onViewExistingPlans(orderId)} className="text-sm font-semibold text-indigo-600">View Existing</button>
                    <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex text-sm">
                        <button onClick={() => setMode('manual')} className={`px-3 py-1 rounded-md ${mode === 'manual' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''}`}>Manual Plan</button>
                        <button onClick={() => setMode('ai')} className={`flex items-center gap-1 px-3 py-1 rounded-md ${mode === 'ai' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''}`}><SparkleIcon className="w-4 h-4 text-indigo-500"/> AI Suggestion</button>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-6 h-6"/></button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden">
                {/* Left Panel: Controls */}
                <div className="col-span-12 lg:col-span-3 overflow-y-auto pr-2 space-y-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Order Summary</h3>
                        {planningSummary && (
                            <div className="mt-2 text-xs space-y-1">
                                <div className="flex justify-between"><span>Total Order Qty:</span> <span className="font-semibold">{planningSummary.totalOrderQty.toLocaleString()}</span></div>
                                <div className="flex justify-between text-amber-600 dark:text-amber-400"><span>Total Remaining to Plan:</span> <span className="font-bold">{planningSummary.totalRemaining.toLocaleString()}</span></div>
                                <ul className="pt-1 mt-1 border-t dark:border-slate-600">
                                    {Array.from(planningSummary.remainingByColor.entries()).map(([colorId, qty]) => (
                                        <li key={colorId} className="flex justify-between"><span>{colorsMap.get(colorId)}:</span> <span>{qty.toLocaleString()}</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {mode === 'manual' && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Manual Planning Controls</h3>
                            <FormField label="Select Lines to Plan" htmlFor="lines-select">
                                <div className="max-h-32 overflow-y-auto space-y-1 p-2 border dark:border-slate-600 rounded-md bg-white dark:bg-slate-800">
                                    {lines.map(line => (
                                        <div key={line.id} className="flex items-center gap-2">
                                            <input type="checkbox" id={`line-${line.id}`} checked={selectedLines.includes(line.id)} onChange={() => handleLineToggle(line.id)} />
                                            <label htmlFor={`line-${line.id}`} className="text-xs">{line.name} (Next available: {nextAvailableDates.get(line.id)})</label>
                                        </div>
                                    ))}
                                </div>
                            </FormField>
                            <FormField label="Color Sequence & Start Dates" htmlFor="color-sequence">
                                <div className="space-y-2 text-xs">
                                {colorSequence.map((item, index) => (
                                    <div key={item.colorId} className="grid grid-cols-2 gap-2 items-center">
                                        <span className="font-medium">{colorsMap.get(item.colorId)}</span>
                                        <input type="date" value={item.startDate} onChange={e => handleColorSequenceChange(index, 'startDate', e.target.value)} className="h-8 px-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md text-xs"/>
                                    </div>
                                ))}
                                </div>
                            </FormField>
                            <button onClick={handleGeneratePlan} disabled={selectedLines.length === 0} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">Generate Manual Plan</button>
                        </div>
                    )}

                    {mode === 'ai' && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">AI Planning Controls</h3>
                            <FormField label="Number of Lines to Consider" htmlFor="ai-num-lines">
                                <input type="number" id="ai-num-lines" value={aiNumLines} onChange={e => setAiNumLines(parseInt(e.target.value, 10) || 1)} min="1" max={lines.length} className="w-full h-9 px-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md" />
                            </FormField>
                             <FormField label="Color Sequence & Start Dates" htmlFor="color-sequence-ai">
                                <div className="space-y-2 text-xs">
                                {colorSequence.map((item, index) => (
                                    <div key={item.colorId} className="grid grid-cols-2 gap-2 items-center">
                                        <span className="font-medium">{colorsMap.get(item.colorId)}</span>
                                        <input type="date" value={item.startDate} onChange={e => handleColorSequenceChange(index, 'startDate', e.target.value)} className="h-8 px-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md text-xs"/>
                                    </div>
                                ))}
                                </div>
                            </FormField>
                            <FormField label="User Request (Optional)" htmlFor="ai-request">
                                <textarea id="ai-request" value={aiUserRequest} onChange={e => setAiUserRequest(e.target.value)} rows={3} placeholder="e.g., prioritize lines with high efficiency on similar fabrics" className="w-full p-2 text-xs border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md" />
                            </FormField>
                            <button onClick={handleGenerateAiPlan} disabled={isAiLoading} className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center gap-2">
                                <SparkleIcon className="w-4 h-4" />
                                {isAiLoading ? 'Analyzing...' : 'Get AI Suggestion'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Panel: Plan Display */}
                <div ref={planTableContainerRef} className="col-span-12 lg:col-span-9 overflow-y-auto space-y-4">
                    {mode === 'ai' && aiResponse && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">AI Recommendations</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {aiResponse.recommendations.map((rec, index) => (
                                    <div key={rec.lineName} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-600">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100">{index + 1}. {rec.lineName}</h4>
                                            <span className={`text-xl font-bold ${getScoreColor(rec.recommendationScore)}`}>{rec.recommendationScore}<span className="text-sm">%</span></span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1 mb-3">"{rec.summary}"</p>
                                        <div className="space-y-1.5 text-xs">
                                            {rec.checklist.map(item => (
                                                <div key={item.factor} className="flex justify-between items-center" title={item.reason}>
                                                    <span className="text-slate-600 dark:text-slate-300">{item.factor}</span>
                                                    <span className={`font-semibold ${getScoreColor(item.score)}`}>{item.score}/100</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {plans.size > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Generated Production Plan</h3>
                             <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 dark:bg-slate-700">
                                            <th className="p-2 border dark:border-slate-600 font-semibold text-left">Date</th>
                                            {(selectedLines.length > 0 ? selectedLines : Array.from(new Set(aiResponse?.linesPlan.flatMap(l => l.lineId)))).map(lineId => (
                                                <th key={lineId} className="p-2 border dark:border-slate-600 font-semibold">{lines.find(l=>l.id===lineId)?.name}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from(plans.keys()).sort().map(date => (
                                            <tr key={date}>
                                                <td className="p-2 border dark:border-slate-600 font-semibold">{new Date(date + 'T12:00:00Z').toLocaleDateString()}</td>
                                                {(selectedLines.length > 0 ? selectedLines : Array.from(new Set(aiResponse?.linesPlan.flatMap(l => l.lineId)))).map(lineId => {
                                                    const cellData = plans.get(date)?.[lineId];
                                                    return (
                                                        <td key={lineId} className="p-1 border dark:border-slate-600 align-top text-xs">
                                                            {cellData ? (
                                                                <div className="space-y-1">
                                                                    {Array.from(cellData.colorPlans.entries()).map(([colorId, qty]) => (
                                                                        <div key={colorId} className="flex items-center justify-between gap-1">
                                                                            <label htmlFor={`qty-${date}-${lineId}-${colorId}`} className="truncate flex-shrink text-slate-600 dark:text-slate-300" title={colorsMap.get(colorId)}>{colorsMap.get(colorId)}:</label>
                                                                            <input 
                                                                                id={`qty-${date}-${lineId}-${colorId}`}
                                                                                type="number"
                                                                                value={Math.round(qty)}
                                                                                onChange={(e) => handlePlanChange(date, lineId, colorId, Number(e.target.value))}
                                                                                className="w-14 h-5 text-xs text-right border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 rounded shadow-sm focus:ring-1 focus:ring-indigo-500"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                    <div className="mt-1 pt-1 border-t dark:border-slate-600 flex items-center justify-around gap-1">
                                                                        <label htmlFor={`mp-op-${date}-${lineId}`} className="flex items-center gap-0.5">
                                                                            <span className="font-semibold">O:</span>
                                                                            <input 
                                                                                id={`mp-op-${date}-${lineId}`}
                                                                                type="number" 
                                                                                value={cellData.manpower.operators} 
                                                                                onChange={(e) => handleManpowerChange(date, lineId, 'operators', Number(e.target.value))} 
                                                                                className="w-9 h-5 text-xs text-center border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 rounded shadow-sm focus:ring-1 focus:ring-indigo-500"
                                                                            />
                                                                        </label>
                                                                        <label htmlFor={`mp-hp-${date}-${lineId}`} className="flex items-center gap-0.5">
                                                                            <span className="font-semibold">H:</span>
                                                                            <input 
                                                                                id={`mp-hp-${date}-${lineId}`}
                                                                                type="number" 
                                                                                value={cellData.manpower.helpers} 
                                                                                onChange={(e) => handleManpowerChange(date, lineId, 'helpers', Number(e.target.value))} 
                                                                                className="w-9 h-5 text-xs text-center border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 rounded shadow-sm focus:ring-1 focus:ring-indigo-500"
                                                                            />
                                                                        </label>
                                                                        <label htmlFor={`mp-ck-${date}-${lineId}`} className="flex items-center gap-0.5">
                                                                            <span className="font-semibold">C:</span>
                                                                            <input 
                                                                                id={`mp-ck-${date}-${lineId}`}
                                                                                type="number" 
                                                                                value={cellData.manpower.checkers} 
                                                                                onChange={(e) => handleManpowerChange(date, lineId, 'checkers', Number(e.target.value))} 
                                                                                className="w-9 h-5 text-xs text-center border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 rounded shadow-sm focus:ring-1 focus:ring-indigo-500"
                                                                            />
                                                                        </label>
                                                                    </div>
                                                                    <div className="text-[10px] text-center bg-slate-100 dark:bg-slate-700/80 p-1 rounded mt-1">
                                                                        Total: <strong className="text-slate-800 dark:text-slate-100">{Math.round(cellData.qty).toLocaleString()}</strong> | Eff: <strong className="text-slate-800 dark:text-slate-100">{cellData.efficiency > 0 ? cellData.efficiency.toFixed(0) : 0}%</strong>
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            
            {/* Footer */}
            <footer className="flex-shrink-0 p-4 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-700 flex justify-between items-center">
                 <div>
                    {completionDate && <p className="text-sm">Estimated Completion Date: <span className="font-semibold">{completionDate.toLocaleDateString()}</span></p>}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <button onClick={handleSavePlan} disabled={plans.size === 0} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-slate-300">
                    Save Plan
                </button>
            </footer>
        </div>
    </div>
  );
};
