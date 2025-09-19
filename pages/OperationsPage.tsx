import React, { useState, useMemo } from 'react';
import type { Operation } from '../types';
import { OperationModal } from '../components/OperationModal';
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../components/IconComponents';

interface OperationsPageProps {
  operations: Operation[];
  onAddOperation: (operation: Omit<Operation, 'id'>) => void;
  onUpdateOperation: (operation: Operation) => void;
  onDeleteOperation: (operationId: string) => void;
}

type SortKey = 'name' | 'skillType';
type SortDirection = 'ascending' | 'descending';

const OperationsPage = ({ operations, onAddOperation, onUpdateOperation, onDeleteOperation }: OperationsPageProps) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'ascending' });

  const handleOpenModalForCreate = () => {
    setEditingOperation(null);
    setModalOpen(true);
  };
  
  const handleOpenModalForEdit = (operation: Operation) => {
    setEditingOperation(operation);
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

  const filteredAndSortedOperations = useMemo(() => {
    let sortableOperations = [...(operations || [])];
    
    if (searchTerm) {
        sortableOperations = sortableOperations.filter(op => 
            op.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    sortableOperations.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
    
    return sortableOperations;
  }, [operations, searchTerm, sortConfig]);

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
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Operations Master</h1>
            <p className="text-slate-600 mt-2">Manage all manufacturing operations and their skill levels.</p>
          </div>
          <button
              onClick={handleOpenModalForCreate}
              className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
          >
              <PlusIcon className="w-5 h-5" />
              Add New Operation
          </button>
        </header>

        <div className="bg-white p-4 rounded-xl shadow-md mb-6">
            <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" />
        </div>

        <main className="bg-white p-2 sm:p-4 rounded-2xl shadow-lg">
          <div className="max-h-[65vh] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 sticky top-0 bg-white z-10">
                <tr>
                  <SortableHeader label="Operation Name" sortKey="name" />
                  <SortableHeader label="Skill Type" sortKey="skillType" />
                  <th className="p-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedOperations.map(op => (
                  <tr key={op.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 text-sm text-slate-800 font-medium">{op.name}</td>
                    <td className="p-3 text-sm text-slate-600">{op.skillType}</td>
                    <td className="p-3 text-sm">
                      <div className="flex justify-end items-center gap-2">
                          <button onClick={() => handleOpenModalForEdit(op)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-md" aria-label="Edit Operation"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={() => onDeleteOperation(op.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md" aria-label="Delete Operation"><TrashIcon className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
      {isModalOpen && (
          <OperationModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={editingOperation ? onUpdateOperation : onAddOperation}
            existingOperations={operations}
            operationToEdit={editingOperation}
          />
      )}
    </>
  );
};

export default OperationsPage;