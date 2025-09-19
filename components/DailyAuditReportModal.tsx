import React, { useMemo } from 'react';
import type { InLineAudit, Line, Staff, Defect, Employee, Operation } from '../types';
import { XIcon, PrinterIcon } from './IconComponents';

interface DailyAuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  audits: InLineAudit[];
  lines: Line[];
  staff: Staff[];
  defects: Defect[];
  employees: Employee[];
  operations: Operation[];
}

export const DailyAuditReportModal = ({ isOpen, onClose, audits, lines, staff, defects, employees, operations }: DailyAuditReportModalProps) => {

  const reportData = useMemo(() => {
    const summaryByLine = new Map<string, { totalChecks: number; green: number; yellow: number; red: number; totalDefects: number }>();
    const allDefectsLog: any[] = [];

    let totalChecks = 0;
    let totalDefectivePieces = 0;
    const defectCounts = new Map<string, number>();
    const operatorDefectCounts = new Map<string, number>();

    audits.forEach(audit => {
      const lineId = audit.lineNumber;
      if (!summaryByLine.has(lineId)) {
        summaryByLine.set(lineId, { totalChecks: 0, green: 0, yellow: 0, red: 0, totalDefects: 0 });
      }
      const summary = summaryByLine.get(lineId)!;
      
      audit.records.forEach(record => {
        summary.totalChecks++;
        summary.totalDefects += record.defectsFound;
        if (record.status === 'Green') summary.green++;
        else if (record.status === 'Yellow') summary.yellow++;
        else if (record.status === 'Red') summary.red++;

        // For overall summary
        totalChecks++;
        totalDefectivePieces += record.defectsFound;
        
        if (record.defectsFound > 0) {
            allDefectsLog.push({
                ...record,
                lineNumber: audit.lineNumber,
                visitNumber: audit.visitNumber,
            });

            const defectIdKey = record.defectId || 'unspecified';
            defectCounts.set(defectIdKey, (defectCounts.get(defectIdKey) || 0) + record.defectsFound);
            
            operatorDefectCounts.set(record.employeeId, (operatorDefectCounts.get(record.employeeId) || 0) + record.defectsFound);
        }
      });
    });

    const linesMap = new Map(lines.map(l => [l.id, l.name]));
    const staffMap = new Map(staff.map(s => [s.id, s.name]));
    const defectsMap = new Map(defects.map(d => [d.id, d.name]));
    const employeesMap = new Map(employees.map(e => [e.id, e.name]));
    const operationsMap = new Map(operations.map(o => [o.id, o.name]));
    
    const dpu = totalChecks > 0 ? (totalDefectivePieces / (totalChecks * 5)) * 100 : 0;
    
    const topDefects = Array.from(defectCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([defectId, count]) => ({
        name: defectId === 'unspecified' ? 'Unspecified' : (defectsMap.get(defectId) || 'Unknown'),
        count,
      }));

    const topOperators = Array.from(operatorDefectCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([employeeId, count]) => ({
        name: employeesMap.get(employeeId) || 'Unknown',
        count,
      }));


    return {
      summary: Array.from(summaryByLine.entries()).map(([lineId, data]) => ({
        lineName: linesMap.get(lineId) || 'Unknown Line',
        ...data,
        dpu: data.totalChecks > 0 ? (data.totalDefects / (data.totalChecks * 5)) * 100 : 0
      })),
      defects: allDefectsLog.map(d => ({
          ...d,
          lineName: linesMap.get(d.lineNumber),
          defectName: d.defectId ? defectsMap.get(d.defectId) : 'Unspecified',
          employeeName: employeesMap.get(d.employeeId),
          operationName: operationsMap.get(d.operationId),
      })).sort((a,b) => (a.lineName || '').localeCompare(b.lineName || '')),
      qualitySummary: { totalChecks, totalDefectivePieces, dpu },
      topDefects,
      topOperators,
    };
  }, [audits, lines, staff, defects, employees, operations]);

  const handlePrint = () => {
    window.print();
  };

  const printStyles = `
    @media print {
      body * { visibility: hidden; }
      #audit-report-modal, #audit-report-modal * { visibility: visible; }
      #audit-report-modal {
        position: absolute; left: 0; top: 0; width: 100%; height: 100%;
        margin: 0; padding: 1.5rem; border: none; box-shadow: none;
        font-size: 10pt;
      }
      .print-hidden { display: none !important; }
      @page { size: A4 landscape; margin: 1cm; }
    }
  `;

  if (!isOpen) return null;

  return (
    <>
      <style>{printStyles}</style>
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div id="audit-report-modal" className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <header className="flex-shrink-0 p-4 border-b dark:border-slate-700 flex justify-between items-center print-hidden">
            <div>
              <h2 className="text-lg font-semibold">Daily In-Line Audit Report</h2>
              <p className="text-sm text-slate-500">For date: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-sm font-semibold rounded-md"><PrinterIcon className="w-4 h-4" /> Print</button>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-6 h-6"/></button>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-y-auto">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Line Summary</h3>
            <table className="w-full text-sm text-left mb-6">
                <thead className="bg-slate-50 dark:bg-slate-700"><tr className="text-xs text-slate-600 dark:text-slate-300">
                    <th className="p-2 font-semibold">Line</th>
                    <th className="p-2 font-semibold text-center">Total Checks</th>
                    <th className="p-2 font-semibold text-center">Green</th>
                    <th className="p-2 font-semibold text-center">Yellow</th>
                    <th className="p-2 font-semibold text-center">Red</th>
                    <th className="p-2 font-semibold text-right">Total Defects</th>
                    <th className="p-2 font-semibold text-right">DPU %</th>
                </tr></thead>
                <tbody>
                    {reportData.summary.map(s => (
                        <tr key={s.lineName} className="border-b dark:border-slate-700">
                            <td className="p-2 font-medium">{s.lineName}</td>
                            <td className="p-2 text-center font-mono">{s.totalChecks}</td>
                            <td className="p-2 text-center font-mono text-green-600">{s.green}</td>
                            <td className="p-2 text-center font-mono text-yellow-600">{s.yellow}</td>
                            <td className="p-2 text-center font-mono text-red-600">{s.red}</td>
                            <td className="p-2 text-right font-mono font-semibold">{s.totalDefects}</td>
                            <td className="p-2 text-right font-mono font-semibold">{s.dpu.toFixed(2)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Overall Summary</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline"><span className="text-slate-500 dark:text-slate-400">Total Checks</span><span className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono">{reportData.qualitySummary.totalChecks.toLocaleString()}</span></div>
                        <div className="flex justify-between items-baseline"><span className="text-slate-500 dark:text-slate-400">Total Defects</span><span className="text-2xl font-bold text-red-600 font-mono">{reportData.qualitySummary.totalDefectivePieces.toLocaleString()}</span></div>
                        <div className="flex justify-between items-baseline"><span className="text-slate-500 dark:text-slate-400">DPU %</span><span className="text-2xl font-bold text-red-600 font-mono">{reportData.qualitySummary.dpu.toFixed(2)}%</span></div>
                    </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Top 3 Defects</h4>
                    <ul className="space-y-1">{reportData.topDefects.map((d, i) => (<li key={i} className="flex justify-between text-sm"><span className="text-slate-700 dark:text-slate-200">{d.name}</span><span className="font-semibold text-slate-800 dark:text-slate-100 font-mono">{d.count}</span></li>))}</ul>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Top 3 Defective Operators</h4>
                    <ul className="space-y-1">{reportData.topOperators.map((o, i) => (<li key={i} className="flex justify-between text-sm"><span className="text-slate-700 dark:text-slate-200">{o.name}</span><span className="font-semibold text-slate-800 dark:text-slate-100 font-mono">{o.count}</span></li>))}</ul>
                </div>
            </div>

            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Defect Log</h3>
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-700"><tr className="text-xs text-slate-600 dark:text-slate-300">
                    <th className="p-2 font-semibold">Line</th>
                    <th className="p-2 font-semibold">Visit</th>
                    <th className="p-2 font-semibold">Operator</th>
                    <th className="p-2 font-semibold">Operation</th>
                    <th className="p-2 font-semibold">Defect</th>
                    <th className="p-2 font-semibold text-right">Qty</th>
                </tr></thead>
                <tbody>
                     {reportData.defects.map((d, i) => (
                        <tr key={`${d.id}-${i}`} className="border-b dark:border-slate-700">
                            <td className="p-2">{d.lineName}</td>
                            <td className="p-2 text-center">{d.visitNumber}</td>
                            <td className="p-2">{d.employeeName}</td>
                            <td className="p-2">{d.operationName}</td>
                            <td className="p-2 font-medium">{d.defectName}</td>
                            <td className="p-2 text-right font-mono font-semibold">{d.defectsFound}</td>
                        </tr>
                     ))}
                </tbody>
            </table>
             {reportData.defects.length === 0 && <p className="text-center text-slate-400 py-8">No defects recorded today.</p>}
          </main>
        </div>
      </div>
    </>
  );
};
