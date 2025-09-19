import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Order, Style, MasterDataItem, Customer, OrderColorQuantity, FactorySettings, CustomFieldDefinition } from '../types';
import { XIcon, PlusIcon, TrashIcon } from './IconComponents';
import { FormField } from './FormField';

interface OrderEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Omit<Order, 'creationDate'>) => void;
  orderToEdit: Order | null;
  styles: Style[];
  colors: MasterDataItem[];
  customers: Customer[];
  existingOrders: Order[];
  onAddCustomer: (name: string) => Promise<Customer | null>;
  factorySettings: FactorySettings;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export const OrderEntryModal = ({
  isOpen,
  onClose,
  onSave,
  orderToEdit,
  styles,
  colors,
  customers,
  existingOrders,
  onAddCustomer,
  factorySettings,
}: OrderEntryModalProps) => {
  const [orderId, setOrderId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState('');
  const [quantities, setQuantities] = useState<OrderColorQuantity[]>([]);
  const [deliveryDate, setDeliveryDate] = useState(getTodayString());
  const [poDate, setPoDate] = useState(getTodayString());
  const [customData, setCustomData] = useState<Record<string, any>>({});

  // State for adding a new quantity
  const [currentColorId, setCurrentColorId] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  
  // State for new customer input
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  const isEditing = useMemo(() => orderToEdit !== null, [orderToEdit]);
  const customFields = useMemo(() => factorySettings.customFieldDefinitions.filter(f => f.targetEntity === 'Order'), [factorySettings]);

  const selectedStyle = useMemo(() => styles.find(s => s.id === selectedStyleId), [selectedStyleId, styles]);

  const availableColorsForStyle = useMemo(() => {
    if (!selectedStyle) return [];
    const addedColorIds = new Set(quantities.map(q => q.colorId));
    return colors.filter(c => selectedStyle.colorIds.includes(c.id) && !addedColorIds.has(c.id));
  }, [selectedStyle, colors, quantities]);

  const resetForm = useCallback(() => {
    setOrderId('');
    setCustomerId('');
    setSelectedStyleId('');
    setQuantities([]);
    setDeliveryDate(getTodayString());
    setPoDate(getTodayString());
    setCurrentColorId('');
    setCurrentQuantity('');
    setIsAddingCustomer(false);
    setNewCustomerName('');
    setCustomData({});
  }, []);
  
  useEffect(() => {
    if (isOpen) {
        if (isEditing && orderToEdit) {
            setOrderId(orderToEdit.id);
            setCustomerId(customers.find(c => c.name === orderToEdit.customer)?.id || '');
            setSelectedStyleId(orderToEdit.styleId);
            setQuantities(orderToEdit.quantities);
            setDeliveryDate(orderToEdit.deliveryDate);
            setPoDate(orderToEdit.poDate);
            setCustomData(orderToEdit.customData || {});
        } else {
            resetForm();
        }
    }
  }, [isOpen, isEditing, orderToEdit, customers, resetForm]);
  
  const handleAddQuantity = () => {
      const quantityValue = parseInt(currentQuantity, 10);
      if (!currentColorId || !quantityValue || quantityValue <= 0) {
          alert('Please select a color and enter a quantity greater than 0.');
          return;
      }
      setQuantities(prev => [...prev, { colorId: currentColorId, quantity: quantityValue }]);
      setCurrentColorId('');
      setCurrentQuantity('');
  };

  const handleRemoveQuantity = (colorIdToRemove: string) => {
      setQuantities(prev => prev.filter(q => q.colorId !== colorIdToRemove));
  };
  
  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim()) return;
    const newCustomer = await onAddCustomer(newCustomerName);
    if (newCustomer) {
        setCustomerId(newCustomer.id);
        setNewCustomerName('');
        setIsAddingCustomer(false);
    }
  };
  
  const handleCustomDataChange = (fieldName: string, value: any) => {
      setCustomData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOrderId = orderId.trim();
    if (!trimmedOrderId || !customerId || !selectedStyleId || !deliveryDate || !poDate) {
      alert('Please fill out all fields.');
      return;
    }
    
    if (existingOrders.some(o => o.id.toLowerCase() === trimmedOrderId.toLowerCase() && o.id !== orderToEdit?.id)) {
      alert('An order with this ID already exists.');
      return;
    }

    if (quantities.length === 0) {
        alert('Please add at least one color with a quantity.');
        return;
    }
    
    const style = styles.find(s => s.id === selectedStyleId);
    const customer = customers.find(c => c.id === customerId);
    if (!style || !customer) return;

    const orderData: Omit<Order, 'creationDate'> = {
      id: trimmedOrderId,
      name: `Order #${trimmedOrderId} (${style.name})`,
      customer: customer.name,
      styleId: selectedStyleId,
      quantities: quantities,
      deliveryDate: deliveryDate,
      poDate: poDate,
      customData,
    };

    onSave(orderData);
    onClose();
  };
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  const getColorName = (colorId: string) => colors.find(c => c.id === colorId)?.name || 'Unknown Color';

  const renderCustomField = (field: CustomFieldDefinition) => {
    const commonProps = {
      id: `custom-${field.fieldName}`,
      name: field.fieldName,
      value: customData[field.fieldName] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => handleCustomDataChange(field.fieldName, e.target.value),
      className: "w-full h-10 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition"
    };

    switch (field.fieldType) {
      case 'number':
        return <input type="number" {...commonProps} />;
      case 'date':
        return <input type="date" {...commonProps} />;
      case 'dropdown':
        return (
          <select {...commonProps}>
            <option value="">Select an option</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'text':
      default:
        return <input type="text" {...commonProps} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl transform transition-all" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{isEditing ? 'Edit Order' : 'Create New Order'}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Close modal">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Order Number" htmlFor="modalOrderNumber">
                <input type="text" id="modalOrderNumber" value={orderId} onChange={e => setOrderId(e.target.value)} required autoFocus disabled={isEditing} className="w-full h-10 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition disabled:bg-slate-100 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed" />
              </FormField>
              <FormField label="PO Date" htmlFor="poDate">
                <input type="date" id="poDate" value={poDate} onChange={e => setPoDate(e.target.value)} required className="w-full h-10 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition" />
              </FormField>
              <FormField label="Delivery Date" htmlFor="deliveryDate">
                <input type="date" id="deliveryDate" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} required className="w-full h-10 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition" />
              </FormField>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Customer" htmlFor="modalCustomer">
                  <div className="flex items-center gap-2">
                      <select id="modalCustomer" value={customerId} onChange={e => setCustomerId(e.target.value)} required className="w-full h-10 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition">
                        <option value="" disabled>Select a Customer</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <button type="button" onClick={() => setIsAddingCustomer(p => !p)} className="flex-shrink-0 p-2 text-[#2c4e8a] bg-[#2c4e8a]/10 dark:bg-[#2c4e8a]/20 rounded-full hover:bg-[#2c4e8a]/20 dark:hover:bg-[#2c4e8a]/30 transition-colors" aria-label="Add new customer">
                        <PlusIcon className="w-5 h-5" />
                      </button>
                  </div>
                   {isAddingCustomer && (
                      <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            placeholder="New Customer Name"
                            className="flex-grow h-10 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewCustomer(); } }}
                          />
                          <button type="button" onClick={handleAddNewCustomer} className="px-4 py-2 bg-[#2c4e8a] text-white font-semibold rounded-md hover:bg-[#213a69] disabled:bg-[#2c4e8a]/50" disabled={!newCustomerName.trim()}>
                            Add
                          </button>
                      </div>
                  )}
                </FormField>
                <FormField label="Style" htmlFor="modalStyleId">
                    <select id="modalStyleId" value={selectedStyleId} onChange={e => { setSelectedStyleId(e.target.value); setQuantities([]); }} required className="w-full h-10 px-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition">
                        <option value="" disabled>Select a Style</option>
                        {styles.map(style => <option key={style.id} value={style.id}>{style.name}</option>)}
                    </select>
                </FormField>
            </div>
            
            {customFields.length > 0 && <hr className="my-4 dark:border-slate-700"/>}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customFields.map(field => (
                    <FormField key={field.id} label={field.label} htmlFor={`custom-${field.fieldName}`}>
                        {renderCustomField(field)}
                    </FormField>
                ))}
             </div>

            {selectedStyleId && (
              <div className="pt-2">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color-wise Quantities</h3>
                <div className="space-y-3 rounded-md border border-slate-200 dark:border-slate-700 p-4">
                   {/* Table of added quantities */}
                   {quantities.length > 0 && (
                     <ul className="space-y-2 mb-4">
                       {quantities.map(q => (
                         <li key={q.colorId} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md">
                           <span className="text-sm text-slate-800 dark:text-slate-200">{getColorName(q.colorId)}</span>
                           <div className="flex items-center gap-4">
                             <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{q.quantity.toLocaleString()} units</span>
                             <button type="button" onClick={() => handleRemoveQuantity(q.colorId)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-full" aria-label="Remove color quantity">
                               <TrashIcon className="w-4 h-4"/>
                             </button>
                           </div>
                         </li>
                       ))}
                     </ul>
                   )}
                   {/* Form to add a new quantity */}
                   <div className="flex items-end gap-2">
                     <div className="flex-1">
                        <label htmlFor="color-select" className="text-xs font-medium text-slate-600 dark:text-slate-400">Color</label>
                        <select id="color-select" value={currentColorId} onChange={e => setCurrentColorId(e.target.value)} className="w-full h-10 px-3 mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition" disabled={availableColorsForStyle.length === 0}>
                            <option value="" disabled>{availableColorsForStyle.length > 0 ? 'Select a color' : 'All colors added'}</option>
                            {availableColorsForStyle.map(color => <option key={color.id} value={color.id}>{color.name}</option>)}
                        </select>
                     </div>
                     <div className="w-28">
                         <label htmlFor="quantity-input" className="text-xs font-medium text-slate-600 dark:text-slate-400">Quantity</label>
                        <input type="number" id="quantity-input" value={currentQuantity} onChange={e => setCurrentQuantity(e.target.value)} placeholder="0" min="1" className="w-full h-10 px-3 mt-1 text-right bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-[#2c4e8a] focus:border-[#2c4e8a] transition" />
                     </div>
                     <button type="button" onClick={handleAddQuantity} disabled={!currentColorId || !currentQuantity} className="h-10 px-4 bg-[#2c4e8a]/10 text-[#2c4e8a] font-semibold rounded-md hover:bg-[#2c4e8a]/20 disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition">Add</button>
                   </div>
                </div>
              </div>
            )}
          </div>

          <footer className="flex justify-end p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
            <button type="submit" className="px-6 py-2 bg-[#2c4e8a] text-white font-semibold rounded-md hover:bg-[#213a69] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c4e8a] disabled:bg-[#2c4e8a]/50 transition" disabled={!orderId || !customerId || !selectedStyleId || quantities.length === 0}>
              {isEditing ? 'Save Changes' : 'Create Order'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};