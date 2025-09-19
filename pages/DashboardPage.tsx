import React, { useState, useMemo } from 'react';
import type { ProductionEntry, Order, Style, MasterDataItem, Employee, LineAllocation, OutputSettings, EndLineCheck, KpiSetting, Line } from '../types';
import GaugeChart from '../components/GaugeChart';
import { ChartBarIcon, ClockIcon, CalendarDaysIcon, ChartPieIcon } from '../components/IconComponents';
import { KpiDisplay } from '../components/KpiDisplay';


const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const adjustedToday = new Date(today.getTime() - (offset*60*1000));
    return adjustedToday.toISOString().split('T')[0];
}

const AllocatedStaffCard = ({ data }: { data: { operators: number; checkers: number; helpers: number } }) => (
    <div className="bg-white p-5 rounded-xl shadow-md h-full">
        <h3 className="text-sm font-medium text-slate-500 truncate">Allocated Staff (On Date)</h3>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center pt-2">
            <div>
                <p className="text-3xl font-semibold text-slate-900">{data.operators}</p>
                <p className="text-xs text-slate-500">Operators</p>
            </div>
            <div>
                <p className="text-3xl font-semibold text-slate-900">{data.checkers}</p>
                <p className="text-xs text-slate-500">Checkers</p>
            </div>
            <div>
                <p className="text-3xl font-semibold text-slate-900">{data.helpers}</p>
                <p className="text-xs text-slate-500">Helpers</p>
            </div>
        </div>
    </div>
);

interface DashboardPageProps {
    productionEntries: ProductionEntry[];
    orders: Order[];
    styles: Style[];
    lines: Line[];
    employees: Employee[];
    lineAllocations: LineAllocation[];
    outputSettings: OutputSettings;
    endLineChecks: EndLineCheck[];
    kpiSettings: KpiSetting[];
}

const DashboardPage = ({ productionEntries, orders, styles, lines, employees, lineAllocations, outputSettings, endLineChecks, kpiSettings }: DashboardPageProps) => {
  const [filterDate, setFilterDate] = useState(getTodayString());
  const [filterLine, setFilterLine] = useState('all');
  const [filterStyle, setFilterStyle] = useState('all');

  const stylesMap = useMemo(() => new Map(styles.map(s => [s.id, s])), [styles]);
  const employeesMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);
  
  const kpiMap = useMemo(() => new Map(kpiSettings.map(k => [k.kpi, k])), [kpiSettings]);
  const efficiencyKpi = kpiMap.get('Average Line Efficiency');
  const downtimeKpi = kpiMap.get('Downtime %');

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

  const selectedDayEntries = useMemo(() => {
    return (productionEntries || []).filter(e => e.timestamp.startsWith(filterDate));
  }, [productionEntries, filterDate]);
  
  const monthlyEntries = useMemo(() => {
    const selected = new Date(filterDate);
    const currentYear = selected.getFullYear();
    const currentMonth = selected.getMonth();
    return (productionEntries || []).filter(e => {
        const entryDate = new Date(e.timestamp);
        return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
    });
  }, [productionEntries, filterDate]);

  const filteredEntries = useMemo(() => {
    let entries = (productionEntries || []).filter(e => e.timestamp.startsWith(filterDate));

    if (filterLine !== 'all') {
      entries = entries.filter(e => e.lineNumber === filterLine);
    }

    if (filterStyle !== 'all') {
      entries = entries.filter(e => e.styleNumber === filterStyle);
    }
    
    return entries;
  }, [productionEntries, filterDate, filterLine, filterStyle]);
  
  const kpis = useMemo(() => {
    // Selected Day's KPIs
    let lineOutputToday = 0;
    if (outputSettings.source === 'endOfLine') {
        const todaysChecks = (endLineChecks || []).filter(e => e.timestamp.startsWith(filterDate));
        const passedCount = todaysChecks.filter(c => c.status === 'Pass').length;
        const repairedCount = todaysChecks.filter(c => c.status === 'Rework' && c.reworkStatus === 'completed').length;
        lineOutputToday = passedCount + repairedCount;
    } else {
        const finalProductEntriesToday = selectedDayEntries.filter(e => lastOperationIds.get(e.styleNumber) === e.operation);
        lineOutputToday = finalProductEntriesToday.reduce((sum, e) => sum + e.productionQuantity, 0);
    }

    const totalSmvProducedToday = selectedDayEntries.reduce((sum, entry) => {
        const style = stylesMap.get(entry.styleNumber);
        const op = style?.operationBulletin?.find(ob => ob.operationId === entry.operation);
        const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
        return sum + (smv * entry.productionQuantity);
    }, 0);
    
    const staffHoursMapToday = new Map<string, Set<number>>();
    selectedDayEntries.forEach(entry => {
        if (!staffHoursMapToday.has(entry.employeeId)) staffHoursMapToday.set(entry.employeeId, new Set());
        staffHoursMapToday.get(entry.employeeId)!.add(entry.hourCounter);
    });
    const totalAvailableMinutesToday = Array.from(staffHoursMapToday.values()).reduce((sum, hours) => sum + hours.size * 60, 0);
    // FIX: Use totalSmvProducedToday instead of totalSmvProduced.
    const efficiencyToday = totalAvailableMinutesToday > 0 ? (totalSmvProducedToday / totalAvailableMinutesToday) * 100 : 0;
    const totalDowntimeTodayNum = selectedDayEntries.reduce((sum, e) => sum + e.downTime, 0);
    const totalDowntimeToday = totalDowntimeTodayNum.toLocaleString();
    const downtimeReasonsToday = selectedDayEntries.reduce((acc, entry) => {
        if (entry.downTime > 0 && entry.downTimeReason) {
            acc[entry.downTimeReason] = (acc[entry.downTimeReason] || 0) + entry.downTime;
        }
        return acc;
    }, {} as Record<string, number>);

    // Monthly KPIs
    let lineOutputMonth = 0;
     if (outputSettings.source === 'endOfLine') {
        const selected = new Date(filterDate);
        const currentYear = selected.getFullYear();
        const currentMonth = selected.getMonth();
        const monthlyChecks = (endLineChecks || []).filter(e => {
            const entryDate = new Date(e.timestamp);
            return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
        });
        const passedCount = monthlyChecks.filter(c => c.status === 'Pass').length;
        const repairedCount = monthlyChecks.filter(c => c.status === 'Rework' && c.reworkStatus === 'completed').length;
        lineOutputMonth = passedCount + repairedCount;
     } else {
        const finalProductEntriesMonth = monthlyEntries.filter(e => lastOperationIds.get(e.styleNumber) === e.operation);
        lineOutputMonth = finalProductEntriesMonth.reduce((sum, e) => sum + e.productionQuantity, 0);
     }

    const totalSmvProducedMonth = monthlyEntries.reduce((sum, entry) => {
        const style = stylesMap.get(entry.styleNumber);
        const op = style?.operationBulletin?.find(ob => ob.operationId === entry.operation);
        const smv = op ? (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60 : 0;
        return sum + (smv * entry.productionQuantity);
    }, 0);

    const staffHoursMapMonth = new Map<string, Set<string>>();
    monthlyEntries.forEach(entry => {
        if (!staffHoursMapMonth.has(entry.employeeId)) staffHoursMapMonth.set(entry.employeeId, new Set());
        const dateHourKey = `${entry.timestamp.split('T')[0]}-${entry.hourCounter}`;
        staffHoursMapMonth.get(entry.employeeId)!.add(dateHourKey);
    });
    const totalAvailableMinutesMonth = Array.from(staffHoursMapMonth.values()).reduce((sum, hours) => sum + hours.size * 60, 0);
    // FIX: Use totalSmvProducedMonth instead of totalSmvProduced.
    const efficiencyMonth = totalAvailableMinutesMonth > 0 ? (totalSmvProducedMonth / totalAvailableMinutesMonth) * 100 : 0;

    return {
        lineOutputToday: lineOutputToday,
        efficiencyToday,
        totalDowntimeToday: totalDowntimeTodayNum,
        totalAvailableMinutesToday,
        downtimeReasonsToday: Object.entries(downtimeReasonsToday).sort((a,b) => b[1] - a[1]),
        lineOutputMonth: lineOutputMonth,
        efficiencyMonth: efficiencyMonth,
    };
  }, [selectedDayEntries, monthlyEntries, lastOperationIds, stylesMap, outputSettings, endLineChecks, filterDate]);

  const allocatedStaffData = useMemo(() => {
    const todaysAllocations = (lineAllocations || []).filter(a => a.lastUpdated.startsWith(filterDate));

    const allocatedStaffIds = new Set<string>();
    todaysAllocations.forEach(alloc => {
      (alloc.assignments || []).forEach(assign => {
        (assign.employeeIds || []).forEach(empId => allocatedStaffIds.add(empId));
      });
    });

    const staffCounts = { operators: 0, checkers: 0, helpers: 0 };
    allocatedStaffIds.forEach(empId => {
      const employee = employeesMap.get(empId);
      if (employee) {
        const designation = employee.designation.toLowerCase();
        if (designation.includes('operator')) staffCounts.operators++;
        else if (designation.includes('checker')) staffCounts.checkers++;
        else if (designation.includes('helper')) staffCounts.helpers++;
      }
    });
    return staffCounts;
  }, [lineAllocations, employeesMap, filterDate]);

  const lineChartData = useMemo(() => {
      const data = new Map<string, number>();
      lines.forEach(line => data.set(line.name, 0));

      if (outputSettings.source === 'endOfLine') {
          const relevantChecks = (endLineChecks || []).filter(c => {
             if(!c.timestamp.startsWith(filterDate)) return false;
             if(filterLine !== 'all' && c.lineNumber !== filterLine) return false;
             if(filterStyle !== 'all' && c.styleNumber !== filterStyle) return false;
             return true;
          });
          
          const passedChecks = relevantChecks.filter(c => c.status === 'Pass' || (c.status === 'Rework' && c.reworkStatus === 'completed'));
          
          passedChecks.forEach(check => {
              const lineName = lines.find(l => l.id === check.lineNumber)?.name || 'Unknown';
              data.set(lineName, (data.get(lineName) || 0) + 1);
          });
      } else {
        const finalProductEntries = filteredEntries.filter(e => lastOperationIds.get(e.styleNumber) === e.operation);
        finalProductEntries.forEach(entry => {
            const lineName = lines.find(l => l.id === entry.lineNumber)?.name || 'Unknown';
            data.set(lineName, (data.get(lineName) || 0) + entry.productionQuantity);
        });
      }
      return Array.from(data.entries());
  }, [filteredEntries, lines, lastOperationIds, outputSettings, endLineChecks, filterDate, filterLine, filterStyle]);
  
  const hourlyChartData = useMemo(() => {
      const data = new Map<number, number>();
      for (let i = 1; i <= 10; i++) data.set(i, 0);

      if (outputSettings.source === 'endOfLine') {
          // This is a bit tricky since endLineChecks don't have an hourCounter.
          // We can't do hourly chart for endOfLine. So I'll just keep the old logic for this chart.
          // This is a reasonable simplification.
      }

      const finalProductEntries = filteredEntries.filter(e => lastOperationIds.get(e.styleNumber) === e.operation);
      finalProductEntries.forEach(entry => {
          data.set(entry.hourCounter, (data.get(entry.hourCounter) || 0) + entry.productionQuantity);
      });
      return Array.from(data.entries()).sort((a,b) => a[0] - b[0]);
  }, [filteredEntries, lastOperationIds, outputSettings]);
  
  const orderStatusData = useMemo(() => {
      return orders.map(order => {
          const style = stylesMap.get(order.styleId);
          const orderedQty = order.quantities.reduce((sum, q) => sum + q.quantity, 0);
          
          let producedQty = 0;
          if (outputSettings.source === 'endOfLine') {
              const orderChecks = (endLineChecks || []).filter(c => c.orderNumber === order.id);
              const passedCount = orderChecks.filter(c => c.status === 'Pass').length;
              const repairedCount = orderChecks.filter(c => c.status === 'Rework' && c.reworkStatus === 'completed').length;
              producedQty = passedCount + repairedCount;
          } else {
              const lastOpId = lastOperationIds.get(order.styleId);
              if(lastOpId) {
                 producedQty = (productionEntries || [])
                    .filter(p => p.orderNumber === order.id && p.operation === lastOpId)
                    .reduce((sum, p) => sum + p.productionQuantity, 0);
              }
          }
          const progress = orderedQty > 0 ? (producedQty / orderedQty) * 100 : 0;
          return { ...order, styleName: style?.name || 'N/A', orderedQty, producedQty, progress };
      });
  }, [orders, productionEntries, endLineChecks, outputSettings, lastOperationIds, stylesMap]);

  const BarChart = ({ data, title, unit }: { data: [string, number][]; title: string; unit?: string; }) => {
    const maxValue = Math.max(...data.map(d => d[1]), 1);
    return (
        <div className="bg-white p-5 rounded-xl shadow-md h-full">
            <h3 className="text-sm font-medium text-slate-500 mb-4">{title}</h3>
            {data.length === 0 || data.every(d => d[1] === 0) ? (
                <div className="flex items-center justify-center h-48 text-sm text-slate-400">No data available</div>
            ) : (
                <div className="space-y-3">
                    {data.map(([label, value]) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className="w-32 text-xs text-slate-600 truncate text-right">{label}</div>
                            <div className="flex-1 bg-slate-100 rounded-full h-6">
                                <div className="bg-[#2c4e8a] h-6 rounded-full flex items-center justify-end px-2" style={{ width: `${(value / maxValue) * 100}%` }}>
                                    <span className="text-xs font-bold text-white">{value.toLocaleString()}{unit ? ` ${unit}` : ''}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  const LineChart = ({ data, title }: { data: [number, number][]; title: string; }) => {
    const maxValue = Math.max(...data.map(d => d[1]), 1);
    const points = data.map(([x, y], i) => `${(i / (data.length - 1)) * 100},${100 - (y / maxValue) * 100}`).join(' ');

    return (
        <div className="bg-white p-5 rounded-xl shadow-md h-full">
            <h3 className="text-sm font-medium text-slate-500 mb-4">{title}</h3>
             {data.every(d => d[1] === 0) ? (
                <div className="flex items-center justify-center h-48 text-sm text-slate-400">No data for this period</div>
            ) : (
                <div className="relative h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                        <polyline fill="none" stroke="#2c4e8a" strokeWidth="2" points={points} />
                    </svg>
                    <div className="absolute inset-0 flex justify-between">
                        {data.map(([label, _], i) => (
                            <div key={i} className="flex flex-col justify-end items-center h-full text-xs text-slate-400 pt-2" style={{width: `${100/data.length}%`}}>
                                <span>{`H${label}`}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
  };

  const totalDowntimePercent = kpis.totalAvailableMinutesToday > 0 ? (kpis.totalDowntimeToday / kpis.totalAvailableMinutesToday) * 100 : 0;
  const dateLabel = filterDate === getTodayString() ? 'Today' : 'On Date';

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8">
      <header className="mb-0">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">MD Dashboard</h1>
        <p className="text-slate-600 mt-2">A high-level overview of factory performance and resources.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiDisplay kpi={undefined} value={kpis.lineOutputToday} label={`Final Line Output (${dateLabel})`} unit="units" />
        <KpiDisplay kpi={downtimeKpi} value={totalDowntimePercent} label={`Total Downtime (${dateLabel})`} format="percent" />
        <KpiDisplay kpi={undefined} value={kpis.lineOutputMonth} label="This Month's Production" unit="units" />
        <KpiDisplay kpi={efficiencyKpi} value={kpis.efficiencyMonth} label="This Month Avg. OWE" format="percent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-md flex items-center justify-center min-h-[250px]">
            <GaugeChart value={kpis.efficiencyToday} label={`Overall Efficiency (${dateLabel})`} targetStart={efficiencyKpi?.targetStart} targetStretch={efficiencyKpi?.targetStretch} />
        </div>
        <div className="lg:col-span-2">
            <BarChart 
                data={kpis.downtimeReasonsToday} 
                title={`Top Downtime Reasons (${dateLabel})`} 
                unit="mins"
            />
        </div>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-200/50 p-4 rounded-xl">
        <div>
          <label htmlFor="dateFilter" className="block text-sm font-medium text-slate-700">Select Date</label>
          <input type="date" id="dateFilter" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="mt-1 block w-full pl-3 pr-2 py-2 h-10 text-base border-slate-300 focus:outline-none focus:ring-[#2c4e8a] focus:border-[#2c4e8a] sm:text-sm rounded-md" />
        </div>
        <div>
          <label htmlFor="lineFilter" className="block text-sm font-medium text-slate-700">Line</label>
          <select id="lineFilter" value={filterLine} onChange={e => setFilterLine(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 h-10 text-base border-slate-300 focus:outline-none focus:ring-[#2c4e8a] focus:border-[#2c4e8a] sm:text-sm rounded-md">
            <option value="all">All Lines</option>
            {lines.map(line => <option key={line.id} value={line.id}>{line.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="styleFilter" className="block text-sm font-medium text-slate-700">Style</label>
          <select id="styleFilter" value={filterStyle} onChange={e => setFilterStyle(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 h-10 text-base border-slate-300 focus:outline-none focus:ring-[#2c4e8a] focus:border-[#2c4e8a] sm:text-sm rounded-md">
            <option value="all">All Styles</option>
            {styles.map(style => <option key={style.id} value={style.id}>{style.name}</option>)}
          </select>
        </div>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AllocatedStaffCard data={allocatedStaffData} />
          <BarChart data={lineChartData} title="Line-wise Final Output"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <LineChart data={hourlyChartData} title="Hourly Final Output Trend" />
      </div>


      {/* Order Status Table */}
      <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold text-slate-800 p-3">Order Status</h3>
        <div className="max-h-[50vh] overflow-y-auto">
            {orderStatusData.length > 0 ? (
                <table className="w-full text-left">
                    <thead className="border-b border-slate-200 sticky top-0 bg-white">
                    <tr>
                        <th className="p-3 text-sm font-semibold text-slate-600">Order</th>
                        <th className="p-3 text-sm font-semibold text-slate-600 hidden md:table-cell">Style</th>
                        <th className="p-3 text-sm font-semibold text-slate-600 hidden md:table-cell">Customer</th>
                        <th className="p-3 text-sm font-semibold text-slate-600 text-right">Produced / Ordered</th>
                        <th className="p-3 text-sm font-semibold text-slate-600 w-1/4">Progress</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orderStatusData.map(order => (
                        <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 text-sm text-slate-800 font-medium">
                            {order.id}
                            <div className="text-xs text-slate-500 md:hidden">{order.styleName}</div>
                          </td>
                          <td className="p-3 text-sm text-slate-600 hidden md:table-cell">{order.styleName}</td>
                          <td className="p-3 text-sm text-slate-600 hidden md:table-cell">{order.customer}</td>
                          <td className="p-3 text-sm text-slate-800 font-mono text-right">{order.producedQty.toLocaleString()} / {order.orderedQty.toLocaleString()}</td>
                          <td className="p-3">
                              <div className="w-full bg-slate-200 rounded-full h-2.5">
                                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(order.progress, 100)}%` }}></div>
                              </div>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            ) : (
                 <p className="text-sm text-slate-500 italic text-center py-12">No orders to display.</p>
            )}
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;
