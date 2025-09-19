
const { 
    LINES, STAFF, EMPLOYEES, DOWNTIME_REASONS, STYLES, COLORS, CUSTOMERS, ORDERS, 
    OPERATIONS, OPERATOR_GRADES, MACHINES, INITIAL_PERMISSIONS, GRADE_PERFORMANCE_SETTINGS,
    DEFECTS, CORRECTIVE_ACTIONS 
} = require('./constants');

// Deep copy constants to prevent mutation of original constants
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

const KPI_SETTINGS = [
  { id: 'KPI-EFF', kpi: 'Average Line Efficiency', category: 'Production', definition: 'Overall Weighted Efficiency (OWE) of a production line.', unit: '%', frequency: 'Daily', direction: 'Up', targetStart: 70, targetStretch: 85 },
  { id: 'KPI-DT', kpi: 'Downtime %', category: 'Production', definition: 'Percentage of total available minutes lost to downtime.', unit: '%', frequency: 'Daily', direction: 'Down', targetStart: 10, targetStretch: 5 },
  { id: 'KPI-ADH', kpi: 'Plan Vs Adherence%', category: 'Planning', definition: 'Percentage of planned production quantity that was actually produced.', unit: '%', frequency: 'Daily', direction: 'Up', targetStart: 90, targetStretch: 98 },
  { id: 'KPI-CAP', kpi: 'Capacity Utilisation%', category: 'Planning', definition: 'Percentage of available production minutes that have been booked for future plans.', unit: 'Monthly', frequency: 'Monthly', direction: 'Up', targetStart: 80, targetStretch: 95 },
  { id: 'KPI-RFT', kpi: 'RFT%', category: 'Quality', definition: 'Right First Time. Percentage of units that pass inspection without rework.', unit: '%', frequency: 'Daily', direction: 'Up', targetStart: 95, targetStretch: 98 },
  { id: 'KPI-OTD', kpi: 'On time Delivery', category: 'Delivery', definition: 'Whether the order was shipped on or before the delivery date.', unit: 'Boolean', frequency: 'Per Order', direction: 'Up', targetStart: 1, targetStretch: 1 },
  { id: 'KPI-DELAY', kpi: 'Delay/Advance Days', category: 'Delivery', definition: 'Days of delay (positive) or advance shipment (negative).', unit: 'days', frequency: 'Per Order', direction: 'Down', targetStart: 0, targetStretch: -2 },
  { id: 'KPI-LEAD', kpi: 'Order Lead Time', category: 'Delivery', definition: 'Total days from PO date to delivery date.', unit: 'days', frequency: 'Per Order', direction: 'Down', targetStart: 30, targetStretch: 25 },
  { id: 'KPI-SHORT', kpi: 'Shortage/Excess %', category: 'Delivery', definition: 'Percentage of quantity shortage or excess.', unit: '%', frequency: 'Per Order', direction: 'Down', targetStart: 0, targetStretch: 0 },
  { id: 'KPI-COST-T', kpi: 'Total Assembly Cost', category: 'Financial', definition: 'Total salary cost for assembly.', unit: 'currency', frequency: 'Per Order', direction: 'Down', targetStart: 50000, targetStretch: 45000 },
  { id: 'KPI-COST-G', kpi: 'Assembly Cost/Garment', category: 'Financial', definition: 'Average assembly cost per produced unit.', unit: 'currency', frequency: 'Per Order', direction: 'Down', targetStart: 25, targetStretch: 22 },
  { id: 'KPI-CHANGE', kpi: 'Style Changeover Time', category: 'Production', definition: 'Time in minutes between the last unit of the previous style and the first of the new style on a line.', unit: 'mins', frequency: 'Per Style Change', direction: 'Down', targetStart: 60, targetStretch: 45 },
  { id: 'KPI-REWORK', kpi: 'Rework%', category: 'Quality', definition: 'Percentage of checked units sent for rework.', unit: '%', frequency: 'Daily', direction: 'Down', targetStart: 5, targetStretch: 2 },
  { id: 'KPI-REJECT', kpi: 'Rejection%', category: 'Quality', definition: 'Percentage of checked units rejected.', unit: '%', frequency: 'Daily', direction: 'Down', targetStart: 2, targetStretch: 1 },
  { id: 'KPI-AQL', kpi: 'AQL Pass%', category: 'Quality', definition: 'Percentage of AQL lots that passed inspection.', unit: '%', frequency: 'Daily', direction: 'Up', targetStart: 95, targetStretch: 100 },
];

const KANBAN_ENTRIES = [
    { id: 'KAN-1', timestamp: '2024-01-01T08:00:00Z', lineNumber: 'L01', orderNumber: 'ORD-001', colorId: 'C01', quantity: 1000, status: 'completed', producedOnCard: 850, dcNumber: 'DC101', dcDate: '2024-01-01' },
    { id: 'KAN-2', timestamp: '2024-01-01T08:05:00Z', lineNumber: 'L02', orderNumber: 'ORD-005', colorId: 'C05', quantity: 1200, status: 'completed', producedOnCard: 980, dcNumber: 'DC102', dcDate: '2024-01-01' },
    { id: 'KAN-3', timestamp: '2024-01-01T08:10:00Z', lineNumber: 'L03', orderNumber: 'ORD-003', colorId: 'C02', quantity: 800, status: 'active', producedOnCard: 650, dcNumber: 'DC103', dcDate: '2024-01-01' },
    { id: 'KAN-4', timestamp: '2024-01-01T08:15:00Z', lineNumber: 'L04', orderNumber: 'ORD-004', colorId: 'C01', quantity: 1500, status: 'active', producedOnCard: 1100, dcNumber: 'DC104', dcDate: '2024-01-01' },
];

const LINE_ALLOCATIONS = [
    { id: 'ALLOC-1', lastUpdated: '2024-01-01T07:30:00Z', lineNumber: 'L01', orderNumber: 'ORD-001', assignments: STYLES.find(s=>s.id==='S101').operationBulletin.map((op, i) => ({ operationId: op.operationId, employeeIds: [`E1${String(i).padStart(2,'0')}`] })) },
    { id: 'ALLOC-2', lastUpdated: '2024-01-01T07:30:00Z', lineNumber: 'L02', orderNumber: 'ORD-005', assignments: STYLES.find(s=>s.id==='S101').operationBulletin.map((op, i) => ({ operationId: op.operationId, employeeIds: [`E2${String(i).padStart(2,'0')}`] })) },
    { id: 'ALLOC-3', lastUpdated: '2024-01-01T07:30:00Z', lineNumber: 'L03', orderNumber: 'ORD-003', assignments: STYLES.find(s=>s.id==='S103').operationBulletin.map((op, i) => ({ operationId: op.operationId, employeeIds: [`E3${String(i).padStart(2,'0')}`] })) },
    { id: 'ALLOC-4', lastUpdated: '2024-01-01T07:30:00Z', lineNumber: 'L04', orderNumber: 'ORD-004', assignments: STYLES.find(s=>s.id==='S104').operationBulletin.map((op, i) => ({ operationId: op.operationId, employeeIds: [`E4${String(i).padStart(2,'0')}`] })) },
];

const TIME_STUDIES = [
    { id: 'TS-1', timestamp: '2024-01-02T10:00:00Z', employeeId: 'E101', employeeGradeId: 'OG-B', operationId: 'OP02', styleId: 'S101', machineId: 'M-SNLS', machineName: 'SNLS', cycles: [{cycleNumber:1, pickupTime:7.1, sewingTime:55.2, trimAndDisposalTime:6.9, totalObservedTime: 69.2, basicTime: 69.2, standardTime: 80.27, selected: true}], averageObservedTime: 69.2, averageStandardTime: 80.27 },
    { id: 'TS-2', timestamp: '2024-01-02T11:00:00Z', employeeId: 'E105', employeeGradeId: 'OG-A', operationId: 'OP04', styleId: 'S101', machineId: 'M-SNLS', machineName: 'SNLS', cycles: [{cycleNumber:1, pickupTime:10.5, sewingTime:68.1, trimAndDisposalTime:8.4, totalObservedTime: 87, basicTime: 87, standardTime: 101.0, selected: true}], averageObservedTime: 87, averageStandardTime: 101.0 },
    { id: 'TS-3', timestamp: '2024-01-03T09:00:00Z', employeeId: 'E401', employeeGradeId: 'OG-A', operationId: 'OP09', styleId: 'S104', machineId: 'M-DNLS', machineName: 'DNLS', cycles: [{cycleNumber:1, pickupTime:18.2, sewingTime:110.5, trimAndDisposalTime:15.3, totalObservedTime: 144, basicTime: 144, standardTime: 167.0, selected: true}], averageObservedTime: 144, averageStandardTime: 167.0 },
    { id: 'TS-4', timestamp: '2024-01-03T14:00:00Z', employeeId: 'E402', employeeGradeId: 'OG-A', operationId: 'OP10', styleId: 'S104', machineId: 'M-SNLS', machineName: 'SNLS', cycles: [{cycleNumber:1, pickupTime:20.1, sewingTime:125.9, trimAndDisposalTime:18.0, totalObservedTime: 164, basicTime: 164, standardTime: 190.2, selected: true}], averageObservedTime: 164, averageStandardTime: 190.2 },
];

const generateFullProductionData = () => {
    const entries = [];
    const endLineChecks = [];
    const inLineAudits = [];
    const dailyAttendances = [];

    const today = new Date();
    const linesToRun = [
      { lineId: 'L01', orderId: 'ORD-001', colorId: 'C01', styleId: 'S101' },
      { lineId: 'L02', orderId: 'ORD-005', colorId: 'C05', styleId: 'S101' },
      { lineId: 'L03', orderId: 'ORD-003', colorId: 'C02', styleId: 'S103' },
      { lineId: 'L04', orderId: 'ORD-004', colorId: 'C01', styleId: 'S104' }
    ];

    for (let day = 0; day >= 0; day--) { // Generate for today only
        const date = new Date(today);
        date.setDate(today.getDate() - day);
        const dateStr = date.toISOString().split('T')[0];
        
        // Generate Attendance
        const presentEmployees = new Set();
        EMPLOYEES.forEach(e => {
            if (Math.random() > 0.05) { // 95% attendance
                presentEmployees.add(e.id);
            }
        });
        dailyAttendances.push({ date: dateStr, presentEmployeeIds: Array.from(presentEmployees) });

        for (const lineConfig of linesToRun) {
            const style = STYLES.find(s => s.id === lineConfig.styleId);
            const allocation = LINE_ALLOCATIONS.find(a => a.lineNumber === lineConfig.lineId);
            if (!style || !allocation) continue;
            
            const bulletin = style.operationBulletin.sort((a, b) => a.sNo - b.sNo);
            const lastOp = bulletin[bulletin.length - 1];
            const allocationMap = new Map(allocation.assignments.map(a => [a.operationId, a.employeeIds]));
            const dailyWip = new Map();
            let totalDayOutput = 0;

            for (let hour = 1; hour <= 8; hour++) { // Reduced from 10 to 8
                const timestamp = new Date(`${dateStr}T${String(hour + 7).padStart(2, '0')}:00:00.000Z`).toISOString();
                
                for (const op of bulletin) {
                    const empIds = allocationMap.get(op.operationId) || [];
                    if (empIds.length === 0 || !presentEmployees.has(empIds[0])) continue;

                    const empId = empIds[0];
                    const prevOp = bulletin.find(b => b.sNo === op.sNo - 1);
                    const inputWip = prevOp ? (dailyWip.get(prevOp.operationId) || 0) : 1000;
                    const producedOnOp = dailyWip.get(op.operationId) || 0;
                    const availableWip = inputWip - producedOnOp;
                    
                    const smv = (op.pickupTime + op.sewingTime + op.trimAndDisposalTime) / 60;
                    const hourlyTarget = smv > 0 ? (60 / smv) : 0;
                    // Reduced multiplier from (0.8 + 0.25) to (0.7 + 0.2)
                    const producedQty = Math.max(0, Math.round(Math.min(hourlyTarget * (0.7 + Math.random() * 0.2), availableWip)));

                    dailyWip.set(op.operationId, producedOnOp + producedQty);

                    if(producedQty > 0) {
                        entries.push({
                            id: `PE-${dateStr}-${lineConfig.lineId}-${hour}-${empId.slice(1)}`, timestamp, lineNumber: lineConfig.lineId,
                            orderNumber: lineConfig.orderId, styleNumber: lineConfig.styleId, colorId: lineConfig.colorId,
                            hourCounter: hour, operation: op.operationId, employeeId: empId, productionQuantity: producedQty,
                            downTime: Math.random() > 0.9 ? Math.floor(Math.random() * 10) : 0, downTimeReason: '',
                        });
                        if (op.operationId === lastOp.operationId) {
                            totalDayOutput += producedQty;
                        }
                    }
                }
            }

            // Generate End Line Checks
            for(let i=0; i < totalDayOutput; i++) {
                const statusRoll = Math.random();
                let status = 'Pass';
                if (statusRoll < 0.05) status = 'Reject';
                else if (statusRoll < 0.1) status = 'Rework';
                
                const check = {
                    id: `ELC-${dateStr}-${lineConfig.lineId}-${i}`, timestamp: new Date(`${dateStr}T17:00:00Z`).toISOString(),
                    lineNumber: lineConfig.lineId, orderNumber: lineConfig.orderId, styleNumber: lineConfig.styleId,
                    checkerId: 'U201', kanbanCardId: KANBAN_ENTRIES.find(k => k.lineNumber === lineConfig.lineId)?.id || 'KAN-1',
                    status: status,
                };
                if(status !== 'Pass') {
                    const randomOp = bulletin[Math.floor(Math.random() * bulletin.length)];
                    check.defectId = DEFECTS[Math.floor(Math.random() * DEFECTS.length)].id;
                    check.responsibleOpId = randomOp.operationId;
                    check.responsibleEmpId = (allocationMap.get(randomOp.operationId) || [])[0];
                    if (status === 'Rework') {
                        check.reworkStatus = Math.random() > 0.5 ? 'completed' : 'pending';
                    }
                }
                endLineChecks.push(check);
            }
            // Generate In Line Audits
             if (day % 2 === 0) { // Audit every other day
                inLineAudits.push({
                    id: `AUD-${dateStr}-${lineConfig.lineId}`, timestamp: new Date(`${dateStr}T11:00:00Z`).toISOString(),
                    lineNumber: lineConfig.lineId, visitNumber: 1, auditorId: 'U201',
                    records: Array.from(allocationMap.entries()).map(([opId, empIds]) => {
                        const statusRoll = Math.random();
                        let status = 'Green';
                        if (statusRoll < 0.1) status = 'Red';
                        else if (statusRoll < 0.3) status = 'Yellow';
                        return { operationId: opId, employeeId: empIds[0], defectsFound: status === 'Red' ? 2 : (status === 'Yellow' ? 1 : 0), status: status };
                    })
                });
            }
        }
    }
    return { entries, endLineChecks, inLineAudits, dailyAttendances };
};

const fullProdData = generateFullProductionData();

const today = new Date().toISOString().split('T')[0];
const DAILY_LINE_PLANS = [
    { id: 'DLP-1', date: today, lineNumber: 'L01', orderNumber: 'ORD-001', colorId: 'C01', plannedQuantity: 250, plannedManpower: { operators: 20, helpers: 4, checkers: 2 } },
    { id: 'DLP-2', date: today, lineNumber: 'L02', orderNumber: 'ORD-005', colorId: 'C05', plannedQuantity: 280, plannedManpower: { operators: 22, helpers: 5, checkers: 2 } },
    { id: 'DLP-3', date: today, lineNumber: 'L03', orderNumber: 'ORD-003', colorId: 'C02', plannedQuantity: 220, plannedManpower: { operators: 18, helpers: 4, checkers: 2 } },
    { id: 'DLP-4', date: today, lineNumber: 'L04', orderNumber: 'ORD-004', colorId: 'C01', plannedQuantity: 180, plannedManpower: { operators: 25, helpers: 5, checkers: 3 } },
];

// This is our in-memory database.
const db = {
    lines: deepCopy(LINES),
    staff: deepCopy(STAFF),
    employees: deepCopy(EMPLOYEES),
    downtimeReasons: deepCopy(DOWNTIME_REASONS),
    styles: deepCopy(STYLES),
    colors: deepCopy(COLORS),
    customers: deepCopy(CUSTOMERS),
    orders: deepCopy(ORDERS),
    operations: deepCopy(OPERATIONS),
    operatorGrades: deepCopy(OPERATOR_GRADES),
    machines: deepCopy(MACHINES),
    defects: deepCopy(DEFECTS),
    correctiveActions: deepCopy(CORRECTIVE_ACTIONS),
    kpiSettings: deepCopy(KPI_SETTINGS),
    kanbanSettings: { maxQuantityPerCard: 100, maxActiveCardsPerLine: 4 },
    allowanceSettings: { personalAndFatigue: 8, bundle: 5 },
    gradePerformanceSettings: deepCopy(GRADE_PERFORMANCE_SETTINGS),
    productionEntries: deepCopy(fullProdData.entries),
    kanbanEntries: deepCopy(KANBAN_ENTRIES),
    lineAllocations: deepCopy(LINE_ALLOCATIONS),
    allocationLog: [{id: 'LOG-1', timestamp: new Date().toISOString(), allocationId: 'ALLOC-1', details: 'Initial plan created for Line 1.'}],
    timeStudies: deepCopy(TIME_STUDIES),
    inLineAudits: deepCopy(fullProdData.inLineAudits),
    endLineChecks: deepCopy(fullProdData.endLineChecks),
    aqlInspections: [],
    nonConformanceReports: [{ id: 'NCR-1', ncNumber: 'NC-101', date: today, source: 'Internal Audit', sourceId: 'AUD-1', details: 'High number of skip stitches on hoodies.', why1: 'Needle not changed', why2: 'Operator not trained on schedule', why3: 'PM schedule missed', why4: '', why5: '', rootCause: 'PM schedule adherence is low', correctiveAction: 'Retrain operator', preventiveAction: 'Implement PM alert system', responsibleStaffId: 'U101', dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], status: 'Open' }],
    permissions: deepCopy(INITIAL_PERMISSIONS),
    staffPerformanceRecords: [],
    staffKpis: [],
    dailyLinePlans: deepCopy(DAILY_LINE_PLANS),
    dailyAttendances: deepCopy(fullProdData.dailyAttendances),
    factorySettings: {
        workingHoursPerDay: 8,
        organizationDetails: {
            name: 'SewTrak Inc.',
            address: '123 Garment Way, Industrial Zone',
            logoBase64: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzJjNGU4YSIvPjxnIHRyYW5zZm9ybT0icm90YXRlKDEzNSA3MCAzMCkiPjxwYXRoIGQ9Ik0gNzAgMTAgTCA2OCA1MCBMIDcyIDUwIFoiIGZpbGw9IiNGRkYiLz48Y2lyY2xlIGN4PSI3MCIgY3k9IjIwIiByPSIyIiBmaWxsPSIjMmM0ZThhIi8+PC9nPjxwYXRoIGQ9Ik0yMCA3MCBMNDAgNTAgTDYwIDYwIEw4MCA0MCIgc3Ryb2tlPSIjZjdhOTNiIiBzdHJva2Utd2lkdGg9IjgiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg=='
        },
        planningMode: 'AI-Assisted',
        iotDeviceMode: true
    },
    outputSettings: { source: 'lastOperation' },
    levelDefinitions: [
        { level: 1, name: 'Rookie', pointsRequired: 0, avatar: 'Avatar01' },
        { level: 2, name: 'Apprentice', pointsRequired: 10000, avatar: 'Avatar02' },
        { level: 3, name: 'Artisan', pointsRequired: 25000, avatar: 'Avatar06' },
        { level: 4, name: 'Expert', pointsRequired: 50000, avatar: 'Avatar10' },
        { level: 5, name: 'Master', pointsRequired: 100000, avatar: 'Avatar17' },
        { level: 6, name: 'Legend', pointsRequired: 200000, avatar: 'Avatar20' },
    ],
    gamificationSettings: {
        pointsForAttendance: 100,
        pointsPerProductionUnit: 50,
        pointsPerEfficiencyPercent: 10,
        efficiencyBaseline: 70,
        pointsPerRFTPercent: 20,
        pointsForMilestone: 500,
        pointsForNoDefects: 200,
        pointsForHelping: 150,
        pointsForTraining: 300,
        coinConversionRate: 1000,
    },
    performanceCycles: [
        { id: 'PC-2024-Q3', name: 'Q3 2024 Performance Cycle', startDate: '2024-07-01', endDate: '2024-09-30', status: 'Active' }
    ],
    objectives: [],
};

module.exports = db;
