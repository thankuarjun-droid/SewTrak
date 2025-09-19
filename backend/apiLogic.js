const db = require('./db');

// This function is for async logic. Sync functions will throw errors directly.

const authenticateUser = (email, password) => {
    const user = db.staff.find(s => s.email.toLowerCase() === email.toLowerCase() && s.password === password);
    if (user) {
        return user;
    }
    throw new Error('Invalid credentials');
};

const createMasterDataItem = (type, name) => {
    const storeMap = { lines: db.lines, reasons: db.downtimeReasons, colors: db.colors, customers: db.customers, operatorGrades: db.operatorGrades, machines: db.machines, defects: db.defects, correctiveActions: db.correctiveActions };
    const storeKey = Object.keys(storeMap).find(key => key === type);
    
    if(!storeKey) throw new Error(`Invalid master data type: ${type}`);

    const store = storeMap[storeKey];
    if (store.some(i => i.name.toLowerCase() === name.toLowerCase())) {
        throw new Error(`An item with name "${name}" already exists.`);
    }

    const newItem = { 
        id: `${type.slice(0, 3).toUpperCase()}-${Date.now()}`,
        name,
    };

    if (type === 'lines') newItem.color = 'bg-slate-50';
    if (type === 'machines') newItem.allowance = 0;

    store.push(newItem);
    return newItem;
};

const deleteMasterDataItem = (type, id) => {
    if (type === 'colors' && (db.styles.some(s => s.colorIds.includes(id)) || db.orders.some(o => o.quantities.some(q => q.colorId === id)))) throw new Error("Cannot delete color. It is currently used in a style or order.");
    if (type === 'operatorGrades' && (db.employees.some(e => e.operatorGradeId === id) || db.styles.some(s => s.operationBulletin.some(b => b.operatorGradeId === id)))) throw new Error("Cannot delete grade. It's assigned to an employee or used in a style bulletin.");
    if (type === 'machines' && db.styles.some(s => s.operationBulletin.some(b => b.machineId === id))) throw new Error("Cannot delete machine. It is used in a style's operation bulletin.");
    if (type === 'lines' && (db.productionEntries.some(p => p.lineNumber === id) || db.employees.some(e => e.currentLineId === id) || db.lineAllocations.some(a => a.lineNumber === id) || db.kanbanEntries.some(k => k.lineNumber === id) || db.staff.some(s => s.lineAssignments.includes(id)))) throw new Error("Cannot delete line. It is currently in use.");
    if (type === 'reasons') { const name = db.downtimeReasons.find(r => r.id === id)?.name; if (db.productionEntries.some(p => p.downTimeReason === name)) throw new Error("Cannot delete reason. It is being used in production entries."); }
    if (type === 'customers') { const name = db.customers.find(c => c.id === id)?.name; if (db.orders.some(o => o.customer === name)) throw new Error("Cannot delete customer. They are associated with orders."); }
    if (type === 'defects' && (db.inLineAudits.some(a => a.records.some(r => r.defectId === id)) || db.endLineChecks.some(c => c.defectId === id))) throw new Error("Cannot delete defect. It is used in an audit or inspection record.");
    if (type === 'correctiveActions' && db.inLineAudits.some(a => a.records.some(r => r.correctiveActionId === id))) throw new Error("Cannot delete corrective action. It is used in an audit record.");

    const storeMap = { lines: 'lines', reasons: 'downtimeReasons', colors: 'colors', customers: 'customers', operatorGrades: 'operatorGrades', machines: 'machines', defects: 'defects', correctiveActions: 'correctiveActions' };
    const storeKey = storeMap[type];
    
    if(!storeKey) throw new Error(`Invalid master data type: ${type}`);

    const store = db[storeKey];
    const initialLength = store.length;
    db[storeKey] = store.filter(item => item.id !== id);

    if(db[storeKey].length === initialLength) {
        throw new Error(`Item with ID ${id} not found.`);
    }
};


const createCrud = (storeKey) => ({
    create: (itemData) => {
        const store = db[storeKey];
        const id = itemData.id || `${String(storeKey).slice(0,3).toUpperCase()}-${Date.now()}`;
        if (store.some(i => i.id === id)) throw new Error(`An item with ID ${id} already exists.`);
        const newItem = { ...itemData, id };
        store.push(newItem);
        return newItem;
    },
    update: (itemData) => {
        const store = db[storeKey];
        const index = store.findIndex(i => i.id === itemData.id);
        if (index === -1) throw new Error(`Item with ID ${itemData.id} not found.`);
        store[index] = { ...store[index], ...itemData };
        return store[index];
    },
    delete: (id) => {
        if (storeKey === 'employees' && db.productionEntries.some(p => p.employeeId === id)) throw new Error("Cannot delete employee. They have production entries logged.");
        if (storeKey === 'operations' && db.styles.some(s => s.operationBulletin.some(b => b.operationId === id))) throw new Error("Cannot delete operation. It is used in a style's operation bulletin.");
        const store = db[storeKey];
        const initialLength = store.length;
        db[storeKey] = store.filter(i => i.id !== id);
        if (db[storeKey].length >= initialLength) {
            throw new Error(`Item with ID ${id} not found.`);
        }
    }
});

const createProductionEntries = (entries) => {
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
    return { productionEntries: newEntries, kanbanEntries: db.kanbanEntries };
};

const updateProductionEntry = (entry) => {
    const index = db.productionEntries.findIndex(p => p.id === entry.id);
    if (index === -1) throw new Error(`Entry not found`);
    db.productionEntries[index] = entry;
    return { productionEntry: entry, kanbanEntries: db.kanbanEntries };
};

const deleteProductionEntry = (entryId) => {
    const entryIndex = db.productionEntries.findIndex(p => p.id === entryId);
    if (entryIndex === -1) {
        throw new Error(`Production entry with ID ${entryId} not found.`);
    }

    const entryToDelete = db.productionEntries[entryIndex];
    const { productionQuantity, styleNumber, operation, lineNumber, orderNumber, colorId } = entryToDelete;

    // Find if this was a final operation, which is the only kind that affects Kanban cards
    const style = db.styles.find(s => s.id === styleNumber);
    if (style && style.operationBulletin && style.operationBulletin.length > 0) {
        const finalOpId = style.operationBulletin.reduce((a, b) => a.sNo > b.sNo ? a : b).operationId;
        
        if (operation === finalOpId) {
            let qtyToRevert = productionQuantity;

            // Find cards that might have been affected. We need to revert from the most recently touched ones first.
            // This means sorting in descending timestamp order.
            const relevantCards = db.kanbanEntries.filter(k => 
                k.lineNumber === lineNumber &&
                k.orderNumber === orderNumber &&
                k.colorId === colorId &&
                (k.status === 'closed' || k.status === 'active')
            ).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            for (const card of relevantCards) {
                if (qtyToRevert <= 0) break;

                const amountToPullFromCard = Math.min(qtyToRevert, card.producedOnCard);
                card.producedOnCard -= amountToPullFromCard;
                qtyToRevert -= amountToPullFromCard;

                // If a closed card now has less than its total quantity, reopen it.
                if (card.status === 'closed' && card.producedOnCard < card.quantity) {
                    card.status = 'active';
                }
            }
        }
    }

    // Finally, remove the production entry itself.
    db.productionEntries.splice(entryIndex, 1);
    
    // Return the updated kanban entries so the frontend can sync
    return { kanbanEntries: db.kanbanEntries };
};


const saveKanbanEntry = (entry) => {
    const index = db.kanbanEntries.findIndex(k => k.id === entry.id);
    if(index > -1) {
        db.kanbanEntries[index] = entry;
    } else {
        entry.id = entry.id || `KAN-${Date.now()}`;
        db.kanbanEntries.push(entry);
    }
    return entry;
}

const saveLineAllocation = (allocation) => {
    const existingIndex = db.lineAllocations.findIndex(a => a.lineNumber === allocation.lineNumber && a.orderNumber === allocation.orderNumber);
    let savedAllocation, details;
    if (existingIndex > -1) {
        const oldAllocation = db.lineAllocations[existingIndex];
        savedAllocation = { ...allocation, id: oldAllocation.id, lastUpdated: new Date().toISOString() };
        db.lineAllocations[existingIndex] = savedAllocation;
        details = `Plan updated for ${db.lines.find(l=>l.id===savedAllocation.lineNumber)?.name}.`;
    } else {
        // FIX: Added missing `lastUpdated` property when creating a new allocation.
        savedAllocation = { ...allocation, id: `ALLOC-${Date.now()}`, lastUpdated: new Date().toISOString() };
        db.lineAllocations.push(savedAllocation);
        details = `New plan created for ${db.lines.find(l=>l.id===savedAllocation.lineNumber)?.name} / ${db.orders.find(o=>o.id===savedAllocation.orderNumber)?.name}.`;
    }
    const newLogEntry = { id: `LOG-${Date.now()}`, timestamp: savedAllocation.lastUpdated, allocationId: savedAllocation.id, details };
    db.allocationLog.unshift(newLogEntry);
    return { savedAllocation, newLogEntry };
};

const savePermissions = (permissions) => {
    db.permissions = permissions;
    return db.permissions;
}

const saveKanbanSettings = (settings) => {
    db.kanbanSettings = settings;
    return db.kanbanSettings;
};

const saveAllowanceSettings = (settings) => {
    db.allowanceSettings = settings;
    return db.allowanceSettings;
};

const updateMachines = (machines) => {
    db.machines = machines;
    return db.machines;
};

const createTimeStudy = (study) => {
    const newStudy = {
        ...study,
        id: `TS-${Date.now()}`,
        timestamp: new Date().toISOString()
    };
    db.timeStudies.push(newStudy);
    return newStudy;
};

const updateTimeStudy = (study) => {
    const index = db.timeStudies.findIndex(ts => ts.id === study.id);
    if (index === -1) throw new Error(`Time study with ID ${study.id} not found.`);
    db.timeStudies[index] = study;
    return db.timeStudies[index];
};

const saveGradePerformanceSettings = (settings) => {
    db.gradePerformanceSettings = settings;
    return db.gradePerformanceSettings;
};

const saveOutputSettings = (settings) => {
    db.outputSettings = settings;
    return db.outputSettings;
};

// QC Logic
const createInLineAudit = (audit) => {
    const newAudit = { ...audit, id: `AUD-${Date.now()}`};
    db.inLineAudits.push(newAudit);
    return newAudit;
};

const createEndLineCheck = (check) => {
    const newCheck = { ...check, id: `ELC-${Date.now()}`};
    db.endLineChecks.push(newCheck);
    return { savedCheck: newCheck, updatedKanbanEntries: db.kanbanEntries };
};

const updateEndLineCheck = (check) => {
    const index = db.endLineChecks.findIndex(c => c.id === check.id);
    if (index === -1) throw new Error("End Line Check not found.");
    db.endLineChecks[index] = check;
    return { savedCheck: check, updatedKanbanEntries: db.kanbanEntries };
};

const createAqlInspection = (inspection) => {
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
    return { savedAql, newNcReport };
};

const saveNcReport = (report) => {
    const index = db.nonConformanceReports.findIndex(nc => nc.id === report.id);
    if (index > -1) {
        db.nonConformanceReports[index] = report;
        return report;
    } else {
        const newReport = { ...report, id: `NCR-${Date.now()}`, ncNumber: report.ncNumber || `NC-${db.nonConformanceReports.length + 1}` };
        db.nonConformanceReports.push(newReport);
        return newReport;
    }
};

module.exports = {
    authenticateUser,
    createMasterDataItem,
    deleteMasterDataItem,
    createCrud,
    createProductionEntries,
    updateProductionEntry,
    deleteProductionEntry,
    saveKanbanEntry,
    saveLineAllocation,
    savePermissions,
    saveKanbanSettings,
    saveAllowanceSettings,
    updateMachines,
    createTimeStudy,
    updateTimeStudy,
    saveGradePerformanceSettings,
    saveOutputSettings,
    createInLineAudit,
    createEndLineCheck,
    updateEndLineCheck,
    createAqlInspection,
    saveNcReport
};