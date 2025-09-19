
import React, { useState, useMemo } from 'react';
import type { Order, Style, KpiSetting, ProductionEntry, EndLineCheck, InLineAudit, AqlInspection, NonConformanceReport, Defect, Operation, Staff, Customer, MasterDataItem, FactorySettings, DailyLinePlan, KanbanEntry, Line, Employee, AllData } from '../types';
import { OrderReportDetail } from '../components/OrderReportDetail';
import { NCModal } from '../components/NCModal';

// FIX: Update interface to correctly receive allData and specific handlers
interface OrderClosingReportPageProps extends AllData {
  onSaveNcReport: (nc: NonConformanceReport) => void;
}

const OrderClosingReportPage = (props: OrderClosingReportPageProps) => {
    const { orders, onSaveNcReport } = props;
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isNcModalOpen, setIsNcModalOpen] = useState(false);
    const [ncInitialData, setNcInitialData] = useState<Partial<NonConformanceReport> | null>(null);

    const selectedOrder = useMemo(() => {
        return (orders || []).find(o => o.id === selectedOrderId);
    }, [selectedOrderId, orders]);
    
    const handleCreateNc = (source: string, sourceId: string, details: string) => {
        setNcInitialData({ source, sourceId, details });
        setIsNcModalOpen(true);
    };

    return (
        <>
            <div className="p-4 sm:p-6 md:p-8">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Order Closing Report</h1>
                    <p className="text-slate-600 mt-2">Generate a comprehensive performance report for any completed order.</p>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-md">
                         <h3 className="font-semibold text-slate-800 mb-2">Select an Order</h3>
                         <div className="max-h-[70vh] overflow-y-auto">
                            <ul className="space-y-2">
                                {(orders || []).map(order => (
                                    <li 
                                        key={order.id} 
                                        onClick={() => setSelectedOrderId(order.id)}
                                        className={`p-2 rounded-md cursor-pointer ${selectedOrderId === order.id ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-slate-100'}`}
                                    >
                                        <p className="font-semibold text-sm">{order.id}</p>
                                        <p className="text-xs text-slate-500">{order.customer}</p>
                                    </li>
                                ))}
                            </ul>
                         </div>
                    </div>

                    <div className="lg:col-span-3">
                        {selectedOrder ? (
                            <OrderReportDetail 
                                order={selectedOrder}
                                allData={props}
                                onCreateNc={handleCreateNc}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center bg-white rounded-xl shadow-md">
                                <p className="text-slate-500">Select an order to view its detailed report.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {isNcModalOpen && (
                <NCModal
                    isOpen={isNcModalOpen}
                    onClose={() => setIsNcModalOpen(false)}
                    onSave={(nc) => { onSaveNcReport(nc); setIsNcModalOpen(false); }}
                    ncToEdit={{...ncInitialData, id: ''} as NonConformanceReport}
                    staff={props.staff}
                />
            )}
        </>
    );
};

export default OrderClosingReportPage;
