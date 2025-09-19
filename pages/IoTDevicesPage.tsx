import React, { useState, useMemo } from 'react';
import type { IoTDevice, Line, Employee } from '../types';
import { PlusIcon, PencilIcon, TrashIcon } from '../components/IconComponents';
import { IoTDeviceModal } from '../components/IoTDeviceModal';

interface IoTDevicesPageProps {
  devices: IoTDevice[];
  lines: Line[];
  employees: Employee[];
  onAdd: (device: IoTDevice) => void;
  onUpdate: (device: IoTDevice) => void;
  onDelete: (deviceId: string) => void;
}

const IoTDevicesPage = ({ devices = [], lines = [], employees = [], onAdd, onUpdate, onDelete }: IoTDevicesPageProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<IoTDevice | null>(null);

  const linesMap = useMemo(() => new Map(lines.map(l => [l.id, l.name])), [lines]);
  const employeesMap = useMemo(() => new Map(employees.map(e => [e.id, e.name])), [employees]);

  const handleOpenCreate = () => {
    setEditingDevice(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (device: IoTDevice) => {
    setEditingDevice(device);
    setIsModalOpen(true);
  };
  
  const handleSave = (device: IoTDevice) => {
    if(editingDevice) {
      onUpdate(device);
    } else {
      onAdd(device);
    }
  }

  return (
    <>
      <div className="p-4 sm:p-6 md:p-10">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">IoT Devices</h1>
            <p className="text-slate-600 mt-2">Manage and assign automatic sewing counter devices.</p>
          </div>
          <button onClick={handleOpenCreate} className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
            <PlusIcon className="w-5 h-5" />
            Add New Device
          </button>
        </header>

        <main className="bg-white p-2 sm:p-4 rounded-2xl shadow-lg">
          <div className="max-h-[70vh] overflow-y-auto">
            {devices.length > 0 ? (
              <table className="w-full text-left">
                <thead className="border-b border-slate-200 sticky top-0 bg-white">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-slate-600">Device ID</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Name</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Assigned Line</th>
                    <th className="p-3 text-sm font-semibold text-slate-600">Assigned Employee</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map(device => (
                    <tr key={device.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 text-sm font-mono text-slate-800 font-medium">{device.id}</td>
                      <td className="p-3 text-sm text-slate-600">{device.name}</td>
                      <td className="p-3 text-sm text-slate-600">{device.assignedLineId ? linesMap.get(device.assignedLineId) : <span className="text-slate-400 italic">Unassigned</span>}</td>
                      <td className="p-3 text-sm text-slate-600">{device.assignedEmployeeId ? employeesMap.get(device.assignedEmployeeId) : <span className="text-slate-400 italic">Unassigned</span>}</td>
                      <td className="p-3 text-sm">
                        <div className="flex justify-end items-center gap-2">
                          <button onClick={() => handleOpenEdit(device)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-md" aria-label="Edit Device"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(device.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md" aria-label="Delete Device"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center py-16 text-slate-500">No IoT devices have been registered yet.</p>
            )}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <IoTDeviceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          deviceToEdit={editingDevice}
          existingDevices={devices}
          lines={lines}
          employees={employees}
        />
      )}
    </>
  );
};

export default IoTDevicesPage;