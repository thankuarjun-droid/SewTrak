import React, { useState, useMemo } from 'react';
import type { Employee, MasterDataItem, OperatorGrade, FactorySettings } from '../types';
import { EmployeeModal } from '../components/EmployeeModal';
import { PlusIcon, UsersIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../components/IconComponents';
import { downloadCsv, downloadTemplate } from '../services/exportService';

interface EmployeeMasterPageProps {
  employees: Employee[];
  lines: MasterDataItem[];
  operatorGrades: OperatorGrade[];
  factorySettings: FactorySettings;
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
}

type SortKey = 'id' | 'name' | 'gender' | 'age' | 'maritalStatus' | 'area' | 'designation' | 'operatorGradeId' | 'ctc' | 'doj' | 'currentLineId';
type SortDirection = 'ascending' | 'descending';

const EmployeeMasterPage = ({ employees, lines, operatorGrades, factorySettings, onAddEmployee, onUpdateEmployee, onDeleteEmployee }: EmployeeMasterPageProps) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('all');
  const [filterLine, setFilterLine] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'ascending' });
  
  const uniqueDesignations = useMemo(() => [...new Set((employees || []).map(e => e.designation))], [employees]);

  const handleOpenModalForCreate = () => {
    setEditingEmployee(null);
    setModalOpen(true);
  };
  
  const handleOpenModalForEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setModalOpen(true);
  };

  const handleCloseModal = () => setModalOpen(false);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      alert(`File "${file.name}" selected. In a real application, you would now parse this CSV.`);
      // Logic to read and process the CSV file would go here.
    }
  };
  
  const handleDownload = () => {
    const dataToExport = employees.map(e => {
        const lineName = lines.find(l => l.id === e.currentLineId)?.name || '';
        const gradeName = operatorGrades.find(g => g.id === e.operatorGradeId)?.name || '';
        
        return {
            employee_id: e.id,
            name: e.name,
            designation: e.designation,
            ctc_per_shift: e.ctc,
            default_line: lineName,
            date_of_joining: e.doj,
            operator_grade: gradeName,
            gender: e.gender,
            age: e.age,
            marital_status: e.maritalStatus,
            area: e.area,
            ...e.customData,
        };
    });

    downloadCsv(dataToExport, 'employees');
  };

  const filteredAndSortedEmployees = useMemo(() => {
    let sortableEmployees = [...(employees || [])];
    
    sortableEmployees = sortableEmployees.filter(s => {
        const designationMatch = filterDesignation === 'all' || s.designation === filterDesignation;
        const lineMatch = filterLine === 'all' || s.currentLineId === filterLine;
        const searchMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.id.toLowerCase().includes(searchTerm.toLowerCase());
        return designationMatch && lineMatch && searchMatch;
    });

    sortableEmployees.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
    
    return sortableEmployees;
  }, [employees, searchTerm, filterDesignation, filterLine, sortConfig]);

  const getLineName = (lineId: string) => lines.find(l => l.id === lineId)?.name || 'N/A';
  
  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <th className="p-3 text-sm font-semibold text-slate-600 cursor-pointer hover:bg-slate-100" onClick={() => requestSort(sortKey)}>
        <div className="flex items-center gap-2">
            <span>{label}</span>
            {sortConfig.key === sortKey && (sortConfig.direction === 'ascending' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />)}
        </div>
    </th>
  );

  return (
    <>
      <div className="p-4 sm:p-6 md:p-10">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Employee Master</h1>
            <p className="text-slate-600 mt-2">Manage all on-floor production employees.</p>
          </div>
          <button
              onClick={handleOpenModalForCreate}
              className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
          >
              <PlusIcon className="w-5 h-5" />
              Add New Employee
          </button>
        </header>

        <div className="bg-white p-4 rounded-xl shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" />
                <select value={filterDesignation} onChange={e => setFilterDesignation(e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm"><option value="all">All Designations</option>{uniqueDesignations.map(d => <option key={d} value={d}>{d}</option>)}</select>
                <select value={filterLine} onChange={e => setFilterLine(e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm"><option value="all">All Lines</option>{lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
                <h3 className="text-base font-semibold text-slate-800 mb-2">Data Management</h3>
                <div className="flex flex-wrap gap-2">
                    <button onClick={handleDownload} className="text-sm font-medium py-2 px-4 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200">Download CSV</button>
                    <button onClick={() => downloadTemplate(['id', 'name', 'gender', 'age', 'maritalStatus', 'area', 'designation', 'ctc', 'currentLineId', 'doj', 'operatorGradeId'])} className="text-sm font-medium py-2 px-4 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200">Download Template</button>
                    <input type="file" id="csvUploadEmployees" className="hidden" accept=".csv" onChange={handleFileUpload} />
                    <label htmlFor="csvUploadEmployees" className="text-sm font-medium py-2 px-4 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer">Upload CSV</label>
                </div>
            </div>
        </div>

        <main className="bg-white p-2 sm:p-4 rounded-2xl shadow-lg">
          <div className="max-h-[65vh] overflow-y-auto">
            {filteredAndSortedEmployees.length > 0 ? (
              <table className="w-full text-left">
                <thead className="border-b border-slate-200 sticky top-0 bg-white z-10">
                  <tr>
                    <SortableHeader label="Employee" sortKey="name" />
                    <th className="p-3 text-sm font-semibold text-slate-600 hidden lg:table-cell"><SortableHeader label="Gender" sortKey="gender" /></th>
                    <th className="p-3 text-sm font-semibold text-slate-600 hidden xl:table-cell"><SortableHeader label="Age" sortKey="age" /></th>
                    <th className="p-3 text-sm font-semibold text-slate-600 hidden xl:table-cell"><SortableHeader label="Marital Status" sortKey="maritalStatus" /></th>
                    <th className="p-3 text-sm font-semibold text-slate-600 hidden xl:table-cell"><SortableHeader label="Area" sortKey="area" /></th>
                    <th className="p-3 text-sm font-semibold text-slate-600 hidden md:table-cell"><SortableHeader label="Designation" sortKey="designation" /></th>
                    <th className="p-3 text-sm font-semibold text-slate-600 hidden sm:table-cell"><SortableHeader label="Grade" sortKey="operatorGradeId" /></th>
                    <th className="p-3 text-sm font-semibold text-slate-600 text-right hidden lg:table-cell"><SortableHeader label="Salary/Shift" sortKey="ctc" /></th>
                    <th className="p-3 text-sm font-semibold text-slate-600 hidden md:table-cell"><SortableHeader label="DOJ" sortKey="doj" /></th>
                    <th className="p-3 text-sm font-semibold text-slate-600 hidden sm:table-cell"><SortableHeader label="Default Line" sortKey="currentLineId" /></th>
                    <th className="p-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedEmployees.map(s => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 text-sm text-slate-800 font-medium">
                        {s.name}
                        <span className="block text-xs text-slate-500 font-mono">{s.id}</span>
                      </td>
                      <td className="p-3 text-sm text-slate-600 hidden lg:table-cell">{s.gender}</td>
                      <td className="p-3 text-sm text-slate-600 hidden xl:table-cell">{s.age}</td>
                      <td className="p-3 text-sm text-slate-600 hidden xl:table-cell">{s.maritalStatus}</td>
                      <td className="p-3 text-sm text-slate-600 hidden xl:table-cell">{s.area}</td>
                      <td className="p-3 text-sm text-slate-600 hidden md:table-cell">{s.designation}</td>
                      <td className="p-3 text-sm text-slate-600 hidden sm:table-cell">{operatorGrades.find(g => g.id === s.operatorGradeId)?.name}</td>
                      <td className="p-3 text-sm text-slate-600 font-mono text-right hidden lg:table-cell">₹{s.ctc.toLocaleString()}</td>
                      <td className="p-3 text-sm text-slate-600 hidden md:table-cell">{new Date(s.doj).toLocaleDateString()}</td>
                      <td className="p-3 text-sm text-slate-600 hidden sm:table-cell">{getLineName(s.currentLineId)}</td>
                      <td className="p-3 text-sm">
                          <div className="flex justify-end items-center gap-2">
                              <button onClick={() => handleOpenModalForEdit(s)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-md" aria-label="Edit Employee"><PencilIcon className="w-4 h-4" /></button>
                              <button onClick={() => onDeleteEmployee(s.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md" aria-label="Delete Employee"><TrashIcon className="w-4 h-4" /></button>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
             <div className="text-center py-16">
                <UsersIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">No employees found</h3>
                <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters.</p>
             </div>
            )}
          </div>
        </main>
      </div>
      {isModalOpen && (
          <EmployeeModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={editingEmployee ? onUpdateEmployee : onAddEmployee}
            lines={lines}
            operatorGrades={operatorGrades}
            existingEmployees={employees}
            employeeToEdit={editingEmployee}
            factorySettings={factorySettings}
          />
      )}
    </>
  );
};

export default EmployeeMasterPage;