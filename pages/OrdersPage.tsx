import React, { useState } from 'react';
import type { Order, Style, MasterDataItem, Customer, FactorySettings } from '../types';
import { OrderEntryModal } from '../components/OrderEntryModal';
import { PlusIcon, PencilIcon, TrashIcon } from '../components/IconComponents';
import { downloadCsv, downloadTemplate } from '../services/exportService';

interface OrdersPageProps {
  orders: Order[];
  styles: Style[];
  colors: MasterDataItem[];
  customers: Customer[];
  factorySettings: FactorySettings;
  onAddOrder: (order: Omit<Order, 'creationDate'>) => void;
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onAddCustomer: (name: string) => Promise<Customer | null>;
}

const OrdersPage = ({ orders = [], styles, colors, customers, factorySettings, onAddOrder, onUpdateOrder, onDeleteOrder, onAddCustomer }: OrdersPageProps) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const handleOpenModalForEdit = (order: Order) => {
    setEditingOrder(order);
    setModalOpen(true);
  };

  const handleOpenModalForCreate = () => {
    setEditingOrder(null);
    setModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingOrder(null);
  }

  const handleSave = (order: Omit<Order, 'creationDate'>) => {
    if (editingOrder) {
      onUpdateOrder({ ...order, creationDate: editingOrder.creationDate });
    } else {
      onAddOrder(order);
    }
  };
  
  const handleDelete = (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
        onDeleteOrder(orderId);
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      alert(`File "${file.name}" selected. In a real application, you would now parse this CSV.`);
      // Logic to read and process the CSV file would go here.
    }
  };

  const handleDownload = () => {
    const dataToExport = orders.map(o => {
        const styleName = styles.find(s => s.id === o.styleId)?.name || '';
        const colorQuantities = o.quantities.reduce((acc, q) => {
            const colorName = colors.find(c => c.id === q.colorId)?.name || q.colorId;
            acc[`qty_${colorName}`] = q.quantity;
            return acc;
        }, {} as Record<string, number>);

        return {
            order_id: o.id,
            customer_name: o.customer,
            style_name: styleName,
            po_date: o.poDate,
            creation_date: o.creationDate,
            delivery_date: o.deliveryDate,
            ...colorQuantities,
            ...o.customData
        };
    });

    downloadCsv(dataToExport, 'orders');
  };

  return (
    <>
      <div className="p-4 sm:p-6 md:p-10">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Orders</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">View, create, edit, or delete orders.</p>
          </div>
          <button
            onClick={handleOpenModalForCreate}
            className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-[#2c4e8a] text-white font-semibold rounded-md hover:bg-[#213a69] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c4e8a] transition"
          >
            <PlusIcon className="w-5 h-5" />
            Create New Order
          </button>
        </header>

         <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md mb-6">
             <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">Data Management</h3>
             <div className="flex flex-wrap gap-2">
                <button onClick={handleDownload} className="text-sm font-medium py-2 px-4 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">Download CSV</button>
                <button onClick={() => downloadTemplate(['id', 'customer', 'styleId', 'colorId', 'quantity', 'poDate', 'deliveryDate'])} className="text-sm font-medium py-2 px-4 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">Download Template</button>
                <input type="file" id="csvUploadOrders" className="hidden" accept=".csv" onChange={handleFileUpload} />
                <label htmlFor="csvUploadOrders" className="text-sm font-medium py-2 px-4 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer">Upload CSV</label>
             </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">For uploads, the template requires one row per color in an order.</p>
        </div>

        <main className="bg-white dark:bg-slate-800 p-2 sm:p-4 rounded-2xl shadow-lg">
          <div className="max-h-[70vh] overflow-y-auto">
            {orders.length > 0 ? (
              <table className="w-full text-left">
                <thead className="border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Order ID</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Customer</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hidden sm:table-cell">Style</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">PO Date</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">Delivery Date</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400 text-right">Total Qty</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const styleName = styles.find(s => s.id === order.styleId)?.name || 'N/A';
                    const totalQty = order.quantities.reduce((sum, item) => sum + item.quantity, 0);
                    return (
                      <tr key={order.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="p-3 text-sm text-slate-800 dark:text-slate-200 font-medium">{order.id}</td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{order.customer}</td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400 hidden sm:table-cell">{styleName}</td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400 hidden lg:table-cell">{new Date(order.poDate + 'T00:00:00').toLocaleDateString()}</td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400 hidden md:table-cell">{new Date(order.deliveryDate + 'T00:00:00').toLocaleDateString()}</td>
                        <td className="p-3 text-sm text-slate-800 dark:text-slate-200 font-medium text-right">{totalQty.toLocaleString()}</td>
                        <td className="p-3 text-sm">
                            <div className="flex justify-end items-center gap-2">
                                <button onClick={() => handleOpenModalForEdit(order)} className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md" aria-label="Edit Order">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(order.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-md" aria-label="Delete Order">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-12">No orders have been created yet.</p>
            )}
          </div>
        </main>
      </div>
      <OrderEntryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        orderToEdit={editingOrder}
        styles={styles}
        colors={colors}
        customers={customers}
        existingOrders={orders}
        onAddCustomer={onAddCustomer}
        factorySettings={factorySettings}
      />
    </>
  );
};

export default OrdersPage;