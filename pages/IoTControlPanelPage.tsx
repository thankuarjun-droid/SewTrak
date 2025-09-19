import React, { useState, useMemo } from 'react';
import type { Line, Employee, IoTDevice, Operation, LineAllocation, IoTSignalLog } from '../types';
import { BoltIcon } from '../components/IconComponents';

interface IoTControlPanelPageProps {
  lines: Line[];
  employees: Employee[];
  iotDevices: IoTDevice[];
  operations: Operation[];
  allocations: LineAllocation[];
  iotSignalLogs: IoTSignalLog[];
  onSignal: (deviceId: string) => void;
}

const IoTControlPanelPage = ({ lines, employees, iotDevices, operations, allocations, iotSignalLogs, onSignal }: IoTControlPanelPageProps) => {
  const [selectedLineId, setSelectedLineId] = useState(lines[0]?.id || '');
  const [feedback, setFeedback] = useState<Record<string, 'success' | 'fail'>>({});

  const employeesMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);
  const operationsMap = useMemo(() => new Map(operations.map(o => [o.id, o.name])), [operations]);
  
  const devicesWithContext = useMemo(() => {
    const activeAllocationForLine = (allocations || [])
      .filter(a => a.lineNumber === selectedLineId)
      .sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0];

    return (iotDevices || [])
      .filter(d => d.assignedLineId === selectedLineId && d.assignedEmployeeId)
      .map(device => {
        const employee = employeesMap.get(device.assignedEmployeeId!);
        const assignment = activeAllocationForLine?.assignments.find(a => a.employeeIds.includes(device.assignedEmployeeId!));
        const operationName = assignment ? operationsMap.get(assignment.operationId) : 'Not Allocated';
        const todayStr = new Date().toISOString().split('T')[0];
        const pressesToday = (iotSignalLogs || []).filter(l => l.deviceId === device.id && l.timestamp.startsWith(todayStr) && !l.error).length;

        return {
          ...device,
          employeeName: employee?.name || 'Unknown',
          operationName,
          pressesToday,
        };
      });
  }, [selectedLineId, iotDevices, employeesMap, operationsMap, allocations, iotSignalLogs]);

  const handlePress = (deviceId: string) => {
    onSignal(deviceId);
    setFeedback(prev => ({ ...prev, [deviceId]: 'success' }));
    setTimeout(() => setFeedback(prev => ({...prev, [deviceId]: undefined!})), 300);
  };
  
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">IoT Control Panel (Simulation)</h1>
        <p className="text-slate-600 mt-2">Simulate real-time production counts from operator switches.</p>
      </header>

      <div className="max-w-md mb-6">
        <label htmlFor="line-select-iot" className="block text-sm font-medium text-slate-700">Select Line</label>
        <select id="line-select-iot" value={selectedLineId} onChange={e => setSelectedLineId(e.target.value)} className="mt-1 block w-full h-10 px-3 border-slate-300 rounded-md">
          {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {devicesWithContext.map(device => {
          const feedbackClass = feedback[device.id] === 'success' ? 'animate-pulse bg-green-400/50' : '';
          return (
            <div key={device.id} className="bg-white p-4 rounded-xl shadow-lg flex flex-col items-center text-center space-y-3">
                <h3 className="font-bold text-slate-800">{device.employeeName}</h3>
                <p className="text-sm text-indigo-600 font-semibold truncate" title={device.operationName}>{device.operationName}</p>
                <div className="flex-grow flex items-center justify-center">
                    <button 
                        onClick={() => handlePress(device.id)}
                        className={`w-32 h-32 rounded-full bg-slate-700 text-white font-bold text-2xl flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 relative overflow-hidden ${feedbackClass}`}
                    >
                        Press Switch
                    </button>
                </div>
                <div className="w-full text-center bg-slate-100 p-2 rounded-md">
                    <div className="text-xs text-slate-500">Today's Presses</div>
                    <div className="text-2xl font-mono font-bold text-slate-800">{device.pressesToday}</div>
                </div>
                <p className="text-xs text-slate-400 font-mono" title={device.id}>Device: {device.name}</p>
            </div>
          )
        })}
        {devicesWithContext.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-xl">
            <p className="text-slate-500">No active IoT devices assigned to this line.</p>
            <p className="text-sm text-slate-400 mt-1">Go to IoT Devices to assign an employee to this line.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IoTControlPanelPage;