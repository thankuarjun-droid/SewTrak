import React, { useState, useMemo } from 'react';
import type { NonConformanceReport, Staff } from '../types';
import { NCModal } from '../components/NCModal';

interface NCRegisterPageProps {
  ncReports: NonConformanceReport[];
  staff: Staff[];
  onSave: (nc: NonConformanceReport) => void;
}

const NCRegisterPage = ({ ncReports, staff = [], onSave }: NCRegisterPageProps) => {
  const [editingNc, setEditingNc] = useState<NonConformanceReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const staffMap = useMemo(() => new Map(staff.map(s => [s.id, s.name])), [staff]);

  const handleOpenModal = (nc?: NonConformanceReport) => {
    setEditingNc(nc || null);
    setIsModalOpen(true);
  };
  
  const handleSave = (nc: NonConformanceReport) => {
    onSave(nc);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="p-4 sm:p-6 md:p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Non-Conformance (NC) Register</h1>
            <p className="text-slate-600 mt-2">Track and manage all quality non-conformances.</p>
          </div>
          <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md">Create New NC</button>
        </header>

        <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="max-h-[70vh] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white"><tr className="border-b">
                        <th className="p-2 text-left">NC #</th>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Source</th>
                        <th className="p-2 text-left">Responsible</th>
                        <th className="p-2 text-left">Due Date</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-right">Action</th>
                    </tr></thead>
                    <tbody>
                        {(ncReports || []).map(nc => (
                            <tr key={nc.id} className="border-b hover:bg-slate-50">
                                <td className="p-2 font-semibold text-indigo-600">{nc.ncNumber}</td>
                                <td className="p-2">{nc.date}</td>
                                <td className="p-2">{nc.source}</td>
                                <td className="p-2">{staffMap.get(nc.responsibleStaffId) || 'N/A'}</td>
                                <td className="p-2">{nc.dueDate}</td>
                                <td className="p-2">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${nc.status === 'Open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {nc.status}
                                    </span>
                                </td>
                                <td className="p-2 text-right">
                                    <button onClick={() => handleOpenModal(nc)} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">View/Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {(ncReports || []).length === 0 && <p className="text-center py-8 text-slate-400">No Non-Conformances have been recorded.</p>}
            </div>
        </div>
      </div>

      {isModalOpen && (
          <NCModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            ncToEdit={editingNc}
            staff={staff}
          />
      )}
    </>
  );
};

export default NCRegisterPage;