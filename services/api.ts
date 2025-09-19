import type { 
  AllData, Staff, UserRole, Page, Order, Customer, Style, Employee, Operation, LineAllocation, 
  ProductionEntry, KanbanEntry, KanbanSettings, AllowanceSettings, GradePerformanceSetting, 
  OutputSettings, TimeStudy, InLineAudit, EndLineCheck, AqlInspection, NonConformanceReport, 
  Machine, IoTDevice, StaffPerformanceRecord, DailyLinePlan, DailyAttendance, GamificationSettings, 
  LevelDefinition, NonConformanceReport as NCReport, OperatorMonthlyReview, StaffKpi, KpiSetting,
  Objective, KeyResult, AllocationLogEntry,
  Notification, TeamMessage, TeamMessageReply, FactorySettings
} from '../types';
import db from './mockDb';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const getInitialData = async (): Promise<AllData> => {
    await delay(50);
    return deepCopy(db);
};

export const login = async (email: string, password: string): Promise<Staff> => {
    await delay(200);
    const user = db.staff.find(s => s.email.toLowerCase() === email.toLowerCase() && s.password === password);
    if (user) {
        return deepCopy(user);
    }
    throw new Error('Invalid credentials');
};

export const addMasterDataItem = async (type: string, name: string): Promise<any> => {
    await delay(100);
    const storeMap: Record<string, any[]> = { lines: db.lines, reasons: db.downtimeReasons, colors: db.colors, customers: db.customers, operatorGrades: db.operatorGrades, machines: db.machines, defects: db.defects, correctiveActions: db.correctiveActions };
    const storeKey = Object.keys(storeMap).find(key => key === type);
    
    if(!storeKey) throw new Error(`Invalid master data type: ${type}`);

    const store = storeMap[storeKey];
    if (store.some(i => i.name.toLowerCase() === name.toLowerCase())) {
        throw new Error(`An item with name "${name}" already exists.`);
    }

    const newItem: any = { 
        id: `${type.slice(0, 3).toUpperCase()}-${Date.now()}`,
        name,
    };

    if (type === 'lines') newItem.color = 'bg-slate-50';
    if (type === 'machines') newItem.allowance = 0;

    store.push(newItem);
    return deepCopy(newItem);
};

export const deleteMasterDataItem = async (type: string, id: string): Promise<void> => {
    await delay(100);
    if (type === 'colors' && (db.styles.some(s => s.colorIds.includes(id)) || db.orders.some(o => o.quantities.some(q => q.colorId === id)))) throw new Error("Cannot delete color. It is currently used in a style or order.");
    if (type === 'operatorGrades' && (db.employees.some(e => e.operatorGradeId === id) || db.styles.some(s => s.operationBulletin.some(b => b.operatorGradeId === id)))) throw new Error("Cannot delete grade. It's assigned to an employee or used in a style bulletin.");
    if (type === 'machines' && db.styles.some(s => s.operationBulletin.some(b => b.machineId === id))) throw new Error("Cannot delete machine. It is used in a style's operation bulletin.");
    if (type === 'lines' && (db.productionEntries.some(p => p.lineNumber === id) || db.employees.some(e => e.currentLineId === id) || db.lineAllocations.some(a => a.lineNumber === id) || db.kanbanEntries.some(k => k.lineNumber === id) || db.staff.some(s => s.lineAssignments.includes(id)))) throw new Error("Cannot delete line. It is currently in use.");
    if (type === 'reasons') { const name = db.downtimeReasons.find(r => r.id === id)?.name; if (db.productionEntries.some(p => p.downTimeReason === name)) throw new Error("Cannot delete reason. It is being used in production entries."); }
    if (type === 'customers') { const name = db.customers.find(c => c.id === id)?.name; if (db.orders.some(o => o.customer === name)) throw new Error("Cannot delete customer. They are associated with orders."); }
    if (type === 'defects' && (db.inLineAudits.some(a => a.records.some(r => r.defectId === id)) || db.endLineChecks.some(c => c.defectId === id))) throw new Error("Cannot delete defect. It is used in an audit or inspection record.");
    if (type === 'correctiveActions' && db.inLineAudits.some(a => a.records.some(r => r.correctiveActionId === id))) throw new Error("Cannot delete corrective action. It is used in an audit record.");

    const storeMap: Record<string, keyof AllData> = { lines: 'lines', reasons: 'downtimeReasons', colors: 'colors', customers: 'customers', operatorGrades: 'operatorGrades', machines: 'machines', defects: 'defects', correctiveActions: 'correctiveActions' };
    const storeKey = storeMap[type];
    
    if(!storeKey) throw new Error(`Invalid master data type: ${type}`);

    const store = db[storeKey] as any[];
    const initialLength = store.length;
    (db as any)[storeKey] = store.filter(item => item.id !== id);

    if((db as any)[storeKey].length === initialLength) {
        throw new Error(`Item with ID ${id} not found.`);
    }
};

const createCrud = <T extends { id: string }>(storeKey: keyof AllData) => ({
    create: async (itemData: Omit<T, 'id'>): Promise<T> => {
        await delay(150);
        // FIX: Cast to unknown first to resolve the generic type conversion error.
        const store = db[storeKey] as unknown as T[];
        const id = (itemData as any).id || `${String(storeKey).slice(0,3).toUpperCase()}-${Date.now()}`;
        if (store.some(i => i.id === id)) throw new Error(`An item with ID ${id} already exists.`);
        const newItem = { ...itemData, id } as T;
        store.push(newItem);
        return deepCopy(newItem);
    },
    update: async (itemData: T): Promise<T> => {
        await delay(150);
        // FIX: Cast to unknown first to resolve the generic type conversion error.
        const store = db[storeKey] as unknown as T[];
        const index = store.findIndex(i => i.id === itemData.id);
        if (index === -1) throw new Error(`Item with ID ${itemData.id} not found.`);
        store[index] = { ...store[index], ...itemData };
        return deepCopy(store[index]);
    },
    delete: async (id: string): Promise<void> => {
        await delay(150);
        if (storeKey === 'employees' && db.productionEntries.some(p => p.employeeId === id)) throw new Error("Cannot delete employee. They have production entries logged.");
        if (storeKey === 'operations' && db.styles.some(s => s.operationBulletin.some(b => b.operationId === id))) throw new Error("Cannot delete operation. It is used in a style's operation bulletin.");
        // FIX: Cast to unknown first to resolve the generic type conversion error.
        const store = db[storeKey] as unknown as T[];
        const initialLength = store.length;
        (db as any)[storeKey] = store.filter(i => i.id !== id);
        if ((db as any)[storeKey].length >= initialLength) {
            throw new Error(`Item with ID ${id} not found.`);
        }
    }
});

const orderCrud = createCrud<Order>('orders');
export const createOrder = (order: Omit<Order, 'id' | 'creationDate' | 'name'>) => orderCrud.create({ ...order, name: `Order for ${order.customer}`, creationDate: new Date().toISOString() });
export const updateOrder = orderCrud.update;
export const deleteOrder = orderCrud.delete;

const styleCrud = createCrud<Style>('styles');
export const saveStyle = (style: Style) => style.id.startsWith('S') ? styleCrud.update(style) : styleCrud.create(style);
export const deleteStyle = styleCrud.delete;

const employeeCrud = createCrud<Employee>('employees');
export const saveEmployee = (employee: Employee) => employee.id ? employeeCrud.update(employee) : employeeCrud.create(employee);
export const deleteEmployee = employeeCrud.delete;

const staffCrud = createCrud<Staff>('staff');
export const saveStaff = (staff: Staff) => staff.id ? staffCrud.update(staff) : staffCrud.create(staff);
export const deleteStaff = staffCrud.delete;

const operationCrud = createCrud<Operation>('operations');
export const saveOperation = (op: Operation) => op.id ? operationCrud.update(op) : operationCrud.create(op);
export const deleteOperation = operationCrud.delete;

const objectiveCrud = createCrud<Objective>('objectives');
export const saveObjective = (objective: Objective) => {
    // Ensure nested KeyResults have IDs
    objective.keyResults.forEach(kr => {
        if (!kr.id) kr.id = `KR-${Date.now()}-${Math.random()}`;
    });
    return objective.id ? objectiveCrud.update(objective) : objectiveCrud.create(objective);
};

export const updateKeyResult = async (kr: KeyResult): Promise<Objective> => {
    await delay(100);
    const objective = db.objectives.find(o => o.keyResults.some(k => k.id === kr.id));
    if (!objective) {
        throw new Error(`Objective for Key Result ${kr.id} not found.`);
    }
    const krIndex = objective.keyResults.findIndex(k => k.id === kr.id);
    if (krIndex === -1) {
        throw new Error(`Key Result ${kr.id} not found in objective.`);
    }
    objective.keyResults[krIndex] = kr;
    
    // Now update the whole objective in the db
    const objIndex = db.objectives.findIndex(o => o.id === objective.id);
    db.objectives[objIndex] = objective;

    return deepCopy(objective);
}

export const addOperation = async (name: string): Promise<Operation> => {
    await delay(150);
    const store = db.operations;
    if (store.some(i => i.name.toLowerCase() === name.toLowerCase())) throw new Error(`An operation with name "${name}" already exists.`);
    const newItem: Operation = {
        id: `OP-${Date.now()}`,
        name,
        skillType: 'Basic' // Defaulting skill type for quick-add
    };
    store.push(newItem);
    return deepCopy(newItem);
};

export const saveProductionEntries = async (entries: Omit<ProductionEntry, 'id'>[]): Promise<{ productionEntries: ProductionEntry[]; kanbanEntries: KanbanEntry[] }> => {
    await delay(300);
    const newEntries = entries.map((e, i) => ({ ...e, id: `PE-${Date.now()}-${i}` }));
    db.productionEntries.push(...newEntries);
    
    newEntries.forEach(entry => {
        const style = db.styles.find(s => s.id === entry.styleNumber);
        if(!style || !style.operationBulletin || style.operationBulletin.length === 0) return;
        const finalOpId = style.operationBulletin.reduce((a,b) => a.sNo > b.sNo ? a : b).operationId;
        if (entry.operation === finalOpId) {
            let remainingQty = entry.productionQuantity;
            const activeCards = db.kanbanEntries.filter(k => k.lineNumber === entry.lineNumber && k.orderNumber === entry.orderNumber && k.colorId === entry.colorId && k.status === 'active').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            for(const card of activeCards) {
                if(remainingQty <= 0) break;
                const capacity = card.quantity - card.producedOnCard;
                const producedNow = Math.min(remainingQty, capacity);
                card.producedOnCard += producedNow;
                remainingQty -= producedNow;
                if (card.producedOnCard >= card.quantity) card.status = 'closed';
            }
        }
    });
    return { productionEntries: deepCopy(newEntries), kanbanEntries: deepCopy(db.kanbanEntries) };
};

export const updateProductionEntry = async (entry: ProductionEntry): Promise<{ productionEntry: ProductionEntry }> => {
    await delay(100);
    const index = db.productionEntries.findIndex(p => p.id === entry.id);
    if (index === -1) throw new Error(`Entry not found`);
    db.productionEntries[index] = entry;
    return { productionEntry: deepCopy(entry) };
};

export const deleteProductionEntry = async (id: string): Promise<{ kanbanEntries: KanbanEntry[] }> => {
    await delay(200);
    const entryIndex = db.productionEntries.findIndex(p => p.id === id);
    if (entryIndex === -1) throw new Error(`Production entry with ID ${id} not found.`);

    const entryToDelete = db.productionEntries[entryIndex];
    const { productionQuantity, styleNumber, operation, lineNumber, orderNumber, colorId } = entryToDelete;
    
    const style = db.styles.find(s => s.id === styleNumber);
    if (style?.operationBulletin?.length) {
        const finalOpId = style.operationBulletin.reduce((a, b) => a.sNo > b.sNo ? a : b).operationId;
        if (operation === finalOpId) {
            let qtyToRevert = productionQuantity;
            const relevantCards = db.kanbanEntries.filter(k => k.lineNumber === lineNumber && k.orderNumber === orderNumber && k.colorId === colorId && (k.status === 'closed' || k.status === 'active')).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            for (const card of relevantCards) {
                if (qtyToRevert <= 0) break;
                const amountToPullFromCard = Math.min(qtyToRevert, card.producedOnCard);
                card.producedOnCard -= amountToPullFromCard;
                qtyToRevert -= amountToPullFromCard;
                if (card.status === 'closed' && card.producedOnCard < card.quantity) card.status = 'active';
            }
        }
    }
    db.productionEntries.splice(entryIndex, 1);
    return { kanbanEntries: deepCopy(db.kanbanEntries) };
};

export const saveKanbanEntry = async (entry: KanbanEntry): Promise<KanbanEntry> => {
    await delay(150);
    const index = db.kanbanEntries.findIndex(k => k.id === entry.id);
    if(index > -1) {
        db.kanbanEntries[index] = entry;
    } else {
        entry.id = entry.id || `KAN-${Date.now()}`;
        db.kanbanEntries.push(entry);
    }
    return deepCopy(entry);
};

export const saveLineAllocation = async (allocation: LineAllocation): Promise<{ savedAllocation: LineAllocation; newLogEntry: AllocationLogEntry }> => {
    await delay(200);

    let savedAllocation: LineAllocation;
    let details: string;

    // Use (lineNumber, orderNumber) as the unique key to find an existing plan.
    const existingPlanIndex = db.lineAllocations.findIndex(
        a => a.lineNumber === allocation.lineNumber && a.orderNumber === allocation.orderNumber
    );

    if (existingPlanIndex > -1) {
        // UPDATE case: A plan for this line/order already exists. We update it, preserving the existing ID.
        const existingId = db.lineAllocations[existingPlanIndex].id;
        savedAllocation = { 
            ...allocation, 
            id: existingId, 
            lastUpdated: new Date().toISOString() 
        };
        db.lineAllocations[existingPlanIndex] = savedAllocation;
        details = `Plan updated for ${db.lines.find(l => l.id === savedAllocation.lineNumber)?.name}.`;
    } else {
        // CREATE case: No plan exists for this line/order. Create a new one with a new ID.
        savedAllocation = { 
            ...allocation, 
            id: `ALLOC-${Date.now()}`, 
            lastUpdated: new Date().toISOString()
        };
        db.lineAllocations.push(savedAllocation);
        details = `New plan created for ${db.lines.find(l=>l.id===savedAllocation.lineNumber)?.name} / ${db.orders.find(o=>o.id===savedAllocation.orderNumber)?.name}.`;
    }

    const newLogEntry: AllocationLogEntry = { 
        id: `LOG-${Date.now()}`, 
        timestamp: savedAllocation.lastUpdated, 
        allocationId: savedAllocation.id, 
        details 
    };
    db.allocationLog.unshift(newLogEntry);

    return { savedAllocation: deepCopy(savedAllocation), newLogEntry: deepCopy(newLogEntry) };
};

export const savePermissions = async (permissions: Record<UserRole, Page[]>): Promise<Record<UserRole, Page[]>> => {
    await delay(150);
    db.permissions = permissions;
    return deepCopy(db.permissions);
};

// --- Individual Settings Savers ---
export const saveFactorySettings = async (settings: FactorySettings) => {
    await delay(100);
    db.factorySettings = settings;
    return deepCopy(db.factorySettings);
};
export const saveKanbanSettings = async (settings: KanbanSettings) => { 
    await delay(100);
    db.kanbanSettings = settings;
    return deepCopy(db.kanbanSettings);
};
export const saveOutputSettings = async (settings: OutputSettings) => {
    await delay(100);
    db.outputSettings = settings;
    return deepCopy(db.outputSettings);
};
export const saveAllowanceSettings = async (settings: AllowanceSettings) => {
    await delay(100);
    db.allowanceSettings = settings;
    return deepCopy(db.allowanceSettings);
};
export const saveMachines = async (machines: Machine[]) => {
    await delay(100);
    db.machines = machines;
    return deepCopy(db.machines);
};
export const saveGradePerformanceSettings = async (settings: GradePerformanceSetting[]) => {
    await delay(100);
    db.gradePerformanceSettings = settings;
    return deepCopy(db.gradePerformanceSettings);
};
export const saveKpiSettings = async (settings: KpiSetting[]) => {
    await delay(100);
    db.kpiSettings = settings;
    return deepCopy(db.kpiSettings);
};
export const saveGamificationSettings = async (settings: { gamification: GamificationSettings, levels: LevelDefinition[] }) => {
    await delay(100);
    db.gamificationSettings = settings.gamification;
    db.levelDefinitions = settings.levels;
    return { gamification: deepCopy(db.gamificationSettings), levels: deepCopy(db.levelDefinitions) };
};

export const createTimeStudy = async (study: Omit<TimeStudy, 'id' | 'timestamp'>): Promise<TimeStudy> => {
    await delay(200);
    const newStudy = { ...study, id: `TS-${Date.now()}`, timestamp: new Date().toISOString() };
    db.timeStudies.push(newStudy);
    return deepCopy(newStudy);
};

export const updateTimeStudy = async (study: TimeStudy): Promise<TimeStudy> => {
    await delay(150);
    const index = db.timeStudies.findIndex(ts => ts.id === study.id);
    if (index === -1) throw new Error(`Time study with ID ${study.id} not found.`);
    db.timeStudies[index] = study;
    return deepCopy(db.timeStudies[index]);
};

export const saveInLineAudit = async (audit: InLineAudit): Promise<InLineAudit> => {
    await delay(200);
    const newAudit = { ...audit, id: `AUD-${Date.now()}`};
    db.inLineAudits.push(newAudit);
    return deepCopy(newAudit);
};

export const saveEndLineCheck = async (check: EndLineCheck): Promise<{ savedCheck: EndLineCheck; updatedKanbanEntries: KanbanEntry[] }> => {
    await delay(50);
    const newCheck = { ...check, id: `ELC-${Date.now()}`};
    db.endLineChecks.push(newCheck);
    return { savedCheck: deepCopy(newCheck), updatedKanbanEntries: deepCopy(db.kanbanEntries) };
};

export const updateEndLineCheck = async (check: EndLineCheck): Promise<{ savedCheck: EndLineCheck; updatedKanbanEntries: KanbanEntry[] }> => {
    await delay(50);
    const index = db.endLineChecks.findIndex(c => c.id === check.id);
    if (index === -1) throw new Error("End Line Check not found.");
    db.endLineChecks[index] = check;
    return { savedCheck: deepCopy(check), updatedKanbanEntries: deepCopy(db.kanbanEntries) };
};

export const saveAqlInspection = async (inspection: AqlInspection): Promise<{ savedAql: AqlInspection; newNcReport: NonConformanceReport | null }> => {
    await delay(200);
    const savedAql = { ...inspection, id: `AQL-${Date.now()}` };
    db.aqlInspections.push(savedAql);

    let newNcReport = null;
    if (savedAql.result === 'Fail') {
        const ncNumber = `NC-${db.nonConformanceReports.length + 1}`;
        newNcReport = {
            id: `NCR-${Date.now()}`, ncNumber, date: new Date().toISOString().split('T')[0],
            source: 'AQL Fail', sourceId: savedAql.id,
            details: `AQL failed for Kanban ${savedAql.kanbanCardId}. Qty: ${savedAql.offeredQty}, Sample: ${savedAql.sampleSize}, Maj: ${savedAql.majorDefectsFound}, Min: ${savedAql.minorDefectsFound}.`,
            why1: '', why2: '', why3: '', why4: '', why5: '', rootCause: '',
            correctiveAction: '', preventiveAction: '', responsibleStaffId: '',
            dueDate: '', status: 'Open'
        };
        db.nonConformanceReports.push(newNcReport);
    }
    return { savedAql: deepCopy(savedAql), newNcReport: newNcReport ? deepCopy(newNcReport) : null };
};

export const saveNcReport = async (report: NonConformanceReport): Promise<NonConformanceReport> => {
    await delay(150);
    const index = db.nonConformanceReports.findIndex(nc => nc.id === report.id);
    if (index > -1) {
        db.nonConformanceReports[index] = report;
        return deepCopy(report);
    } else {
        const newReport = { ...report, id: `NCR-${Date.now()}`, ncNumber: report.ncNumber || `NC-${db.nonConformanceReports.length + 1}` };
        db.nonConformanceReports.push(newReport);
        return deepCopy(newReport);
    }
};

export const saveAttendance = async (attendance: DailyAttendance): Promise<DailyAttendance> => {
    await delay(100);
    const existingIndex = db.dailyAttendances.findIndex(a => a.date === attendance.date);
    if (existingIndex > -1) {
        db.dailyAttendances[existingIndex] = attendance;
    } else {
        db.dailyAttendances.push(attendance);
    }
    return deepCopy(attendance);
};

export const savePerformanceRecord = async (record: StaffPerformanceRecord): Promise<StaffPerformanceRecord> => {
    await delay(150);
    const index = db.staffPerformanceRecords.findIndex(r => r.id === record.id);
    if (index > -1) {
        db.staffPerformanceRecords[index] = record;
    } else {
        record.id = record.id || `SPR-${Date.now()}`;
        db.staffPerformanceRecords.push(record);
    }
    return deepCopy(record);
};

export const saveDailyLinePlans = async (plans: DailyLinePlan[]): Promise<DailyLinePlan[]> => {
    await delay(150);
    const savedPlans: DailyLinePlan[] = [];
    plans.forEach(planToSave => {
        let savedPlan: DailyLinePlan;
        
        let existingPlanIndex = -1;
        if (planToSave.id) {
            existingPlanIndex = db.dailyLinePlans.findIndex(p => p.id === planToSave.id);
        } else {
            existingPlanIndex = db.dailyLinePlans.findIndex(p => p.date === planToSave.date && p.lineNumber === planToSave.lineNumber);
        }
        
        if (existingPlanIndex > -1) {
            savedPlan = { ...planToSave, id: db.dailyLinePlans[existingPlanIndex].id };
            db.dailyLinePlans[existingPlanIndex] = savedPlan;
        } else {
            savedPlan = { ...planToSave, id: `DLP-${Date.now()}-${Math.random()}` };
            db.dailyLinePlans.push(savedPlan);
        }
        savedPlans.push(savedPlan);
    });
    return deepCopy(savedPlans);
};

export const deleteDailyLinePlan = async (planId: string): Promise<void> => {
    await delay(100);
    const initialLength = db.dailyLinePlans.length;
    db.dailyLinePlans = db.dailyLinePlans.filter(p => p.id !== planId);
    if (db.dailyLinePlans.length >= initialLength) {
        console.warn(`Plan with ID ${planId} not found for deletion.`);
    }
};

export const markNotificationRead = async (id: string): Promise<Notification> => {
    await delay(50);
    const notification = db.notifications.find(n => n.id === id);
    if (!notification) throw new Error('Notification not found');
    notification.read = true;
    return deepCopy(notification);
};

export const sendMessage = async (msg: Omit<TeamMessage, 'id' | 'timestamp' | 'replies'>): Promise<TeamMessage> => {
    await delay(100);
    const newMessage: TeamMessage = {
        ...msg,
        id: `MSG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        replies: [],
    };
    db.teamMessages.push(newMessage);
    return deepCopy(newMessage);
};

export const replyToMessage = async (msgId: string, reply: Omit<TeamMessageReply, 'id' | 'timestamp'>): Promise<TeamMessage> => {
    await delay(100);
    const message = db.teamMessages.find(m => m.id === msgId);
    if (!message) throw new Error('Message not found');
    const newReply: TeamMessageReply = {
        ...reply,
        id: `REP-${Date.now()}`,
        timestamp: new Date().toISOString(),
    };
    message.replies.push(newReply);
    return deepCopy(message);
};