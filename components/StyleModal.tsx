import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Style, MasterDataItem, OperationBulletinItem, OperatorGrade, Machine, Operation, FactorySettings, Staff, Employee, DailyAttendance, ObStatus, CustomFieldDefinition } from '../types';
import { XIcon, PlusIcon, SparkleIcon } from './IconComponents';
import { FormField } from './FormField';
import { DetailedObView } from './DetailedObView';
import { TimeCaptureModal } from './TimeCaptureModal';

interface StyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (style: Style) => void;
  styleToEdit: Style | null;
  existingStyles: Style[];
  colors: MasterDataItem[];
  operations: Operation[];
  operatorGrades: OperatorGrade[];
  machines: Machine[];
  factorySettings: FactorySettings;
  currentUser: Staff;
  employees: Employee[];
  dailyAttendances: DailyAttendance[];
  onAddColor: (name: string) => Promise<MasterDataItem | null>;
  onAddOperatorGrade: (name: string) => Promise<MasterDataItem | null>;
  onAddMachine: (name: string) => Promise<MasterDataItem | null>;
  onAddOperation: (name: string) => Promise<Operation | null>;
}

export const StyleModal = ({ 
    isOpen, onClose, onSave, styleToEdit, existingStyles, 
    colors, operations, operatorGrades, machines, factorySettings, currentUser, employees, dailyAttendances,
    onAddColor, onAddOperatorGrade, onAddMachine, onAddOperation
}: StyleModalProps) => {
  const [activeTab, setActiveTab] = useState<'details' | 'currentOb' | 'balance' | 'proposedOb'>('details');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  
  // Refactored State: A single state object to hold all style data being edited. This is the single source of truth for the modal.
  const [editableStyle, setEditableStyle] = useState<Style | null>(null);
  
  // UI State (not part of the Style object)
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [timeCaptureState, setTimeCaptureState] = useState<{ isOpen: boolean; sNo: number | null }>({ isOpen: false, sNo: null });

  // Line Balancing State
  const [balanceMode, setBalanceMode] = useState<'target' | 'operators' | 'efficiency'>('target');
  const [balanceTarget, setBalanceTarget] = useState<number>(150);
  const [balanceOperators, setBalanceOperators] = useState<{count: number, multiSkilled: number, maxSkills: number}>({count: 20, multiSkilled: 0, maxSkills: 2});
  const [layoutOptions, setLayoutOptions] = useState<any[] | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<any | null>(null);

  const isEditing = useMemo(() => styleToEdit !== null, [styleToEdit]);
  const isApproved = editableStyle?.obStatus === 'Approved';
  const canEditOb = currentUser.role === 'Admin' || currentUser.role === 'Production Manager' || (currentUser.role === 'Industrial Engineer' && !isApproved);
  const canApprove = currentUser.role === 'Admin' || currentUser.role === 'Production Manager';
  const customFields = useMemo(() => factorySettings.customFieldDefinitions.filter(f => f.targetEntity === 'Style'), [factorySettings]);
  
  const operationNamesMap = useMemo(() => new Map(operations.map(o => [o.id, o.name])), [operations]);
  const machineNamesMap = useMemo(() => new Map(machines.map(m => [m.id, m.name])), [machines]);
  const gradeNamesMap = useMemo(() => new Map(operatorGrades.map(g => [g.id, g.name])), [operatorGrades]);
  
  useEffect(() => {
    if (isOpen) {
      if (isEditing && styleToEdit) {
        // Deep copy the entire object into state once to create an isolated editing context.
        setEditableStyle(JSON.parse(JSON.stringify(styleToEdit)));
      } else {
        // Create a fresh object for a new style.
        setEditableStyle({
            id: `S${Date.now()}`,
            name: '',
            colorIds: [],
            operationBulletin: [],
            obStatus: 'Draft',
            customData: {},
        });
      }
      setActiveTab('details');
      setLayoutOptions(null);
      setSelectedLayout(null);
    }
  }, [isOpen, isEditing, styleToEdit]);

  const handleStyleChange = (field: keyof Style, value: any) => {
    setEditableStyle(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleCustomDataChange = (fieldName: string, value: any) => {
    setEditableStyle(prev => {
        if (!prev) return null;
        const newCustomData = { ...(prev.customData || {}), [fieldName]: value };
        return { ...prev, customData: newCustomData };
    });
  };

  const handleColorToggle = (colorId: string) => {
    setEditableStyle(prev => {
        if (!prev) return null;
        const newColorIds = new Set(prev.colorIds);
        if (newColorIds.has(colorId)) {
            newColorIds.delete(colorId);
        } else {
            newColorIds.add(colorId);
        }
        return { ...prev, colorIds: Array.from(newColorIds) };
    });
  };
  
  const handleAddNewColor = async () => {
    if (!newColorName.trim()) return;
    const newColor = await onAddColor(newColorName.trim());
    if (newColor) {
        handleColorToggle(newColor.id);
        setNewColorName('');
        setIsAddingColor(false);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            handleStyleChange('imageUrl', reader.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        alert("Please select a valid image file.");
    }
  };

  const calculateLayoutStats = (layout: OperationBulletinItem[], totalSmvSeconds: number) => {
    if (layout.length === 0) return { totalOperators: 0, lineEfficiency: 0, hourlyTarget: 0, taktTime: 0 };
    const workstationTimes = new Map<number, number>();
    let totalOperators = 0;
    layout.forEach(op => {
      totalOperators += op.allocatedOperators || 0;
      const opTime = op.pickupTime + op.sewingTime + op.trimAndDisposalTime;
      const allocatedOps = op.allocatedOperators || 1;
      const timePerUnit = opTime / allocatedOps;
      const wsKey = op.workstation!;
      if(allocatedOps > 1) {
          workstationTimes.set(wsKey, Math.max(workstationTimes.get(wsKey) || 0, timePerUnit));
      } else {
          workstationTimes.set(wsKey, (workstationTimes.get(wsKey) || 0) + timePerUnit);
      }
    });
    const bottleneckTime = Math.max(...Array.from(workstationTimes.values()), 0);
    const lineEfficiency = bottleneckTime > 0 && totalOperators > 0 ? (totalSmvSeconds / (bottleneckTime * totalOperators)) * 100 : 0;
    const hourlyTarget = bottleneckTime > 0 ? 3600 / bottleneckTime : 0;
    return { totalOperators, lineEfficiency, hourlyTarget, taktTime: bottleneckTime };
  };

  const generateLayoutOptions = useCallback(() => {
    const baseBulletin = editableStyle?.operationBulletin || [];
    if (baseBulletin.length === 0) {
      alert("Please define the operation bulletin first.");
      return;
    }
    const totalSmvSeconds = baseBulletin.reduce((s, op) => s + op.pickupTime + op.sewingTime + op.trimAndDisposalTime, 0);
  
    // --- Balancing Algorithms ---
    const greedyBalance = (bulletin: OperationBulletinItem[], taktTime: number): OperationBulletinItem[] => {
      const workstations: { time: number; ops: OperationBulletinItem[] }[] = [];
      let currentWorkstation = { time: 0, ops: [] as OperationBulletinItem[] };
  
      bulletin.forEach(op => {
        const opTime = op.pickupTime + op.sewingTime + op.trimAndDisposalTime;
        if (opTime > taktTime) { // Operation is a bottleneck
          if (currentWorkstation.ops.length > 0) workstations.push(currentWorkstation);
          const operatorsNeeded = Math.ceil(opTime / taktTime);
          workstations.push({ time: opTime / operatorsNeeded, ops: [{ ...op, allocatedOperators: operatorsNeeded }] });
          currentWorkstation = { time: 0, ops: [] };
        } else if (currentWorkstation.time + opTime <= taktTime) {
          currentWorkstation.ops.push({ ...op, allocatedOperators: 1 });
          currentWorkstation.time += opTime;
        } else {
          if (currentWorkstation.ops.length > 0) workstations.push(currentWorkstation);
          currentWorkstation = { time: opTime, ops: [{ ...op, allocatedOperators: 1 }] };
        }
      });
  
      if (currentWorkstation.ops.length > 0) workstations.push(currentWorkstation);
  
      const balancedLayout: OperationBulletinItem[] = [];
      workstations.forEach((ws, index) => {
        ws.ops.forEach(op => balancedLayout.push({ ...op, workstation: index + 1 }));
      });
      return balancedLayout.sort((a, b) => a.sNo - b.sNo);
    };

    const bestFitGreedyBalance = (bulletin: OperationBulletinItem[], taktTime: number): OperationBulletinItem[] => {
      const workstations: { time: number; ops: OperationBulletinItem[] }[] = [];
    
      bulletin.forEach(op => {
          const opTime = op.pickupTime + op.sewingTime + op.trimAndDisposalTime;

          if (opTime > taktTime) { // Handle bottleneck ops first
              const operatorsNeeded = Math.ceil(opTime / taktTime);
              workstations.push({ time: opTime / operatorsNeeded, ops: [{ ...op, allocatedOperators: operatorsNeeded }] });
              return;
          }

          let bestFitIndex = -1;
          let minRemainingTime = Infinity;

          workstations.forEach((ws, i) => {
              const remainingTime = taktTime - ws.time;
              if (opTime <= remainingTime) {
                  if (remainingTime < minRemainingTime) {
                      minRemainingTime = remainingTime;
                      bestFitIndex = i;
                  }
              }
          });

          if (bestFitIndex !== -1) {
              workstations[bestFitIndex].ops.push({ ...op, allocatedOperators: 1 });
              workstations[bestFitIndex].time += opTime;
          } else {
              workstations.push({ time: opTime, ops: [{ ...op, allocatedOperators: 1 }] });
          }
      });

      const balancedLayout: OperationBulletinItem[] = [];
      workstations.forEach((ws, index) => {
          ws.ops.forEach(op => balancedLayout.push({ ...op, workstation: index + 1 }));
      });
      return balancedLayout.sort((a, b) => a.sNo - b.sNo);
    };

    const worstFitGreedyBalance = (bulletin: OperationBulletinItem[], taktTime: number): OperationBulletinItem[] => {
      const workstations: { time: number; ops: OperationBulletinItem[] }[] = [];
    
      bulletin.forEach(op => {
          const opTime = op.pickupTime + op.sewingTime + op.trimAndDisposalTime;

          if (opTime > taktTime) { // Handle bottleneck
              const operatorsNeeded = Math.ceil(opTime / taktTime);
              workstations.push({ time: opTime / operatorsNeeded, ops: [{ ...op, allocatedOperators: operatorsNeeded }] });
              return;
          }

          let worstFitIndex = -1;
          let maxRemainingTime = -1;

          // Find the workstation with the most remaining space that can fit the op
          workstations.forEach((ws, i) => {
              const remainingTime = taktTime - ws.time;
              if (opTime <= remainingTime) {
                  if (remainingTime > maxRemainingTime) {
                      maxRemainingTime = remainingTime;
                      worstFitIndex = i;
                  }
              }
          });

          if (worstFitIndex !== -1) {
              workstations[worstFitIndex].ops.push({ ...op, allocatedOperators: 1 });
              workstations[worstFitIndex].time += opTime;
          } else {
              // If no existing workstation can fit it, start a new one
              workstations.push({ time: opTime, ops: [{ ...op, allocatedOperators: 1 }] });
          }
      });

      const balancedLayout: OperationBulletinItem[] = [];
      workstations.forEach((ws, index) => {
          ws.ops.forEach(op => balancedLayout.push({ ...op, workstation: index + 1 }));
      });
      return balancedLayout.sort((a, b) => a.sNo - b.sNo);
    };

    const rankedPositionalWeightBalance = (bulletin: OperationBulletinItem[], taktTime: number): OperationBulletinItem[] => {
      const opsWithTime = bulletin
          .map(op => ({ ...op, opTime: op.pickupTime + op.sewingTime + op.trimAndDisposalTime }))
          .sort((a, b) => b.sNo - a.sNo);
  
      let cumulativeTime = 0;
      const opsWithPw = opsWithTime.map(op => {
          cumulativeTime += op.opTime;
          return { ...op, positionalWeight: cumulativeTime };
      }).sort((a, b) => b.positionalWeight - a.positionalWeight);
  
      const workstations: { time: number; ops: (typeof opsWithPw[0])[] }[] = [];
  
      opsWithPw.forEach(op => {
          if (op.opTime > taktTime) {
              const operatorsNeeded = Math.ceil(op.opTime / taktTime);
              workstations.push({ time: op.opTime / operatorsNeeded, ops: [{ ...op, allocatedOperators: operatorsNeeded }] });
              return;
          }
  
          let placed = false;
          for(let i = 0; i < workstations.length; i++) {
              if (workstations[i].time + op.opTime <= taktTime) {
                  workstations[i].ops.push({ ...op, allocatedOperators: 1 });
                  workstations[i].time += op.opTime;
                  placed = true;
                  break;
              }
          }
          
          if (!placed) {
              workstations.push({ time: op.opTime, ops: [{ ...op, allocatedOperators: 1 }] });
          }
      });
      
      const balancedLayout: OperationBulletinItem[] = [];
      workstations.forEach((ws, index) => {
          ws.ops.forEach(op => {
              const { opTime, positionalWeight, ...restOfOp } = op;
              balancedLayout.push({ ...restOfOp, workstation: index + 1 });
          });
      });
      return balancedLayout.sort((a, b) => a.sNo - b.sNo);
    };
  
    // --- Generate a pool of layouts ---
    let potentialLayouts: any[] = [];
    const forwardBulletin = [...baseBulletin].sort((a, b) => a.sNo - b.sNo);
    const taktVariations = [0.97, 1.0, 1.03]; // Takt time perturbation
  
    if (balanceMode === 'target') {
      const targets = [balanceTarget * 0.92, balanceTarget * 0.96, balanceTarget, balanceTarget * 1.04, balanceTarget * 1.08];
      targets.forEach(target => {
        const baseTakt = 3600 / target;
        taktVariations.forEach(v => {
            const takt = baseTakt * v;
            potentialLayouts.push({ layout: greedyBalance(forwardBulletin, takt) });
            potentialLayouts.push({ layout: bestFitGreedyBalance(forwardBulletin, takt) });
            potentialLayouts.push({ layout: rankedPositionalWeightBalance(forwardBulletin, takt) });
            potentialLayouts.push({ layout: worstFitGreedyBalance(forwardBulletin, takt) });
        });
      });
    } else if (balanceMode === 'operators') {
      const { count, multiSkilled, maxSkills } = balanceOperators;
      const operatorCounts = [count - 2, count - 1, count, count + 1, count + 2].filter(c => c > 5 && c < 40);
      operatorCounts.forEach(opCount => {
        const multiSkillBonus = 1 + ((multiSkilled / opCount) * (maxSkills / 10));
        const baseTakt = (totalSmvSeconds / opCount) / multiSkillBonus;
         taktVariations.forEach(v => {
            const takt = baseTakt * v;
            potentialLayouts.push({ layout: greedyBalance(forwardBulletin, takt) });
            potentialLayouts.push({ layout: bestFitGreedyBalance(forwardBulletin, takt) });
            potentialLayouts.push({ layout: rankedPositionalWeightBalance(forwardBulletin, takt) });
            potentialLayouts.push({ layout: worstFitGreedyBalance(forwardBulletin, takt) });
        });
      });
    } else { // efficiency
      const minOps = Math.ceil(totalSmvSeconds / Math.max(...baseBulletin.map(op => op.pickupTime + op.sewingTime + op.trimAndDisposalTime)));
      for (let opCount = Math.max(15, minOps); opCount <= 40; opCount++) {
        const baseTakt = totalSmvSeconds / opCount;
         taktVariations.forEach(v => {
            const takt = baseTakt * v;
            potentialLayouts.push({ layout: greedyBalance(forwardBulletin, takt) });
            potentialLayouts.push({ layout: bestFitGreedyBalance(forwardBulletin, takt) });
            potentialLayouts.push({ layout: rankedPositionalWeightBalance(forwardBulletin, takt) });
            potentialLayouts.push({ layout: worstFitGreedyBalance(forwardBulletin, takt) });
        });
      }
    }
  
    // --- Process and filter the pool to guarantee diversity ---
    const bestLayoutsByOperatorCount = new Map<number, any>();
  
    potentialLayouts.forEach(item => {
      const stats = calculateLayoutStats(item.layout, totalSmvSeconds);
      if (stats.totalOperators === 0 || stats.lineEfficiency <= 0) return;
      
      const { totalOperators, lineEfficiency } = stats;
      const existingBest = bestLayoutsByOperatorCount.get(totalOperators);

      if (!existingBest || lineEfficiency > existingBest.lineEfficiency) {
          bestLayoutsByOperatorCount.set(totalOperators, { ...item, ...stats });
      }
    });
  
    let finalOptions = Array.from(bestLayoutsByOperatorCount.values());
  
    if (balanceMode === 'operators') {
      finalOptions.sort((a, b) => {
        const diffA = Math.abs(a.totalOperators - balanceOperators.count);
        const diffB = Math.abs(b.totalOperators - balanceOperators.count);
        if (diffA !== diffB) return diffA - diffB;
        return b.lineEfficiency - a.lineEfficiency;
      });
    } else if (balanceMode === 'target') {
      finalOptions.sort((a, b) => {
        const diffA = Math.abs(a.hourlyTarget - balanceTarget);
        const diffB = Math.abs(b.hourlyTarget - balanceTarget);
        if (diffA !== diffB) return diffA - diffB;
        return b.lineEfficiency - a.lineEfficiency;
      });
    } else { // 'efficiency'
      finalOptions = finalOptions.filter(opt => opt.totalOperators >= 15 && opt.totalOperators <= 40);
      finalOptions.sort((a, b) => b.lineEfficiency - a.lineEfficiency);
    }
  
    setLayoutOptions(finalOptions.slice(0, 5).map(opt => ({...opt, title: `${opt.totalOperators} Ops`})));
    setSelectedLayout(null);
    setActiveTab('balance');
  }, [balanceMode, balanceTarget, balanceOperators, editableStyle?.operationBulletin]);
  
  const handleSelectLayout = (layout: any) => {
    setSelectedLayout(layout);
    setActiveTab('proposedOb');
  }
  
  const handleApplyBalance = () => {
    if (selectedLayout && editableStyle) {
        const newBulletin = JSON.parse(JSON.stringify(selectedLayout.layout));
        setEditableStyle({ ...editableStyle, operationBulletin: newBulletin });
        setActiveTab('currentOb');
    }
  }

  const handleOpenTimeCapture = (sNo: number) => {
    setTimeCaptureState({ isOpen: true, sNo });
  };

  const handleSaveTimeCapture = (times: { pickup: number; sewing: number; trim: number }) => {
    if (timeCaptureState.sNo === null) return;
    const newBulletin = (editableStyle?.operationBulletin || []).map(op => 
        op.sNo === timeCaptureState.sNo 
        ? { ...op, pickupTime: times.pickup, sewingTime: times.sewing, trimAndDisposalTime: times.trim }
        : op
    );
    handleStyleChange('operationBulletin', newBulletin);
    setTimeCaptureState({ isOpen: false, sNo: null });
  };

  const handleSubmit = (e: React.FormEvent, newStatus?: ObStatus) => {
    e.preventDefault();
    if (!editableStyle) return;

    const trimmedName = editableStyle.name.trim();
    if (!trimmedName) { alert('Please enter a style name.'); return; }
    if (existingStyles.some(s => s.name.toLowerCase() === trimmedName.toLowerCase() && s.id !== styleToEdit?.id)) {
      alert('A style with this name already exists.'); return;
    }

    const finalStatus = newStatus || editableStyle.obStatus;
    
    let styleToSave = { ...editableStyle, name: trimmedName, obStatus: finalStatus };

    if (finalStatus === 'Approved' && styleToEdit && JSON.stringify(styleToEdit.operationBulletin) !== JSON.stringify(styleToSave.operationBulletin)) {
      const prevBulletins = [...(styleToEdit.previousOperationBulletins || [])];
      prevBulletins.push({
        bulletin: styleToEdit.operationBulletin,
        changeDate: new Date().toISOString(),
        changedBy: currentUser.name
      });
      styleToSave.previousOperationBulletins = prevBulletins;
      styleToSave.obApproverId = currentUser.id;
      styleToSave.obApprovalDate = new Date().toISOString();
    } else if (newStatus && newStatus !== editableStyle.obStatus) {
      styleToSave.obApproverId = newStatus === 'Approved' ? currentUser.id : undefined;
      styleToSave.obApprovalDate = newStatus === 'Approved' ? new Date().toISOString() : undefined;
    }

    onSave(styleToSave);
    
    if (newStatus) {
      setConfirmationMessage(`Operation Bulletin has been ${newStatus === 'Pending Approval' ? 'submitted for approval' : newStatus.toLowerCase()}!`);
    } else {
      setConfirmationMessage('Style saved successfully!');
    }
    
    setTimeout(() => {
        setConfirmationMessage('');
        onClose();
    }, 2000);
  };
  
  const renderCustomField = (field: CustomFieldDefinition) => {
    if (!editableStyle) return null;
    
    const commonProps = {
      id: `custom-${field.fieldName}`,
      name: field.fieldName,
      value: editableStyle.customData?.[field.fieldName] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => handleCustomDataChange(field.fieldName, e.target.value),
      className: "w-full h-10 px-3 border-slate-300 rounded-md shadow-sm"
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


  if (!isOpen || !editableStyle) return null;

  return (
    <>
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-7xl flex flex-col h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{isEditing ? `Edit Style: ${editableStyle.name}` : 'Create New Style'}</h2>
          <button onClick={onClose}><XIcon className="w-6 h-6"/></button>
        </header>
        
        <div className="flex-shrink-0 border-b">
          <nav className="-mb-px flex space-x-8 px-6">
            <button onClick={() => setActiveTab('details')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-[#2c4e8a] text-[#2c4e8a]' : 'border-transparent text-slate-500'}`}>Details</button>
            <button onClick={() => setActiveTab('currentOb')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'currentOb' ? 'border-[#2c4e8a] text-[#2c4e8a]' : 'border-transparent text-slate-500'}`}>Current OB</button>
            <button onClick={() => setActiveTab('balance')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'balance' ? 'border-[#2c4e8a] text-[#2c4e8a]' : 'border-transparent text-slate-500'}`}>Line Balancing</button>
            <button onClick={() => setActiveTab('proposedOb')} disabled={!selectedLayout} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'proposedOb' ? 'border-[#2c4e8a] text-[#2c4e8a]' : 'border-transparent text-slate-500'} disabled:text-slate-300`}>Proposed OB</button>
          </nav>
        </div>

        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'details' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <FormField label="Style Name" htmlFor="styleName"><input type="text" id="styleName" value={editableStyle.name} onChange={e => handleStyleChange('name', e.target.value)} required autoFocus className="w-full h-10 px-3 border-slate-300 rounded-md shadow-sm"/></FormField>
                    <FormField label="Fabric Type" htmlFor="fabric"><input type="text" id="fabric" value={editableStyle.fabric || ''} onChange={e => handleStyleChange('fabric', e.target.value)} className="w-full h-10 px-3 border-slate-300 rounded-md shadow-sm"/></FormField>
                    <FormField label="Style Image" htmlFor="imageUpload">
                        <input type="file" id="imageUpload" accept="image/*" onChange={handleImageUpload} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                        {editableStyle.imageUrl && <img src={editableStyle.imageUrl} alt="Style Preview" className="mt-2 h-24 w-24 object-cover rounded-md"/>}
                    </FormField>
                    {customFields.map(field => (
                        <FormField key={field.id} label={field.label} htmlFor={`custom-${field.fieldName}`}>
                            {renderCustomField(field)}
                        </FormField>
                    ))}
                </div>
                <div>
                     <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-slate-700">Associated Colors</label>
                        <button type="button" onClick={() => setIsAddingColor(p => !p)} className="p-1 text-slate-500 hover:text-slate-700"><PlusIcon className="w-5 h-5"/></button>
                    </div>
                    {isAddingColor && (
                        <div className="flex gap-2 my-2">
                            <input type="text" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} placeholder="New Color Name" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewColor(); } }} className="w-full h-10 px-3 border-slate-300 rounded-md shadow-sm"/>
                            <button type="button" onClick={handleAddNewColor} disabled={!newColorName.trim()} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md">Add</button>
                        </div>
                    )}
                    <div className="max-h-32 overflow-y-auto pr-2 border rounded-md p-3 space-y-2 bg-slate-50">
                        {colors.map(color => (
                        <div key={color.id} className="flex items-center">
                            <input type="checkbox" id={`color-${color.id}`} checked={editableStyle.colorIds.includes(color.id)} onChange={() => handleColorToggle(color.id)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                            <label htmlFor={`color-${color.id}`} className="ml-3 text-sm">{color.name}</label>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
          )}
          {activeTab === 'currentOb' && (
             <DetailedObView 
                style={editableStyle} 
                bulletin={editableStyle.operationBulletin} 
                factorySettings={factorySettings} 
                operationNames={operationNamesMap} 
                machineNames={machineNamesMap} 
                gradeNames={gradeNamesMap}
                isEditable={!isEditing || canEditOb}
                onBulletinChange={(newBulletin) => handleStyleChange('operationBulletin', newBulletin)}
                onStartTimeCapture={handleOpenTimeCapture}
                operations={operations}
                machines={machines}
                operatorGrades={operatorGrades}
            />
          )}
          {activeTab === 'proposedOb' && selectedLayout && (
            <div>
              <DetailedObView 
                style={editableStyle}
                bulletin={selectedLayout.layout} 
                factorySettings={factorySettings} 
                operationNames={operationNamesMap} 
                machineNames={machineNamesMap} 
                gradeNames={gradeNamesMap}
                isEditable={true}
                onBulletinChange={(newBulletin) => {
                    const totalSmvSeconds = newBulletin.reduce((s, op) => s + op.pickupTime + op.sewingTime + op.trimAndDisposalTime, 0);
                    const newStats = calculateLayoutStats(newBulletin, totalSmvSeconds);
                    setSelectedLayout(prev => ({ 
                        ...prev, 
                        layout: newBulletin,
                        ...newStats
                    }));
                }}
                operations={operations}
                machines={machines}
                operatorGrades={operatorGrades}
              />
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={handleApplyBalance} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md">
                    Apply this Balance to Current OB
                </button>
              </div>
            </div>
          )}
          {activeTab === 'balance' && (
             <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <FormField label="Balance by" htmlFor="balance-mode"><select id="balance-mode" value={balanceMode} onChange={e=>setBalanceMode(e.target.value as any)} className="w-full h-9 mt-1 border-slate-300 rounded-md"><option value="target">Required Hourly Production</option><option value="operators">Available Operators</option><option value="efficiency">Max Possible Efficiency</option></select></FormField>
                        {balanceMode === 'target' && <FormField label="Hourly Target (pcs)" htmlFor="balance-target"><input type="number" id="balance-target" value={balanceTarget} onChange={e=>setBalanceTarget(Number(e.target.value))} className="w-full h-9 mt-1 border-slate-300 rounded-md"/></FormField>}
                        {balanceMode === 'operators' && 
                            <div className="grid grid-cols-3 gap-2">
                                <FormField label="Operators" htmlFor="op-count"><input type="number" id="op-count" value={balanceOperators.count} onChange={e=>setBalanceOperators(p=>({...p, count: Number(e.target.value)}))} className="w-full h-9 mt-1 border-slate-300 rounded-md"/></FormField>
                                <FormField label="Multi-Skill" htmlFor="ms-count"><input type="number" id="ms-count" value={balanceOperators.multiSkilled} onChange={e=>setBalanceOperators(p=>({...p, multiSkilled: Number(e.target.value)}))} className="w-full h-9 mt-1 border-slate-300 rounded-md"/></FormField>
                                <FormField label="Max Skills" htmlFor="max-skills"><input type="number" id="max-skills" value={balanceOperators.maxSkills} onChange={e=>setBalanceOperators(p=>({...p, maxSkills: Number(e.target.value)}))} className="w-full h-9 mt-1 border-slate-300 rounded-md"/></FormField>
                            </div>
                        }
                        <button type="button" onClick={generateLayoutOptions} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md h-9">Generate Layout Options</button>
                    </div>
                </div>
                {layoutOptions && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {layoutOptions.map((opt, i) => (
                            <div key={i} className={`p-3 border rounded-lg cursor-pointer ${selectedLayout === opt ? 'bg-indigo-50 border-indigo-400 shadow-md' : 'bg-white hover:border-slate-300'}`} onClick={() => handleSelectLayout(opt)}>
                                <h4 className="font-semibold text-center text-indigo-700">{opt.title}</h4>
                                <div className="grid grid-cols-3 text-center text-xs mt-2 pt-2 border-t">
                                    <div><span className="font-bold text-lg block">{opt.totalOperators}</span><span>Ops</span></div>
                                    <div><span className="font-bold text-lg block">{opt.hourlyTarget.toFixed(0)}</span><span>Pcs/Hr</span></div>
                                    <div><span className="font-bold text-lg block">{opt.lineEfficiency.toFixed(1)}%</span><span>Eff %</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          )}
        </main>

        <footer className="flex-shrink-0 p-4 bg-slate-50 flex justify-between items-center">
          <div className="text-sm">
            Status: <span className={`font-semibold px-2 py-1 rounded-full ${editableStyle.obStatus === 'Approved' ? 'bg-green-100 text-green-700' : (editableStyle.obStatus === 'Pending Approval' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')}`}>{editableStyle.obStatus}</span>
          </div>
          <div className="flex items-center gap-4">
            {confirmationMessage ? <span className="text-green-600 font-semibold">{confirmationMessage}</span> : <>
                {editableStyle.obStatus === 'Draft' && canEditOb && <button type="button" onClick={(e) => handleSubmit(e, 'Pending Approval')} className="px-4 py-2 bg-amber-500 text-white rounded-md">Submit for Approval</button>}
                {editableStyle.obStatus === 'Pending Approval' && canApprove && <>
                    <button type="button" onClick={(e) => handleSubmit(e, 'Draft')} className="px-4 py-2 bg-slate-500 text-white rounded-md">Reject</button>
                    <button type="button" onClick={(e) => handleSubmit(e, 'Approved')} className="px-4 py-2 bg-green-600 text-white rounded-md">Approve</button>
                </>}
                <button type="submit" onClick={(e) => handleSubmit(e)} className="px-4 py-2 bg-[#2c4e8a] text-white rounded-md">{isEditing ? 'Save Changes' : 'Create Style'}</button>
            </>}
          </div>
        </footer>
      </div>
    </div>
    {timeCaptureState.isOpen && (
      <TimeCaptureModal
        isOpen={timeCaptureState.isOpen}
        onClose={() => setTimeCaptureState({ isOpen: false, sNo: null })}
        onSave={handleSaveTimeCapture}
        operationName={operationNamesMap.get(editableStyle.operationBulletin.find(op => op.sNo === timeCaptureState.sNo)?.operationId || '') || 'Operation'}
      />
    )}
  </>
  );
};