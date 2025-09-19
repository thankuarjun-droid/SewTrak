
import React, { useState, useMemo } from 'react';
import type { Staff, MasterDataItem, UserRole } from '../types';
import { StaffModal } from '../components/StaffModal';
import { PlusIcon, UsersIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../components/IconComponents';

interface StaffMasterPageProps {
  staff: Staff[];
  lines: MasterDataItem[];
  onAddStaff: (staff: Staff) => void;
  onUpdateStaff: (staff: Staff) => void;
  onDeleteStaff: (staffId: string) => void;
  currentUser: Staff;
}

type SortKey = 'name' | 'email' | 'role';
type SortDirection = 'ascending' | 'descending';

const StaffMasterPage = ({ staff, lines, onAddStaff, onUpdateStaff, onDeleteStaff, currentUser }: StaffMasterPageProps) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'ascending' });
  
  const isAdmin = currentUser.role === 'Admin';
  const uniqueRoles = useMemo(() => [...new Set((staff || []).map(e => e.role))], [staff]);

  const handleOpenModalForCreate = () => {
    setEditingStaff(null);
    setModalOpen(true);
  };
  
  const handleOpenModalForEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
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

  const filteredAndSortedStaff = useMemo(() => {
    let sortableStaff = [...(staff || [])];
    
    sortableStaff = sortableStaff.filter(s => {
        const roleMatch = filterRole === 'all' || s.role === filterRole;
        const searchMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.email.toLowerCase().includes(searchTerm.toLowerCase());
        return roleMatch && searchMatch;
    });

    sortableStaff.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
    
    return sortableStaff;
  }, [staff, searchTerm, filterRole, sortConfig]);

  const getLineNames = (lineAssignments: string[]) => {
      if (lineAssignments.includes('all')) return 'All Lines';
      if (lineAssignments.length === 0) return 'No lines assigned';
      return lineAssignments.map(id => lines.find(l => l.id === id)?.name || id).join(', ');
  }
  
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
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">User Management</h1>
            <p className="text-slate-600 mt-2">Manage system users, credentials, and roles.</p>
          </div>
          {isAdmin && (
            <button
                onClick={handleOpenModalForCreate}
                className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
            >
                <PlusIcon className="w-5 h-5" />
                Add New User
            </button>
          )}
        </header>

        <div className="bg-white p-4 rounded-xl shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm" />
                <select value={filterRole} onChange={e => setFilterRole(e.target.value as UserRole | 'all')} className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md shadow-sm">
                    <option value="all">All Roles</option>
                    {uniqueRoles.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
        </div>

        <main className="bg-white p-2 sm:p-4 rounded-2xl shadow-lg">
          <div className="max-h-[65vh] overflow-y-auto">
            {filteredAndSortedStaff.length > 0 ? (
              <table className="w-full text-left">
                <thead className="border-b border-slate-200 sticky top-0 bg-white z-10">
                  <tr>
                    <SortableHeader label="User Name" sortKey="name" />
                    <SortableHeader label="Email (Login)" sortKey="email" />
                    <SortableHeader label="Role" sortKey="role" />
                    <th className="p-3 text-sm font-semibold text-slate-600 hidden sm:table-cell">Assigned Lines</th>
                    {isAdmin && <th className="p-3 text-sm font-semibold text-slate-600 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedStaff.map(s => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 text-sm text-slate-800 font-medium">{s.name}</td>
                      <td className="p-3 text-sm text-slate-600">{s.email}</td>
                      <td className="p-3 text-sm text-slate-600">{s.role}</td>
                      <td className="p-3 text-sm text-slate-600 hidden sm:table-cell">{getLineNames(s.lineAssignments)}</td>
                      {isAdmin && (
                        <td className="p-3 text-sm">
                            <div className="flex justify-end items-center gap-2">
                                <button onClick={() => handleOpenModalForEdit(s)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-md" aria-label="Edit User"><PencilIcon className="w-4 h-4" /></button>
                                <button onClick={() => onDeleteStaff(s.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md" aria-label="Delete User"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
             <div className="text-center py-16">
                <UsersIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">No users found</h3>
                <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters.</p>
             </div>
            )}
          </div>
        </main>
      </div>
      {isModalOpen && (
          <StaffModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={editingStaff ? onUpdateStaff : onAddStaff}
            lines={lines}
            existingStaff={staff}
            staffToEdit={editingStaff}
            currentUser={currentUser}
          />
      )}
    </>
  );
};

export default StaffMasterPage;
