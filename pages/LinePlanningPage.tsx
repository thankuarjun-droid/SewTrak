import React, { useState, useMemo, useRef } from 'react';
import type { DailyLinePlan, Line, Order, Style, ProductionEntry, LineAllocation, Employee, MasterDataItem, FactorySettings, EndLineCheck, OutputSettings, KanbanEntry, KanbanSettings, Defect } from '../types';
import { LinePlanModal } from '../components/LinePlanModal';
import { OrderPlanDetailModal } from '../components/OrderPlanDetailModal';
import { DayViewModal } from '../components/DayViewModal';
import { ExistingPlansModal } from '../components/ExistingPlansModal';
import { ArrowUpIcon, ArrowDownIcon } from '../components/IconComponents';

interface LinePlanningPageProps {
  dailyLinePlans: DailyLinePlan[];
  lines: Line[];
  orders: Order[];
  styles: Style[];
  colors: MasterDataItem[];
  productionEntries: ProductionEntry[];
  lineAllocations: LineAllocation[];
  employees: Employee[];
  factorySettings: FactorySettings;
  endLineChecks: EndLineCheck[];
  outputSettings: OutputSettings;
  onSavePlans: (plans: DailyLinePlan[]) => void;
  onDeletePlan: (planId: string) => void;
  // FIX: Add missing properties to be passed to LinePlanModal for AI suggestions.
  kanbanEntries: KanbanEntry[];
  kanbanSettings: KanbanSettings;
  defects: Defect[];
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const LinePlanningPage = (props: LinePlanningPageProps) => {
  const { dailyLinePlans, lines, orders, styles, colors, onSavePlans, onDeletePlan, factorySettings, productionEntries, endLineChecks, outputSettings, lineAllocations, employees } = props;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [modalState, setModalState] = useState<{ type: 'plan' | 'orderDetail' | 'dayView'; data: any } | null>(null);
  const [isExistingPlansModalOpen, setIsExistingPlansModalOpen] = useState(false);
  const [orderForExistingPlans, setOrderForExistingPlans] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fulfill' | 'planned'>('fulfill');

  const ordersListRef = useRef<HTMLDivElement>(null);

  const stylesMap = useMemo(() => new Map((styles || []).map(s => [s.id, s])), [styles]);
  const colorsMap = useMemo(() => new Map((colors || []).map(c => [c.id, c.name])), [colors]);
  
  const lastOperationIds = useMemo(() => {
    const map = new Map<string, string>();
    (styles || []).forEach(style => {
      if (style.operationBulletin && style.operationBulletin.length > 0) {
        const lastOp = style.operationBulletin.reduce((last, op) => op.sNo > last.sNo ? op : last, style.operationBulletin[0]);
        map.set(style.id, lastOp.operationId);
      }
    });
    return map;
  }, [styles]);
  
  const actualProductionMap = useMemo(() => {
    const map = new Map<string, number>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastPlans = (dailyLinePlans || []).filter(p => new Date(p.date) < today);

    for (const plan of pastPlans) {
        const key = `${plan.date}-${plan.lineNumber}`;
        if (map.has(key)) continue;

        let actualQty = 0;
        if (outputSettings.source === 'endOfLine') {
            actualQty = (endLineChecks || []).filter(c => 
                c.lineNumber === plan.lineNumber && 
                c.timestamp.startsWith(plan.date) && 
                (c.status === 'Pass' || c.reworkStatus === 'completed')
            ).length;
        } else {
            const order = (orders || []).find(o => o.id === plan.orderNumber);
            if (!order) continue;
            const lastOpId = lastOperationIds.get(order.styleId);
            if (!lastOpId) continue;
            
            actualQty = (productionEntries || [])
                .filter(p => 
                    p.lineNumber === plan.lineNumber && 
                    p.timestamp.startsWith(plan.date) && 
                    p.operation === lastOpId
                )
                .reduce((sum, p) => sum + p.productionQuantity, 0);
        }
        map.set(key, actualQty);
    }
    return map;
  }, [dailyLinePlans, outputSettings, endLineChecks, productionEntries, orders, lastOperationIds]);


  const plannedQuantities = useMemo(() => {
    const map = new Map<string, number>();
    (dailyLinePlans || []).forEach(plan => {
      const key = `${plan.orderNumber}-${plan.colorId}`;
      map.set(key, (map.get(key) || 0) + plan.plannedQuantity);
    });
    return map;
  }, [dailyLinePlans]);

  const ordersToFulfill = useMemo(() => {
    const ordersWithRemaining: any[] = [];
    (orders || []).forEach(order => {
        const totalOrderQty = order.quantities.reduce((sum, q) => sum + q.quantity, 0);
        const totalPlannedForOrder = order.quantities.reduce((sum, q) => {
            const key = `${order.id}-${q.colorId}`;
            return sum + (plannedQuantities.get(key) || 0);
        }, 0);

        if (totalPlannedForOrder < totalOrderQty) {
            const remainingDays = Math.ceil((new Date(order.deliveryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            ordersWithRemaining.push({
                ...order,
                totalPlanned: totalPlannedForOrder,
                totalQty: totalOrderQty,
                remainingDays: remainingDays > 0 ? remainingDays : 0,
            });
        }
    });
    return ordersWithRemaining.sort((a,b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
  }, [orders, plannedQuantities]);

  const plannedOrders = useMemo(() => {
    const plannedOrderIds = new Set((dailyLinePlans || []).map(p => p.orderNumber));
    const ordersWithPlans: any[] = [];

    plannedOrderIds.forEach(orderId => {
        const order = (orders || []).find(o => o.id === orderId);
        if (!order) return;

        const plansForThisOrder = (dailyLinePlans || []).filter(p => p.orderNumber === orderId);
        if (plansForThisOrder.length === 0) return;

        const totalOrderQty = order.quantities.reduce((sum, q) => sum + q.quantity, 0);
        const totalPlanned = plansForThisOrder.reduce((sum, p) => sum + p.plannedQuantity, 0);
        
        const dates = plansForThisOrder.map(p => new Date(p.date + 'T12:00:00Z'));
        const planStartDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const planEndDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        ordersWithPlans.push({
            ...order,
            totalPlanned,
            totalQty: totalOrderQty,
            planStartDate: planStartDate.toLocaleDateString(),
            planEndDate: planEndDate.toLocaleDateString(),
        });
    });

    return ordersWithPlans.sort((a,b) => new Date(a.planStartDate).getTime() - new Date(b.planStartDate).getTime());
  }, [dailyLinePlans, orders]);
  
  const handleEditOrderPlan = (orderId: string) => {
    setModalState({ type: 'plan', data: { orderId } });
  };
  
  const scrollOrderList = (direction: 'up' | 'down') => {
    if (ordersListRef.current) {
        ordersListRef.current.scrollBy({ top: direction === 'up' ? -200 : 200, behavior: 'smooth' });
    }
  }

  const handleWeekChange = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
        return newDate;
    });
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
      setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setDate(1); // Avoid month skipping issues
          newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
          return newDate;
      });
  };
  
    const planColorMap = useMemo(() => {
        const map = new Map<string, string>();
        const uniqueOrderColorPairs = [...new Set((dailyLinePlans || []).map(p => `${p.orderNumber}-${p.colorId}`))];
        
        const stringToHslColor = (str: string, s: number, l: number) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            const h = hash % 360;
            return `hsl(${h}, ${s}%, ${l}%)`;
        };

        uniqueOrderColorPairs.forEach(pair => {
            map.set(pair, stringToHslColor(pair, 70, 85)); 
        });
        return map;
    }, [dailyLinePlans]);

  const lineCapacitySummary = useMemo(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      
      const workingDaysInMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1)
        .map(day => new Date(year, month, day))
        .filter(date => date.getDay() !== 0).length;

      return (lines || []).map(line => {
          let bookedDays = 0;
          let totalOperators = 0;
          let totalHelpers = 0;
          let totalCheckers = 0;

          const monthPlans = (dailyLinePlans || []).filter(p => p.lineNumber === line.id && new Date(p.date).getMonth() === month && new Date(p.date).getFullYear() === year);

          const uniqueDays = new Set(monthPlans.map(p => p.date));
          bookedDays = uniqueDays.size;

          monthPlans.forEach(plan => {
              totalOperators += plan.plannedManpower.operators;
              totalHelpers += plan.plannedManpower.helpers;
              totalCheckers += plan.plannedManpower.checkers;
          });
          const totalPlans = monthPlans.length;
          return {
              lineName: line.name,
              bookedDays,
              availableDays: workingDaysInMonth - bookedDays,
              avgOperators: totalPlans > 0 ? (totalOperators / totalPlans).toFixed(1) : '0.0',
              avgHelpers: totalPlans > 0 ? (totalHelpers / totalPlans).toFixed(1) : '0.0',
              avgCheckers: totalPlans > 0 ? (totalCheckers / totalPlans).toFixed(1) : '0.0',
          }
      })
  }, [currentDate, dailyLinePlans, lines]);
  
  const handleViewExistingPlans = (orderId: string) => {
    setOrderForExistingPlans(orderId);
    setIsExistingPlansModalOpen(true);
  };
  
  const handleEditFromExisting = (plan: DailyLinePlan) => {
    setIsExistingPlansModalOpen(false);
    setTimeout(() => {
        setModalState({ type: 'plan', data: { plan, lineId: plan.lineNumber, date: plan.date, orderId: plan.orderNumber } });
    }, 100);
  };

  const renderSchedule = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    today.setHours(0,0,0,0);
    const offset = today.getTimezoneOffset();
    const adjustedToday = new Date(today.getTime() - (offset * 60 * 1000));
    const todayStr = adjustedToday.toISOString().split('T')[0];

    if (viewMode === 'monthly') {
        const daysInMonth = getDaysInMonth(year, month);
        let firstDayIndex = getFirstDayOfMonth(year, month); // 0=Sun, 1=Mon...
        firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0=Mon, 1=Tue...

        const blanks = Array(firstDayIndex).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        return (
             <div className="grid grid-cols-7 border-t border-l border-slate-200 dark:border-slate-700">
                {weekDays.map(day => <div key={day} className="text-center p-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border-r border-b dark:border-slate-700">{day}</div>)}
                {blanks.map((_, i) => <div key={`blank-${i}`} className="h-28 border-r border-b bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700"></div>)}
                {days.map(day => {
                    const date = new Date(year, month, day);
                    const isSunday = date.getDay() === 0;
                    const dayOffset = date.getTimezoneOffset();
                    const adjustedDate = new Date(date.getTime() - (dayOffset * 60 * 1000));
                    const dateStr = adjustedDate.toISOString().split('T')[0];
                    const isToday = dateStr === todayStr;
                    const isPast = new Date(dateStr) < new Date(todayStr);
                    const plansForDay = (dailyLinePlans || []).filter(p => p.date === dateStr);
                    
                    let adherenceIndicator: string | null = null;
                    if (isPast && plansForDay.length > 0) {
                        let totalPlanned = 0;
                        let totalActual = 0;
                        plansForDay.forEach(plan => {
                            const actual = actualProductionMap.get(`${plan.date}-${plan.lineNumber}`) ?? 0;
                            totalPlanned += plan.plannedQuantity;
                            totalActual += actual;
                        });
                        if (totalPlanned > 0) {
                            const avgAdherence = (totalActual / totalPlanned) * 100;
                            if (avgAdherence >= 95) adherenceIndicator = 'bg-green-500';
                            else if (avgAdherence >= 80) adherenceIndicator = 'bg-amber-500';
                            else adherenceIndicator = 'bg-red-500';
                        }
                    }
                    
                    return (
                        <div key={day} className={`h-28 border-r border-b dark:border-slate-700 relative p-1 text-xs overflow-hidden ${isSunday ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-sky-50 dark:hover:bg-sky-900/50 cursor-pointer'}`}
                             onClick={() => !isSunday && setModalState({ type: 'dayView', data: { dateStr }})}
                        >
                            <div className={`font-semibold rounded-full w-5 h-5 flex items-center justify-center ${isToday ? 'bg-sky-500 text-white' : (isSunday ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300')}`}>{day}</div>
                            {adherenceIndicator && <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${adherenceIndicator}`} title="Daily Performance Indicator"></div>}
                             <div className="flex flex-wrap gap-1 mt-1">
                                {plansForDay.map(plan => {
                                    const color = planColorMap.get(`${plan.orderNumber}-${plan.colorId}`) || '#E5E7EB';
                                    const order = (orders || []).find(o => o.id === plan.orderNumber);
                                    const colorName = colorsMap.get(plan.colorId);
                                    return <div key={plan.id} className="h-2 w-full rounded-full" style={{ backgroundColor: color }} title={`${(lines || []).find(l=>l.id===plan.lineNumber)?.name}: ${order?.id} - ${colorName}`}></div>
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        );
    } else { // Weekly view
        const startOfWeek = new Date(currentDate);
        const dayOfWeek = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        
        const weekDates = Array.from({length: 7}, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            return d;
        });
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const todayStr = today.toISOString().split('T')[0];

        return (
            <div className="border-t border-l border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-8 sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <div className="border-r border-b dark:border-slate-700 p-2 font-semibold text-slate-700 dark:text-slate-200">Line</div>
                    {weekDates.map(date => {
                         const dateOffset = date.getTimezoneOffset();
                         const adjustedDate = new Date(date.getTime() - (dateOffset * 60 * 1000));
                         const dateStr = adjustedDate.toISOString().split('T')[0];
                         const isToday = dateStr === todayStr;
                         return (
                            <div key={date.toISOString()} className={`border-r border-b dark:border-slate-700 p-2 text-center font-semibold ${isToday ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                {date.toLocaleDateString(undefined, { weekday: 'short' })}
                                <span className="block font-normal">{date.getDate()}</span>
                            </div>
                        )}
                    )}
                </div>
                {(lines || []).map(line => (
                    <div key={line.id} className="grid grid-cols-8">
                        <div className="border-r border-b dark:border-slate-700 p-2 font-semibold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800">{line.name}</div>
                        {weekDates.map(date => {
                            const dateOffset = date.getTimezoneOffset();
                            const adjustedDate = new Date(date.getTime() - (dateOffset * 60 * 1000));
                            const dateStr = adjustedDate.toISOString().split('T')[0];
                            const plan = (dailyLinePlans || []).find(p => p.lineNumber === line.id && p.date === dateStr);
                            const order = plan ? (orders || []).find(o => o.id === plan.orderNumber) : null;
                            const style = order ? stylesMap.get(order.styleId) : null;
                            const colorName = plan ? colorsMap.get(plan.colorId) : '';
                            const isSunday = date.getDay() === 0;
                            const isPast = date < today;
                            const planColor = plan ? planColorMap.get(`${plan.orderNumber}-${plan.colorId}`) : 'transparent';
                            
                            let actualQty: number | undefined;
                            let adherence: number | undefined;

                            if (plan && isPast) {
                                actualQty = actualProductionMap.get(`${dateStr}-${line.id}`) ?? 0;
                                adherence = plan.plannedQuantity > 0 ? (actualQty / plan.plannedQuantity) * 100 : 0;
                            }

                            return (
                                <div 
                                    key={date.toISOString()} 
                                    className={`border-r border-b dark:border-slate-700 p-2 min-h-[96px] ${isSunday ? 'bg-slate-100 dark:bg-slate-800' : 'hover:opacity-80 cursor-pointer'}`}
                                    style={{ backgroundColor: plan ? planColor : (isSunday ? '' : '#F9FAFB') }}
                                    onClick={() => !isSunday && setModalState({ type: 'dayView', data: { dateStr }})}
                                >
                                    {plan && order && (
                                        <div className="text-xs">
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{order.id} - {colorName}</p>
                                            <p className="text-slate-600 dark:text-slate-400 truncate">{style?.name}</p>
                                            <p className="font-semibold text-slate-900 dark:text-slate-50 mt-1">Plan: {plan.plannedQuantity.toLocaleString()}</p>
                                            {actualQty !== undefined && adherence !== undefined && (
                                                <div className="mt-1">
                                                    <p className="font-semibold text-slate-900 dark:text-slate-50">Actual: {actualQty.toLocaleString()}</p>
                                                    <p className={`font-bold ${adherence >= 95 ? 'text-green-600' : adherence >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                                                        Adherence: {adherence.toFixed(0)}%
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        )
    }
  };

  const getWeekRangeDisplay = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startOfWeek.toLocaleDateString(undefined, options)} - ${endOfWeek.toLocaleDateString(undefined, {...options, year: 'numeric'})}`;
  };
  
  return (
    <>
      <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900">
        <main className="grid grid-cols-12 gap-4 flex-1 overflow-hidden p-4">
            <div className="col-span-12 lg:col-span-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col">
                <div className="flex-shrink-0 flex items-center justify-between">
                    <div className="flex border-b mb-2 -mx-4 px-4">
                        <button onClick={() => setActiveTab('fulfill')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'fulfill' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 dark:text-slate-400'}`}>
                            To Fulfill <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-1.5 py-0.5 rounded-full">{ordersToFulfill.length}</span>
                        </button>
                        <button onClick={() => setActiveTab('planned')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'planned' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 dark:text-slate-400'}`}>
                            Planned <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-1.5 py-0.5 rounded-full">{plannedOrders.length}</span>
                        </button>
                    </div>
                     <div className="flex gap-1">
                        <button onClick={() => scrollOrderList('up')} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><ArrowUpIcon className="w-4 h-4 text-slate-600 dark:text-slate-400"/></button>
                        <button onClick={() => scrollOrderList('down')} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><ArrowDownIcon className="w-4 h-4 text-slate-600 dark:text-slate-400"/></button>
                    </div>
                </div>
                <div ref={ordersListRef} className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {activeTab === 'fulfill' ? (
                        <>
                            {ordersToFulfill.map(order => (
                                <div key={order.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{order.id}</p>
                                        <p className={`text-xs font-semibold px-2 py-0.5 rounded-full ${order.remainingDays < 7 ? 'bg-red-100 text-red-600' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>{order.remainingDays} days left</p>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{stylesMap.get(order.styleId)?.name}</p>
                                    <div className="flex justify-between items-end text-xs mt-2 pt-2 border-t dark:border-slate-600">
                                        <div>
                                            <p>Total Qty: <span className="font-semibold">{order.totalQty.toLocaleString()}</span></p>
                                            <p>Delivery: <span className="font-semibold">{new Date(order.deliveryDate).toLocaleDateString()}</span></p>
                                        </div>
                                        <button onClick={() => setModalState({ type: 'orderDetail', data: { orderId: order.id } })} className="px-3 py-1 bg-[#2c4e8a] text-white text-xs font-semibold rounded-md hover:bg-[#213a69]">
                                            Plan
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {ordersToFulfill.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-10">All orders are fully planned!</p>}
                        </>
                    ) : (
                        <>
                            {plannedOrders.map(order => (
                                <div key={order.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{order.id}</p>
                                        <p className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-600">Planned</p>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{stylesMap.get(order.styleId)?.name}</p>
                                    <div className="text-xs mt-2 pt-2 border-t dark:border-slate-600">
                                        <div className="flex justify-between"><span>Planned Qty:</span><span className="font-semibold">{order.totalPlanned.toLocaleString()} / {order.totalQty.toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span>Plan Dates:</span><span className="font-semibold">{order.planStartDate} - {order.planEndDate}</span></div>
                                    </div>
                                    <div className="text-right mt-2">
                                        <button onClick={() => handleEditOrderPlan(order.id)} className="px-3 py-1 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-100">
                                            Edit Plan
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {plannedOrders.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-10">No orders have been planned yet.</p>}
                        </>
                    )}
                </div>
            </div>

            <div className="col-span-12 lg:col-span-9 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        {viewMode === 'monthly' ? ( <>
                                <button onClick={() => handleMonthChange('prev')} className="px-3 py-1 text-sm bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-md">&larr;</button>
                                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 w-48 text-center">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                                <button onClick={() => handleMonthChange('next')} className="px-3 py-1 text-sm bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-md">&rarr;</button>
                            </>
                        ) : ( <>
                                <button onClick={() => handleWeekChange('prev')} className="px-3 py-1 text-sm bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-md">&larr; Week</button>
                                <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 min-w-48 text-center">{getWeekRangeDisplay()}</h2>
                                <button onClick={() => handleWeekChange('next')} className="px-3 py-1 text-sm bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-md">Week &rarr;</button>
                            </>
                        )}
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex text-sm">
                        <button onClick={() => setViewMode('monthly')} className={`px-3 py-1 rounded-md ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''}`}>Monthly</button>
                        <button onClick={() => setViewMode('weekly')} className={`px-3 py-1 rounded-md ${viewMode === 'weekly' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''}`}>Weekly</button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto">{renderSchedule()}</div>
                <div className="flex-shrink-0 pt-2 mt-2 border-t dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Line Capacity Summary ({currentDate.toLocaleString('default', { month: 'long' })})</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead><tr className="bg-slate-100 dark:bg-slate-700/50">
                                <th className="p-1 font-semibold text-left">Line</th>
                                <th className="p-1 font-semibold text-center">Booked</th>
                                <th className="p-1 font-semibold text-center">Available</th>
                                <th className="p-1 font-semibold text-center">Avg Manpower (O/H/C)</th>
                            </tr></thead>
                            <tbody>{lineCapacitySummary.map(s => (
                                <tr key={s.lineName} className="border-b dark:border-slate-700">
                                    <td className="p-1 font-bold">{s.lineName}</td>
                                    <td className="p-1 text-center">{s.bookedDays}</td>
                                    <td className="p-1 text-center">{s.availableDays}</td>
                                    <td className="p-1 text-center font-mono">{s.avgOperators}/{s.avgHelpers}/{s.avgCheckers}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
      </div>

      {modalState?.type === 'plan' && (
          <LinePlanModal
            isOpen={true}
            onClose={() => setModalState(null)}
            initialData={modalState.data}
            onViewExistingPlans={handleViewExistingPlans}
            {...props}
            employees={employees}
            lineAllocations={lineAllocations}
            onSave={onSavePlans}
            onDelete={onDeletePlan}
            plannedQuantities={plannedQuantities}
            planColorMap={planColorMap}
          />
      )}
      {modalState?.type === 'orderDetail' && (
        <OrderPlanDetailModal
            isOpen={true}
            onClose={() => setModalState(null)}
            order={orders.find(o => o.id === modalState.data.orderId)!}
            stylesMap={stylesMap}
            colorsMap={new Map(colors.map(c => [c.id, c.name]))}
            plannedQuantities={plannedQuantities}
            onStartPlanWithColor={(data) => {
                setModalState(null);
                setTimeout(() => setModalState({ type: 'plan', data }), 100);
            }}
            onPlanFullOrder={(orderId) => {
                setModalState(null);
                setTimeout(() => setModalState({ type: 'plan', data: { orderId } }), 100);
            }}
        />
      )}
      {modalState?.type === 'dayView' && (
          <DayViewModal
            isOpen={true}
            onClose={() => setModalState(null)}
            dateStr={modalState.data.dateStr}
            lines={lines}
            dailyLinePlans={dailyLinePlans}
            orders={orders}
            stylesMap={stylesMap}
            colorsMap={colorsMap}
            planColorMap={planColorMap}
            onEditPlan={(plan) => setModalState({ type: 'plan', data: { plan, lineId: plan.lineNumber, date: plan.date }})}
            onAddNewPlan={(data) => setModalState({ type: 'plan', data })}
          />
      )}
      {isExistingPlansModalOpen && orderForExistingPlans && (
        <ExistingPlansModal
            isOpen={isExistingPlansModalOpen}
            onClose={() => setIsExistingPlansModalOpen(false)}
            orderId={orderForExistingPlans}
            dailyLinePlans={dailyLinePlans}
            lines={lines}
            colorsMap={colorsMap}
            onEdit={handleEditFromExisting}
            onDelete={onDeletePlan}
        />
      )}
    </>
  );
};

export default LinePlanningPage;