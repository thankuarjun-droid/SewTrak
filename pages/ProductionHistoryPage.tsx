
import React, { useState, useMemo } from 'react';
import type { ProductionEntry, MasterDataItem, Order, Style, Employee } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from '../components/IconComponents';
import { downloadCsv } from '../services/exportService';

interface ProductionHistoryPageProps {
  productionEntries: ProductionEntry[];
  lines: MasterDataItem[];
  orders: Order[];
  styles: Style[];
  colors: MasterDataItem[];
  employees: Employee[];
  operations: MasterDataItem[];
}

interface ProcessedProductionEntry extends ProductionEntry {
    employeeName: string;
}

type SortKey = 'timestamp' | 'lineNumber' | 'orderNumber' | 'employeeName' | 'productionQuantity' | 'downTime' | 'hourCounter';
type SortDirection = 'ascending' | 'descending';

const ProductionHistoryPage = ({ productionEntries, lines, orders, styles, colors, employees, operations }: ProductionHistoryPageProps) => {
  const [filters, setFilters] = useState({
    line: 'all',
    order: 'all',
    employee: 'all',
    date: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'timestamp', direction: 'descending' });

  const maps = useMemo(() => ({
    lines: new Map(lines.map(i => [i.id, i.name])),
    orders: new Map(orders.map(i => [i.id, i.name])),
    styles: new Map(styles.map(i => [i.id, i.name])),
    colors: new Map(colors.map(i => [i.id, i.name])),
    employees: new Map(employees.map(i => [i.id, i.name])),
    operations: new Map(operations.map(i => [i.id, i.name])),
  }), [lines, orders, styles, colors, employees, operations]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredAndSortedEntries = useMemo(() => {
    const processedEntries: ProcessedProductionEntry[] = (productionEntries || []).filter(e => {
        const lineMatch = filters.line === 'all' || e.lineNumber === filters.line;
        const orderMatch = filters.order === 'all' || e.orderNumber === filters.order;
        const employeeMatch = filters.employee === 'all' || e.employeeId === filters.employee;
        const dateMatch = !filters.date || e.timestamp.startsWith(filters.date);
        
        const employeeName = maps.employees.get(e.employeeId) || '';
        const operationName = maps.operations.get(e.operation) || '';
        const searchMatch = !searchTerm || 
            employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            operationName.toLowerCase().includes(searchTerm.toLowerCase());

        return lineMatch && orderMatch && employeeMatch && dateMatch && searchMatch;
    }).map(e => ({
        ...e,
        employeeName: maps.employees.get(e.employeeId) || 'Unknown'
    }));
    
    processedEntries.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      const order = sortConfig.direction === 'ascending' ? 1 : -1;
      
      if(sortConfig.key === 'timestamp') {
        return (new Date(aValue).getTime() - new Date(bValue).getTime()) * order;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * order;
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * order;
      }
      return 0;
    });

    return processedEntries;
  }, [productionEntries, filters, sortConfig, maps, searchTerm]);

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <th className="p-3 text-sm font-semibold text-slate-600 cursor-pointer hover:bg-slate-100" onClick={() => requestSort(sortKey)}>
        <div className="flex items-center gap-2">
            <span>{label}</span>
            {sortConfig.key === sortKey && (sortConfig.direction === 'ascending' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />)}
        </div>
    </th>
  );
  
  const handleDownload = () => {
    const dataToExport = filteredAndSortedEntries.map(e => ({
        timestamp_ist: new Date(e.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        hour: e.hourCounter,
        line: maps.lines.get(e.lineNumber),
        order: maps.orders.get(e.orderNumber),
        style: maps.styles.get(e.styleNumber),
        color: maps.colors.get(e.colorId),
        operation: maps.operations.get(e.operation),
        employee: e.employeeName,
        quantity: e.productionQuantity,
        downtime_minutes: e.downTime,
        downtime_reason: e.downTimeReason,
    }));
    downloadCsv(dataToExport, "production_history");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-0">
        <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Production History</h1>
            <p className="text-slate-600 mt-2">Browse, filter, and sort all production records.</p>
        </div>
         <div className="flex flex-wrap gap-2 items-center mt-4 sm:mt-0">
            <button onClick={handleDownload} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Download CSV</button>
         </div>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="md:col-span-1 h-10 px-3 border-slate-300 rounded-md text-sm"/>
            <select name="line" value={filters.line} onChange={handleFilterChange} className="md:col-span-1 h-10 px-3 border-slate-300 rounded-md text-sm"><option value="all">All Lines</option>{lines.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select>
            <select name="order" value={filters.order} onChange={handleFilterChange} className="md:col-span-1 h-10 px-3 border-slate-300 rounded-md text-sm"><option value="all">All Orders</option>{orders.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select>
            <select name="employee" value={filters.employee} onChange={handleFilterChange} className="md:col-span-1 h-10 px-3 border-slate-300 rounded-md text-sm"><option value="all">All Employees</option>{employees.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select>
            <input type="text" placeholder="Search employee or op..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="md:col-span-1 h-10 px-3 border-slate-300 rounded-md text-sm" />
        </div>
      </div>
      
      <main className="bg-white p-2 sm:p-4 rounded-2xl shadow-lg">
          <div className="max-h-[65vh] overflow-y-auto">
            {filteredAndSortedEntries.length > 0 ? (
              <table className="w-full text-left">
                <thead className="border-b border-slate-200 sticky top-0 bg-white z-10">
                  <tr>
                    <SortableHeader label="Timestamp (IST)" sortKey="timestamp" />
                    <SortableHeader label="Hr" sortKey="hourCounter" />
                    <SortableHeader label="Line" sortKey="lineNumber" />
                    <th className="p-3 text-sm font-semibold text-slate-600 hidden lg:table-cell">Order</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Operation</th>
                    <SortableHeader label="Employee" sortKey="employeeName" />
                    <SortableHeader label="Qty" sortKey="productionQuantity" />
                    <SortableHeader label="Downtime" sortKey="downTime" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAndSortedEntries.map(e => (
                    <tr key={e.id}>
                      <td className="p-3 text-sm text-slate-600">{new Date(e.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                      <td className="p-3 text-sm text-center">{e.hourCounter}</td>
                      <td className="p-3 text-sm">{maps.lines.get(e.lineNumber)}</td>
                      <td className="p-3 text-sm text-slate-500 hidden lg:table-cell">{maps.orders.get(e.orderNumber)}</td>
                      <td className="p-3 text-sm">{maps.operations.get(e.operation)}</td>
                      <td className="p-3 text-sm font-medium text-slate-800">{e.employeeName}</td>
                      <td className="p-3 text-sm font-semibold text-right text-indigo-700 font-mono">{e.productionQuantity}</td>
                      <td className="p-3 text-sm text-right font-mono">{e.downTime > 0 ? `${e.downTime}m` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
             <div className="text-center py-16">
                <h3 className="mt-2 text-sm font-semibold text-slate-900">No entries found</h3>
                <p className="mt-1 text-sm text-slate-500">Try adjusting your filters.</p>
             </div>
            )}
          </div>
        </main>

    </div>
  );
};

export default ProductionHistoryPage;
