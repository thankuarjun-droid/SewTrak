import React, { useState, useMemo, useEffect } from 'react';
import type { Line, Order, LineAllocation, Operation, Defect, CorrectiveAction, InLineAudit, Staff, Style, Employee } from '../types';
import { DailyAuditReportModal } from '../components/DailyAuditReportModal';

interface InLineAuditPageProps {
  lines: Line[];
  orders: Order[];
  styles: Style[];
  lineAllocations: LineAllocation[];
  operations: Operation[];
  defects: Defect[];
  correctiveActions: CorrectiveAction[];
  currentUser: Staff;
  inLineAudits: InLineAudit[];
  employees: Employee[];
  staff: Staff[];
  onSaveAudit: (audit: InLineAudit) => void;
}

const InLineAuditPage = ({ lines, orders, styles, lineAllocations, operations, defects, correctiveActions, currentUser, inLineAudits, employees, staff, onSaveAudit }: InLineAuditPageProps) => {
  const [selectedLineId, setSelectedLineId] = useState('');
  const [visitNumber, setVisitNumber] = useState(1);
  const [auditRecords, setAuditRecords] = useState<Map<string, { defectsFound: string; defectId?: string; correctiveActionId?: string }>>(new Map());
  const [editingAudit, setEditingAudit] = useState<InLineAudit | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const operationsMap = useMemo(() => new Map((operations || []).map(o => [o.id, o.name])), [operations]);
  const stylesMap = useMemo(() => new Map((styles || []).map(s => [s.id, s])), [styles]);
  const employeesMap = useMemo(() => new Map((employees || []).map(e => [e.id, e.name])), [employees]);

  const activeAllocation = useMemo(() => {
    if (!selectedLineId) return null;
    return (lineAllocations || [])
      .filter(a => a.lineNumber === selectedLineId)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0];
  }, [selectedLineId, lineAllocations]);

  const styleForLine = useMemo(() => {
    if (!activeAllocation) return null;
    const order = (orders || []).find(o => o.id === activeAllocation.orderNumber);
    return order ? stylesMap.get(order.styleId) : null;
  }, [activeAllocation, orders, stylesMap]);
  
  const operatorsAndOpsForLine = useMemo(() => {
    if (editingAudit) {
        const orderForAudit = orders.find(o => o.id === (lineAllocations.find(a => a.lineNumber === editingAudit.lineNumber)?.orderNumber || ''));
        const style = orderForAudit ? stylesMap.get(orderForAudit.styleId) : null;
        
        return editingAudit.records.map(record => ({
            employeeId: record.employeeId,
            operationId: record.operationId,
            sNo: style?.operationBulletin.find(op => op.operationId === record.operationId)?.sNo || 0
        })).sort((a,b) => a.sNo - b.sNo);
    }
    
    if (!activeAllocation || !styleForLine || !styleForLine.operationBulletin) return [];

    const result: { employeeId: string; operationId: string; sNo: number }[] = [];
    const allocationMap = new Map((activeAllocation.assignments || []).map(a => [a.operationId, a.employeeIds]));

    styleForLine.operationBulletin
      .sort((a, b) => a.sNo - b.sNo)
      .forEach(opItem => {
        const assignedEmployeeIds = allocationMap.get(opItem.operationId) || [];
        assignedEmployeeIds.forEach(employeeId => {
          result.push({
            employeeId: employeeId,
            operationId: opItem.operationId,
            sNo: opItem.sNo,
          });
        });
      });
    return result;
  }, [activeAllocation, styleForLine, editingAudit, orders, lineAllocations, stylesMap]);

  const todaysAudits = useMemo(() => {
    const todayStr = new Date().toDateString();
    return (inLineAudits || [])
      .filter(a => new Date(a.timestamp).toDateString() === todayStr)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [inLineAudits]);

  const operatorHasPreviousHighDefects = useMemo(() => {
    const highDefectOperators = new Set<string>();
    if (!selectedLineId) return highDefectOperators;

    const previousAuditsToday = todaysAudits.filter(
      (audit) => audit.lineNumber === selectedLineId && audit.id !== editingAudit?.id
    );

    for (const audit of previousAuditsToday) {
      for (const record of audit.records) {
        if (record.defectsFound >= 2) {
          highDefectOperators.add(record.employeeId);
        }
      }
    }
    return highDefectOperators;
  }, [todaysAudits, selectedLineId, editingAudit]);

  const resetFormForNewLine = (lineId: string) => {
      setEditingAudit(null);
      setSelectedLineId(lineId);
      const nextVisit = lineId ? (Math.max(0, ...todaysAudits.filter(a => a.lineNumber === lineId).map(a => a.visitNumber)) + 1) : 1;
      setVisitNumber(nextVisit);
  };
  
  useEffect(() => {
    if (editingAudit) return;

    if (operatorsAndOpsForLine.length > 0) {
      const initialRecords = new Map<string, { defectsFound: string; defectId?: string; correctiveActionId?: string }>();
      operatorsAndOpsForLine.forEach(item => {
        const key = `${item.employeeId}-${item.operationId}`;
        initialRecords.set(key, { defectsFound: '' });
      });
      setAuditRecords(initialRecords);
    } else {
      setAuditRecords(new Map());
    }
  }, [operatorsAndOpsForLine, editingAudit]);

  const handleRecordChange = (key: string, field: 'defectsFound' | 'defectId' | 'correctiveActionId', value: string) => {
    setAuditRecords(prev => {
      const newMap = new Map(prev);
      const record = { ...(newMap.get(key) || { defectsFound: '' }) };
      (record as any)[field] = value;

      if (field === 'defectsFound' && (parseInt(value, 10) === 0 || value === '')) {
        record.defectId = '';
        record.correctiveActionId = '';
      }
      
      newMap.set(key, record);
      return newMap;
    });
  };
  
  const handleSelectAuditForEdit = (audit: InLineAudit) => {
    setEditingAudit(audit);
    setSelectedLineId(audit.lineNumber);
    setVisitNumber(audit.visitNumber);

    const recordsMap = new Map<string, { defectsFound: string; defectId?: string; correctiveActionId?: string }>();
    audit.records.forEach(record => {
        const key = `${record.employeeId}-${record.operationId}`;
        recordsMap.set(key, {
            defectsFound: String(record.defectsFound),
            defectId: record.defectId || '',
            correctiveActionId: record.correctiveActionId || '',
        });
    });
    setAuditRecords(recordsMap);
  };

  const handleNewAuditClick = () => {
    const lineToKeep = selectedLineId;
    setEditingAudit(null);
    setSelectedLineId('');
    setTimeout(() => resetFormForNewLine(lineToKeep), 0);
  };
  
  const handleSubmit = () => {
    if (!selectedLineId) {
        alert("Please select a line.");
        return;
    }
    if (auditRecords.size === 0 || Array.from(auditRecords.values()).some(r => r.defectsFound === '')) {
        alert("Please complete the audit for all allocated operators.");
        return;
    }

    const auditToSave: InLineAudit = {
        id: editingAudit ? editingAudit.id : `AUD-${Date.now()}`,
        timestamp: editingAudit ? editingAudit.timestamp : new Date().toISOString(),
        lineNumber: selectedLineId,
        visitNumber,
        auditorId: currentUser.id,
        records: Array.from(auditRecords.entries()).map(([key, record]) => {
            const [employeeId, operationId] = key.split('-');
            const defectsFoundNum = parseInt(record.defectsFound, 10) || 0;
            const hadHighDefects = operatorHasPreviousHighDefects.has(employeeId);
            
            let status: 'Green' | 'Yellow' | 'Red' = 'Green';
            if (defectsFoundNum > 1) {
                status = 'Red';
            } else if (defectsFoundNum === 1) {
                status = 'Yellow';
            } else if (hadHighDefects && defectsFoundNum === 0) {
                status = 'Yellow';
            }

            return {
                operationId,
                employeeId,
                defectsFound: defectsFoundNum,
                status,
                defectId: defectsFoundNum > 0 ? record.defectId : undefined,
                correctiveActionId: defectsFoundNum > 0 ? record.correctiveActionId : undefined,
            }
        })
    };
    onSaveAudit(auditToSave);
    alert(`Audit ${editingAudit ? 'updated' : 'saved'} successfully!`);
    
    const lineJustSaved = selectedLineId;
    handleNewAuditClick();
    setSelectedLineId(lineJustSaved);
  };

  return (
    <>
      <div className="p-4 sm:p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">In-Line Quality Audit</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Perform sequential traffic light audits on active production lines.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                  <div className="flex justify-between items-start">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                          <div>
                              <label htmlFor="line-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Production Line</label>
                              <select id="line-select" value={selectedLineId} onChange={e => resetFormForNewLine(e.target.value)} className="mt-1 block w-full h-10 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                                  <option value="" disabled>Select a Line</option>
                                  {(lines || []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label htmlFor="visit-number" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Visit Number</label>
                              <input type="number" id="visit-number" value={visitNumber} onChange={e => setVisitNumber(parseInt(e.target.value) || 1)} min="1" disabled={!!editingAudit} className="mt-1 block w-full h-10 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md disabled:bg-slate-200 dark:disabled:bg-slate-700/50" />
                          </div>
                      </div>
                      <button onClick={handleNewAuditClick} className="ml-4 mt-6 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 whitespace-nowrap">
                          + New Audit
                      </button>
                  </div>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {operatorsAndOpsForLine.map(item => {
                      const { employeeId, operationId, sNo } = item;
                      const key = `${employeeId}-${operationId}`;
                      const record = auditRecords.get(key);
                      const defectsFoundStr = record?.defectsFound || '';
                      const defectsFoundNum = parseInt(defectsFoundStr, 10) || 0;
                      const hadHighDefects = operatorHasPreviousHighDefects.has(employeeId);
                      
                      let cardColorClass = 'bg-green-100/50 dark:bg-green-900/20 border-green-300 dark:border-green-700';
                      let statusMessage = '';

                      if (defectsFoundNum > 1) {
                          cardColorClass = 'bg-red-100/50 dark:bg-red-900/20 border-red-400 dark:border-red-700';
                      } else if (defectsFoundNum === 1) {
                          cardColorClass = 'bg-yellow-100/50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-700';
                      } else if (hadHighDefects && defectsFoundNum === 0) {
                          cardColorClass = 'bg-yellow-100/50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-700';
                          statusMessage = 'Yellow status retained from previous audit.';
                      }

                      return (
                          <div key={key} className={`p-4 rounded-lg border shadow-sm ${cardColorClass}`}>
                              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                  <span className="font-bold">{employeesMap.get(employeeId) || employeeId}</span> - {sNo}. {operationsMap.get(operationId)}
                              </h3>
                              {statusMessage && <p className="text-xs italic text-yellow-700 dark:text-yellow-300 mt-1">{statusMessage}</p>}
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                  <div>
                                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Defects Found (5 units)</label>
                                      <input type="number" min="0" max="5" value={defectsFoundStr} onChange={e => handleRecordChange(key, 'defectsFound', e.target.value)} placeholder="0" className="mt-1 w-full h-9 px-2 rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"/>
                                  </div>
                                  <div className={`md:col-span-2 grid grid-cols-2 gap-4 ${defectsFoundNum > 0 ? 'transition-opacity duration-300' : 'opacity-40 pointer-events-none transition-opacity duration-300'}`}>
                                      <div>
                                          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Defect Type</label>
                                          <select value={record?.defectId || ''} onChange={e => handleRecordChange(key, 'defectId', e.target.value)} className="mt-1 w-full h-9 px-2 rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                                              <option value="">Select Defect</option>
                                              {(defects || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Corrective Action</label>
                                          <select value={record?.correctiveActionId || ''} onChange={e => handleRecordChange(key, 'correctiveActionId', e.target.value)} className="mt-1 w-full h-9 px-2 rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                                              <option value="">Select Action</option>
                                              {(correctiveActions || []).map(ca => <option key={ca.id} value={ca.id}>{ca.name}</option>)}
                                          </select>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )
                  })}
                  {selectedLineId && operatorsAndOpsForLine.length === 0 && (
                      <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <p className="text-slate-500 dark:text-slate-400">No operators allocated to this line.</p>
                          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Please create a plan in Line Allocation.</p>
                      </div>
                  )}
              </div>
              {operatorsAndOpsForLine.length > 0 && (
                  <div className="flex justify-end">
                      <button onClick={handleSubmit} className="px-8 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md">
                          {editingAudit ? 'Update Audit' : 'Save Audit'}
                      </button>
                  </div>
              )}
          </div>
          <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200">Today's Audits</h3>
                      <button onClick={() => setIsReportModalOpen(true)} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 disabled:text-slate-400" disabled={todaysAudits.length === 0}>
                          Daily Report
                      </button>
                  </div>
                  <div className="max-h-[75vh] overflow-y-auto space-y-2 pr-2">
                      {todaysAudits.map(audit => {
                          const isSelected = editingAudit?.id === audit.id;
                          return (
                          <div 
                              key={audit.id} 
                              onClick={() => handleSelectAuditForEdit(audit)}
                              className={`p-3 rounded-md text-sm cursor-pointer border ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600' : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border-transparent'}`}
                          >
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{(lines || []).find(l=>l.id===audit.lineNumber)?.name} - Visit {audit.visitNumber}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(audit.timestamp).toLocaleTimeString()}</p>
                          </div>
                      )})}
                      {todaysAudits.length === 0 && <p className="text-sm text-slate-400 text-center italic py-4">No audits performed today.</p>}
                  </div>
              </div>
          </div>
        </div>
      </div>
      {isReportModalOpen && (
        <DailyAuditReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            audits={todaysAudits}
            lines={lines}
            staff={staff}
            defects={defects}
            employees={employees}
            operations={operations}
        />
      )}
    </>
  );
};

export default InLineAuditPage;
