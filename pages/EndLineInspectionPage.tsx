
import React, { useState, useMemo } from 'react';
import type { Line, Order, LineAllocation, Operation, Employee, Defect, EndLineCheck, Staff, KanbanEntry, Style } from '../types';

interface EndLineInspectionPageProps {
  lines: Line[];
  orders: Order[];
  allocations: LineAllocation[];
  operations: Operation[];
  employees: Employee[];
  defects: Defect[];
  checks: EndLineCheck[];
  currentUser: Staff;
  kanbanEntries: KanbanEntry[];
  styles: Style[];
  staff: Staff[];
  onSaveCheck: (check: EndLineCheck) => void;
  onUpdateCheck: (check: EndLineCheck) => void;
}

const EndLineInspectionPage = ({ lines, orders, allocations, operations, employees, defects, checks, currentUser, kanbanEntries, styles, staff, onSaveCheck, onUpdateCheck }: EndLineInspectionPageProps) => {
  const [selectedLineId, setSelectedLineId] = useState('');
  const [showReworkForm, setShowReworkForm] = useState(false);
  const [reworkData, setReworkData] = useState<{
    defectId: string;
    responsibleOpId: string;
    status: 'Rework' | 'Reject' | null;
  }>({ defectId: '', responsibleOpId: '', status: null });
  
  const operationsMap = useMemo(() => new Map((operations || []).map(o => [o.id, o.name])), [operations]);
  const defectsMap = useMemo(() => new Map((defects || []).map(d => [d.id, d.name])), [defects]);
  const employeesMap = useMemo(() => new Map((employees || []).map(e => [e.id, e.name])), [employees]);
  const staffMap = useMemo(() => new Map((staff || []).map(s => [s.id, s.name])), [staff]);

  const checkerCodeMap = useMemo(() => {
    const qualityControllers = (staff || []).filter(s => s.role === 'Quality Controller').sort((a, b) => a.name.localeCompare(b.name));
    const map = new Map<string, string>();
    qualityControllers.forEach((qc, index) => {
        map.set(qc.id, String.fromCharCode(65 + index)); // A, B, C...
    });
    return map;
  }, [staff]);

  const activeAllocation = useMemo(() => {
    if (!selectedLineId) return null;
    return (allocations || []).filter(a => a.lineNumber === selectedLineId).sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0];
  }, [selectedLineId, allocations]);
  
  const activeOrder = useMemo(() => activeAllocation ? (orders || []).find(o => o.id === activeAllocation.orderNumber) : null, [activeAllocation, orders]);
  const activeStyle = useMemo(() => activeOrder ? (styles || []).find(s => s.id === activeOrder.styleId) : null, [activeOrder, styles]);

  const lineChecksToday = useMemo(() => (checks || []).filter(c => c.lineNumber === selectedLineId && new Date(c.timestamp).toDateString() === new Date().toDateString()), [checks, selectedLineId]);
  
  const kpis = useMemo(() => {
      const total = lineChecksToday.length;
      if (total === 0) return { pass: 0, rework: 0, reject: 0, rft: 0 };
      const pass = lineChecksToday.filter(c => c.status === 'Pass').length;
      const rework = lineChecksToday.filter(c => c.status === 'Rework').length;
      const reject = lineChecksToday.filter(c => c.status === 'Reject').length;
      return { pass, rework, reject, rft: (pass / total) * 100 };
  }, [lineChecksToday]);

  const pendingRework = useMemo(() => {
    return (checks || []).filter(c => c.lineNumber === selectedLineId && c.status === 'Rework' && c.reworkStatus === 'pending')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [checks, selectedLineId]);

  const handleMarkAsRepaired = (check: EndLineCheck) => {
    onUpdateCheck({ ...check, reworkStatus: 'completed' });
  };

  const handleSave = (status: 'Pass' | 'Rework' | 'Reject') => {
    if (!activeAllocation || !activeOrder || !activeStyle) {
        alert("Active line/order context is missing.");
        return;
    }

    const activeCard = (kanbanEntries || []).find(k => k.lineNumber === selectedLineId && k.status === 'active');
    if (!activeCard) {
        alert("No active KANBAN card found for this line to associate with the inspection.");
        return;
    }
    
    const newCheck: Omit<EndLineCheck, 'id'> = {
        timestamp: new Date().toISOString(),
        lineNumber: selectedLineId,
        orderNumber: activeOrder.id,
        styleNumber: activeStyle.id,
        checkerId: currentUser.id,
        kanbanCardId: activeCard.id,
        status,
    };
    
    if (status === 'Rework' || status === 'Reject') {
        if (!reworkData.defectId || !reworkData.responsibleOpId) {
            alert('Please select a defect and the responsible operation.');
            return;
        }
        
        const checkerLetter = checkerCodeMap.get(currentUser.id) || 'X';
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysDefectsByChecker = (checks || []).filter(c =>
            c.checkerId === currentUser.id &&
            c.timestamp.startsWith(todayStr) &&
            (c.status === 'Rework' || c.status === 'Reject')
        ).length;

        const defectCounter = todaysDefectsByChecker + 1;
        const formattedCounter = String(defectCounter).padStart(2, '0');

        newCheck.defectToken = `${checkerLetter}${formattedCounter}`;
        newCheck.defectId = reworkData.defectId;
        newCheck.responsibleOpId = reworkData.responsibleOpId;
        newCheck.responsibleEmpId = (activeAllocation.assignments || []).find(a => a.operationId === reworkData.responsibleOpId)?.employeeIds[0];
        if (status === 'Rework') {
            newCheck.reworkStatus = 'pending';
        }
    }

    onSaveCheck(newCheck as EndLineCheck);
    setShowReworkForm(false);
    setReworkData({ defectId: '', responsibleOpId: '', status: null });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">End-of-Line Inspection</h1>
        <p className="text-slate-600 mt-2">Record final quality status for each unit produced.</p>
      </header>

      <div className="max-w-md mb-6">
        <label htmlFor="line-select" className="block text-sm font-medium text-slate-700">Select Line to Inspect</label>
        <select id="line-select" value={selectedLineId} onChange={e => setSelectedLineId(e.target.value)} className="mt-1 block w-full h-10 px-3 border-slate-300 rounded-md">
            <option value="" disabled>Select a Line</option>
            {(lines || []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {selectedLineId && (
          <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white p-4 rounded-lg shadow-md"><div className="text-3xl font-bold text-green-600">{kpis.pass}</div><div className="text-sm text-slate-500">Passed</div></div>
                  <div className="bg-white p-4 rounded-lg shadow-md"><div className="text-3xl font-bold text-yellow-600">{kpis.rework}</div><div className="text-sm text-slate-500">Rework</div></div>
                  <div className="bg-white p-4 rounded-lg shadow-md"><div className="text-3xl font-bold text-red-600">{kpis.reject}</div><div className="text-sm text-slate-500">Rejected</div></div>
                  <div className="bg-white p-4 rounded-lg shadow-md"><div className="text-3xl font-bold text-blue-600">{kpis.rft.toFixed(1)}%</div><div className="text-sm text-slate-500">RFT</div></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => handleSave('Pass')} className="p-8 bg-green-500 text-white font-bold text-2xl rounded-lg shadow-lg hover:bg-green-600 transition-colors">PASS</button>
                  <button onClick={() => {setShowReworkForm(true); setReworkData({...reworkData, status: 'Rework'})}} className="p-8 bg-yellow-500 text-white font-bold text-2xl rounded-lg shadow-lg hover:bg-yellow-600 transition-colors">REWORK</button>
                  <button onClick={() => {setShowReworkForm(true); setReworkData({...reworkData, status: 'Reject'})}} className="p-8 bg-red-500 text-white font-bold text-2xl rounded-lg shadow-lg hover:bg-red-600 transition-colors">REJECT</button>
              </div>

              {showReworkForm && (
                  <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                      <h3 className="font-semibold text-lg">Log Defect Details</h3>
                      <div>
                          <label className="text-sm">Defect Type</label>
                          <select value={reworkData.defectId} onChange={e => setReworkData({...reworkData, defectId: e.target.value})} className="mt-1 block w-full h-10 px-3 border-slate-300 rounded-md">
                              <option value="">Select Defect</option>
                              {(defects || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                      </div>
                       <div>
                          <label className="text-sm">Responsible Operation</label>
                          <select value={reworkData.responsibleOpId} onChange={e => setReworkData({...reworkData, responsibleOpId: e.target.value})} className="mt-1 block w-full h-10 px-3 border-slate-300 rounded-md">
                              <option value="">Select Operation</option>
                              {(activeAllocation?.assignments || []).map(a => <option key={a.operationId} value={a.operationId}>{(operations || []).find(o=>o.id===a.operationId)?.name}</option>)}
                          </select>
                      </div>
                      <div className="flex justify-end gap-4">
                          <button onClick={() => setShowReworkForm(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                          <button onClick={() => { if (reworkData.status) { handleSave(reworkData.status) }}} className={`px-4 py-2 text-sm text-white font-semibold rounded-md ${reworkData.status === 'Rework' ? 'bg-yellow-500' : 'bg-red-500'}`}>Confirm {reworkData.status}</button>
                      </div>
                  </div>
              )}
              
              <div className="bg-white p-4 rounded-xl shadow-md">
                <h2 className="font-semibold text-slate-800 mb-2">Pending Rework Items</h2>
                <div className="max-h-[40vh] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white"><tr className="border-b">
                            <th className="p-2 text-left">Token</th>
                            <th className="p-2 text-left">Defect</th>
                            <th className="p-2 text-left">Responsible Op.</th>
                            <th className="p-2 text-left">Checker</th>
                            <th className="p-2 text-left">Timestamp</th>
                            <th className="p-2 text-right">Action</th>
                        </tr></thead>
                        <tbody>
                            {pendingRework.map(item => (
                                <tr key={item.id} className="border-b hover:bg-slate-50">
                                    <td className="p-2 font-mono text-yellow-700">{item.defectToken}</td>
                                    <td className="p-2">{defectsMap.get(item.defectId || '')}</td>
                                    <td className="p-2">{operationsMap.get(item.responsibleOpId || '')} ({employeesMap.get(item.responsibleEmpId || '')})</td>
                                    <td className="p-2 text-xs text-slate-500">{staffMap.get(item.checkerId)}</td>
                                    <td className="p-2 text-xs text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</td>
                                    <td className="p-2 text-right">
                                        <button onClick={() => handleMarkAsRepaired(item)} className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Mark as Repaired</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {pendingRework.length === 0 && <p className="text-center py-8 text-slate-400">No items are pending rework for this line.</p>}
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default EndLineInspectionPage;
