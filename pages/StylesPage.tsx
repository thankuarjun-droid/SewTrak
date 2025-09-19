import React, { useState } from 'react';
import type { Style, MasterDataItem, OperatorGrade, Machine, Operation, FactorySettings, ObStatus, Staff, Employee, DailyAttendance } from '../types';
import { StyleModal } from '../components/StyleModal';
import { PlusIcon, PencilIcon, TrashIcon, TagIcon } from '../components/IconComponents';
import { downloadCsv, downloadTemplate } from '../services/exportService';

interface StylesPageProps {
  styles: Style[];
  colors: MasterDataItem[];
  operations: Operation[];
  operatorGrades: OperatorGrade[];
  machines: Machine[];
  factorySettings: FactorySettings;
  currentUser: Staff;
  employees: Employee[];
  dailyAttendances: DailyAttendance[];
  onAddStyle: (style: Style) => void;
  onUpdateStyle: (style: Style) => void;
  onDeleteStyle: (styleId: string) => void;
  onAddColor: (name: string) => Promise<MasterDataItem | null>;
  onAddOperatorGrade: (name: string) => Promise<MasterDataItem | null>;
  onAddMachine: (name: string) => Promise<MasterDataItem | null>;
  onAddOperation: (name: string) => Promise<Operation | null>;
}

const StylesPage = ({ 
  styles = [], colors, operations, operatorGrades, machines, factorySettings, currentUser, employees, dailyAttendances,
  onAddStyle, onUpdateStyle, onDeleteStyle, 
  onAddColor, onAddOperatorGrade, onAddMachine, onAddOperation
}: StylesPageProps) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);

  const handleOpenModalForEdit = (style: Style) => {
    setEditingStyle(style);
    setModalOpen(true);
  };

  const handleOpenModalForCreate = () => {
    setEditingStyle(null);
    setModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingStyle(null);
  }

  const handleSave = (style: Style) => {
    if (editingStyle) {
      onUpdateStyle(style);
    } else {
      onAddStyle(style);
    }
  };
  
  const handleDelete = (styleId: string) => {
    if (window.confirm('Are you sure you want to delete this style? This might affect existing orders.')) {
        onDeleteStyle(styleId);
    }
  }
  
  const getColorNames = (colorIds: string[]) => {
    if (!colorIds || colorIds.length === 0) return 'No colors assigned';
    return colorIds.map(id => colors.find(c => c.id === id)?.name || 'Unknown').join(', ');
  }
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      alert(`File "${file.name}" selected. In a real application, you would now parse this CSV.`);
      // Logic to read and process the CSV file would go here.
    }
  };

  const handleDownload = () => {
    const dataToExport = styles.flatMap(s => 
      s.operationBulletin.map(op => ({
        style_id: s.id,
        style_name: s.name,
        color_ids: s.colorIds.join(';'),
        op_s_no: op.sNo,
        op_id: op.operationId,
        op_grade_id: op.operatorGradeId,
        op_machine_id: op.machineId,
        pickup_time_sec: op.pickupTime,
        sewing_time_sec: op.sewingTime,
        trim_disposal_time_sec: op.trimAndDisposalTime,
        ...s.customData,
      }))
    );
    downloadCsv(dataToExport, 'styles_with_bulletin');
  };

  const statusColors: Record<ObStatus, string> = {
    Draft: 'bg-slate-100 text-slate-600',
    'Pending Approval': 'bg-amber-100 text-amber-700',
    Approved: 'bg-green-100 text-green-700'
  };

  return (
    <>
      <div className="p-4 sm:p-6 md:p-10">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Styles</h1>
            <p className="text-slate-600 mt-2">Manage styles and their associated colors.</p>
          </div>
          <button
            onClick={handleOpenModalForCreate}
            className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-[#2c4e8a] text-white font-semibold rounded-md hover:bg-[#213a69] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c4e8a] transition"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Style
          </button>
        </header>

         <div className="bg-white p-4 rounded-xl shadow-md mb-6">
             <h3 className="text-base font-semibold text-slate-800 mb-2">Data Management</h3>
             <div className="flex flex-wrap gap-2">
                <button onClick={handleDownload} className="text-sm font-medium py-2 px-4 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200">Download CSV</button>
                <button onClick={() => downloadTemplate(['style_name', 'color_ids', 'op_s_no', 'op_id', 'op_grade_id', 'op_machine_id', 'pickup_time_sec', 'sewing_time_sec', 'trim_disposal_time_sec'])} className="text-sm font-medium py-2 px-4 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200">Download Template</button>
                <input type="file" id="csvUploadStyles" className="hidden" accept=".csv" onChange={handleFileUpload} />
                <label htmlFor="csvUploadStyles" className="text-sm font-medium py-2 px-4 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer">Upload CSV</label>
             </div>
              <p className="text-xs text-slate-500 mt-2 italic">Template requires one row per operation in a style bulletin. Use semi-colons (;) to separate multiple color IDs.</p>
        </div>

        <main className="bg-white p-2 sm:p-4 rounded-2xl shadow-lg">
          <div className="max-h-[70vh] overflow-y-auto">
            {styles.length > 0 ? (
              <table className="w-full text-left">
                <thead className="border-b border-slate-200 sticky top-0 bg-white">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-slate-600">Style Name</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">OB Status</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 hidden md:table-cell">Associated Colors</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {styles.map(style => (
                    <tr key={style.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 text-sm text-slate-800 font-medium">
                        {style.name}
                        <div className="text-xs text-slate-500 md:hidden truncate">{getColorNames(style.colorIds)}</div>
                      </td>
                      <td className="p-3 text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[style.obStatus || 'Draft']}`}>
                          {style.obStatus || 'Draft'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-slate-600 hidden md:table-cell">{getColorNames(style.colorIds)}</td>
                      <td className="p-3 text-sm text-right">
                         <div className="flex justify-end items-center gap-2">
                            <button onClick={() => handleOpenModalForEdit(style)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-md" aria-label="Edit Style">
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(style.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md" aria-label="Delete Style">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
             <div className="text-center py-16">
                <TagIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">No styles found</h3>
                <p className="mt-1 text-sm text-slate-500">Get started by adding a new style.</p>
             </div>
            )}
          </div>
        </main>
      </div>
      <StyleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        styleToEdit={editingStyle}
        existingStyles={styles}
        colors={colors}
        operations={operations}
        operatorGrades={operatorGrades}
        machines={machines}
        factorySettings={factorySettings}
        currentUser={currentUser}
        employees={employees}
        dailyAttendances={dailyAttendances}
        onAddColor={onAddColor}
        onAddOperatorGrade={onAddOperatorGrade}
        onAddMachine={onAddMachine}
        onAddOperation={onAddOperation}
      />
    </>
  );
};

export default StylesPage;