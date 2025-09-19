import type { 
  AllData, Line, MasterDataItem, OperatorGrade, Machine, Operation, Style, Order, Staff, UserRole, Page, GradePerformanceSetting, Defect, CorrectiveAction, KpiSetting, KanbanEntry, LineAllocation, TimeStudy, InLineAudit, EndLineCheck, AqlInspection, NonConformanceReport, DailyLinePlan, DailyAttendance, GamificationSettings, LevelDefinition, StaffPerformanceRecord, IoTSignalLog, Objective, PerformanceCycle,
  // FIX: Import missing types
  ProductionEntry,
  // FIX: Add missing Employee type to fix compilation errors.
  Employee,
  IoTDevice,
  Notification,
  TeamMessage,
  StaffKpi,
  KeyResult
} from '../types';
import { ALL_PAGES } from '../constants';

// From backend/constants.js
const LINES: Line[] = [
  { id: 'L01', name: 'Line 1', color: 'bg-sky-50' },
  { id: 'L02', name: 'Line 2', color: 'bg-teal-50' },
  { id: 'L03', name: 'Line 3', color: 'bg-rose-50' },
  { id: 'L04', name: 'Line 4', color: 'bg-amber-50' },
];

const COLORS: MasterDataItem[] = [
  { id: 'C01', name: 'Navy Blue' },
  { id: 'C02', name: 'Charcoal Grey' },
  { id: 'C03', name: 'Burgundy' },
  { id: 'C04', name: 'Forrest Green' },
  { id: 'C05', name: 'Black' },
];

const OPERATOR_GRADES: OperatorGrade[] = [
    { id: 'OG-A++', name: 'Grade A++' },
    { id: 'OG-A+', name: 'Grade A+' },
    { id: 'OG-A', name: 'Grade A' },
    { id: 'OG-B', name: 'Grade B' },
    { id: 'OG-C', name: 'Grade C' },
    { id: 'OG-D', name: 'Grade D' },
];

const MACHINES: Machine[] = [
    { id: 'M-OL', name: 'OverLock', allowance: 5 },
    { id: 'M-FL', name: 'FlatLock', allowance: 5 },
    { id: 'M-SNLS', name: 'SNLS (Single Needle Lock Stitch)', allowance: 3 },
    { id: 'M-SP', name: 'Special Machine', allowance: 7 },
    { id: 'M-MAN', name: 'Manual Operation', allowance: 0 },
    { id: 'M-DNLS', name: 'DNLS (Double Needle Lock Stitch)', allowance: 4 },
];

const OPERATIONS: Operation[] = [
  { id: 'OP01', name: 'Fabric Cutting', skillType: 'Basic' },
  { id: 'OP02', name: 'Shoulder Attach', skillType: 'Semi Critical' },
  { id: 'OP03', name: 'Sleeve Attach', skillType: 'Semi Critical' },
  { id: 'OP04', name: 'Collar Attach', skillType: 'Critical' },
  { id: 'OP05', name: 'Side Seam', skillType: 'Semi Critical' },
  { id: 'OP06', name: 'Hemming', skillType: 'Basic' },
  { id: 'OP07', name: 'Final Inspection', skillType: 'Critical' },
  { id: 'OP08', name: 'Packing', skillType: 'Basic' },
  { id: 'OP09', name: 'Back Pocket Set', skillType: 'Critical' },
  { id: 'OP10', name: 'Waistband Attach', skillType: 'Critical' },
  { id: 'OP11', name: 'Belt Loop Attach', skillType: 'Semi Critical' },
  { id: 'OP12', name: 'Bottom Hem', skillType: 'Basic' },
  { id: 'OP13', name: 'Button Attach', skillType: 'Basic' },
  { id: 'OP14', name: 'Washing', skillType: 'Basic' },
];

const STYLES: Style[] = [
  { 
    id: 'S101', 
    name: 'Men\'s Crew-Neck T-Shirt', 
    colorIds: ['C01', 'C05'], 
    operationBulletin: [
      { sNo: 1, operationId: 'OP02', operatorGradeId: 'OG-B', machineId: 'M-SNLS', pickupTime: 7.2, sewingTime: 57.6, trimAndDisposalTime: 7.2 },
      { sNo: 2, operationId: 'OP03', operatorGradeId: 'OG-A', machineId: 'M-OL', pickupTime: 10.8, sewingTime: 86.4, trimAndDisposalTime: 10.8 },
      { sNo: 3, operationId: 'OP04', operatorGradeId: 'OG-A', machineId: 'M-SNLS', pickupTime: 9, sewingTime: 72, trimAndDisposalTime: 9 },
      { sNo: 4, operationId: 'OP05', operatorGradeId: 'OG-B', machineId: 'M-OL', pickupTime: 12.6, sewingTime: 100.8, trimAndDisposalTime: 12.6 },
      { sNo: 5, operationId: 'OP06', operatorGradeId: 'OG-B', machineId: 'M-FL', pickupTime: 10.5, sewingTime: 84, trimAndDisposalTime: 10.5 },
      { sNo: 6, operationId: 'OP07', operatorGradeId: 'OG-C', machineId: 'M-MAN', pickupTime: 4.8, sewingTime: 38.4, trimAndDisposalTime: 4.8 },
      { sNo: 7, operationId: 'OP08', operatorGradeId: 'OG-D', machineId: 'M-MAN', pickupTime: 6, sewingTime: 48, trimAndDisposalTime: 6 },
    ],
    fabric: '100% Cotton',
    obStatus: 'Approved',
    targetDailyOutput: 250,
    targetEfficiency: 85,
  },
  { 
    id: 'S102', 
    name: 'Women\'s V-Neck Blouse', 
    colorIds: ['C03', 'C04'], 
    operationBulletin: [
      { sNo: 1, operationId: 'OP02', operatorGradeId: 'OG-B', machineId: 'M-SNLS', pickupTime: 8.0, sewingTime: 64.0, trimAndDisposalTime: 8.0 },
      { sNo: 2, operationId: 'OP04', operatorGradeId: 'OG-A', machineId: 'M-SNLS', pickupTime: 12.0, sewingTime: 96.0, trimAndDisposalTime: 12.0 },
      { sNo: 3, operationId: 'OP05', operatorGradeId: 'OG-B', machineId: 'M-OL', pickupTime: 14.0, sewingTime: 112.0, trimAndDisposalTime: 14.0 },
      { sNo: 4, operationId: 'OP06', operatorGradeId: 'OG-B', machineId: 'M-FL', pickupTime: 11.0, sewingTime: 88.0, trimAndDisposalTime: 11.0 },
      { sNo: 5, operationId: 'OP07', operatorGradeId: 'OG-C', machineId: 'M-MAN', pickupTime: 5.0, sewingTime: 40.0, trimAndDisposalTime: 5.0 },
      { sNo: 6, operationId: 'OP08', operatorGradeId: 'OG-D', machineId: 'M-MAN', pickupTime: 6.5, sewingTime: 52.0, trimAndDisposalTime: 6.5 },
    ],
    fabric: 'Rayon Crepe', 
    obStatus: 'Draft', 
    targetDailyOutput: 180, 
    targetEfficiency: 80 
  },
  { 
    id: 'S103', 
    name: 'Unisex Hoodie', 
    colorIds: ['C01', 'C02', 'C05'], 
    operationBulletin: [
      { sNo: 1, operationId: 'OP02', operatorGradeId: 'OG-B', machineId: 'M-SNLS', pickupTime: 7.8, sewingTime: 62.4, trimAndDisposalTime: 7.8 },
      { sNo: 2, operationId: 'OP03', operatorGradeId: 'OG-A', machineId: 'M-OL', pickupTime: 11.4, sewingTime: 91.2, trimAndDisposalTime: 11.4 },
      { sNo: 3, operationId: 'OP05', operatorGradeId: 'OG-B', machineId: 'M-OL', pickupTime: 13.2, sewingTime: 105.6, trimAndDisposalTime: 13.2 },
      { sNo: 4, operationId: 'OP06', operatorGradeId: 'OG-B', machineId: 'M-FL', pickupTime: 10.8, sewingTime: 86.4, trimAndDisposalTime: 10.8 },
      { sNo: 5, operationId: 'OP07', operatorGradeId: 'OG-C', machineId: 'M-MAN', pickupTime: 5.4, sewingTime: 43.2, trimAndDisposalTime: 5.4 },
      { sNo: 6, operationId: 'OP08', operatorGradeId: 'OG-D', machineId: 'M-MAN', pickupTime: 6.6, sewingTime: 52.8, trimAndDisposalTime: 6.6 },
    ],
    fabric: 'Fleece',
    obStatus: 'Approved',
    targetDailyOutput: 200,
    targetEfficiency: 82,
  },
  { 
    id: 'S104', 
    name: 'Denim Jeans', 
    colorIds: ['C01'], 
    operationBulletin: [
      { sNo: 1, operationId: 'OP09', operatorGradeId: 'OG-A', machineId: 'M-DNLS', pickupTime: 15, sewingTime: 120, trimAndDisposalTime: 15 },
      { sNo: 2, operationId: 'OP05', operatorGradeId: 'OG-A', machineId: 'M-OL', pickupTime: 18, sewingTime: 144, trimAndDisposalTime: 18 },
      { sNo: 3, operationId: 'OP10', operatorGradeId: 'OG-A', machineId: 'M-SNLS', pickupTime: 16.8, sewingTime: 134.4, trimAndDisposalTime: 16.8 },
      { sNo: 4, operationId: 'OP11', operatorGradeId: 'OG-B', machineId: 'M-SP', pickupTime: 13.2, sewingTime: 105.6, trimAndDisposalTime: 13.2 },
      { sNo: 5, operationId: 'OP12', operatorGradeId: 'OG-B', machineId: 'M-FL', pickupTime: 11.4, sewingTime: 91.2, trimAndDisposalTime: 11.4 },
      { sNo: 6, operationId: 'OP13', operatorGradeId: 'OG-C', machineId: 'M-SP', pickupTime: 5.4, sewingTime: 43.2, trimAndDisposalTime: 5.4 },
      { sNo: 7, operationId: 'OP14', operatorGradeId: 'OG-C', machineId: 'M-MAN', pickupTime: 24, sewingTime: 192, trimAndDisposalTime: 24 },
      { sNo: 8, operationId: 'OP07', operatorGradeId: 'OG-C', machineId: 'M-MAN', pickupTime: 9, sewingTime: 72, trimAndDisposalTime: 9 },
      { sNo: 9, operationId: 'OP08', operatorGradeId: 'OG-D', machineId: 'M-MAN', pickupTime: 7.2, sewingTime: 57.6, trimAndDisposalTime: 7.2 },
    ],
    fabric: '14oz Denim',
    obStatus: 'Pending Approval',
    targetDailyOutput: 150,
    targetEfficiency: 78,
  },
];

const ORDERS: Order[] = [
  { id: 'ORD-001', name: 'Order #001', styleId: 'S101', customer: 'Global Textiles', quantities: [{ colorId: 'C01', quantity: 1000 }, { colorId: 'C05', quantity: 1500 }], poDate: '2024-06-01', deliveryDate: '2024-07-30', creationDate: '2024-06-02' },
  { id: 'ORD-002', name: 'Order #002', styleId: 'S102', customer: 'Fashion Forward', quantities: [{ colorId: 'C03', quantity: 500 }, { colorId: 'C04', quantity: 500 }], poDate: '2024-06-05', deliveryDate: '2024-08-15', creationDate: '2024-06-06' },
  { id: 'ORD-003', name: 'Order #003', styleId: 'S103', customer: 'Urban Outfitters', quantities: [{ colorId: 'C01', quantity: 800 }, { colorId: 'C02', quantity: 1200 }, { colorId: 'C05', quantity: 2000 }], poDate: '2024-06-10', deliveryDate: '2024-08-30', creationDate: '2024-06-11' },
  { id: 'ORD-004', name: 'Order #004', styleId: 'S104', customer: 'Denim Co.', quantities: [{ colorId: 'C01', quantity: 2500 }], poDate: '2024-06-15', deliveryDate: '2024-09-15', creationDate: '2024-06-16' },
  { id: 'ORD-005', name: 'Order #005', styleId: 'S101', customer: 'Global Textiles', quantities: [{ colorId: 'C05', quantity: 3000 }], poDate: '2024-06-20', deliveryDate: '2024-08-20', creationDate: '2024-06-21' },
];

const STAFF: Staff[] = [
    { id: 'U100', name: 'Admin User', email: 'admin@sewtrak.com', password: 'password', role: 'Admin', lineAssignments: ['all'] },
    { id: 'U101', name: 'Super Visor', email: 'supervisor@sewtrak.com', password: 'password', role: 'Supervisor', lineAssignments: ['L01', 'L02'] },
    { id: 'U201', name: 'QA Controller', email: 'qc@sewtrak.com', password: 'password', role: 'Quality Controller', lineAssignments: ['L01', 'L02', 'L03', 'L04'] },
    { id: 'U301', name: 'Indy Engineer', email: 'ie@sewtrak.com', password: 'password', role: 'Industrial Engineer', lineAssignments: ['L03'] },
    { id: 'U401', name: 'Prod Manager', email: 'pm@sewtrak.com', password: 'password', role: 'Production Manager', lineAssignments: ['all'] },
    { id: 'U402', name: 'Merch Andiser', email: 'merch@sewtrak.com', password: 'password', role: 'Merchandiser', lineAssignments: ['all'] },
];

const firstNames = ['John', 'Jane', 'Peter', 'Mary', 'David', 'Susan', 'Michael', 'Linda', 'James', 'Patricia'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

const generateEmployees = (): Employee[] => {
  const employeeList: Employee[] = [];
  const grades = ['OG-A', 'OG-B', 'OG-C', 'OG-D'];
  const maritalStatuses: ('Single' | 'Married' | 'Divorced' | 'Widowed')[] = ['Single', 'Married', 'Divorced', 'Widowed'];

  for (let line = 1; line <= 4; line++) {
    for (let i = 0; i < 20; i++) {
        const id = `E${line}${String(i).padStart(2, '0')}`;
        const designation = i < 15 ? 'Stitching Operator' : i < 18 ? 'Checker' : 'Helper';
        const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        const gender: ('Male' | 'Female' | 'Other') = Math.random() > 0.4 ? 'Female' : 'Male';
        
        let grade = grades[3]; // Default D
        if(designation === 'Stitching Operator') grade = grades[Math.floor(Math.random() * 3)]; // A, B, C
        if(designation === 'Checker') grade = grades[2]; // C
        
        employeeList.push({
            id: id,
            name: name,
            designation: designation,
            ctc: 1000 + Math.floor(Math.random() * 800),
            currentLineId: `L0${line}`,
            doj: `202${Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            operatorGradeId: grade,
            gender: gender,
            age: 20 + Math.floor(Math.random() * 30),
            maritalStatus: maritalStatuses[Math.floor(Math.random() * maritalStatuses.length)],
            area: 'Local Area'
        });
    }
  }
  return employeeList;
};

const EMPLOYEES: Employee[] = generateEmployees();

const DOWNTIME_REASONS: MasterDataItem[] = [
  { id: 'DR01', name: 'Machine malfunction' },
  { id: 'DR02', name: 'Material shortage' },
  { id: 'DR03', name: 'Operator break' },
  { id: 'DR04', name: 'Quality check failure' },
  { id: 'DR05', name: 'Power outage' },
];

const DEFECTS: Defect[] = [
    { id: 'DEF01', name: 'Broken Stitch' },
    { id: 'DEF02', name: 'Skip Stitch' },
    { id: 'DEF03', name: 'Open Seam' },
    { id: 'DEF04', name: 'Fabric Defect' },
    { id: 'DEF05', name: 'Measurement Out of Tolerance' },
];

const CORRECTIVE_ACTIONS: CorrectiveAction[] = [
    { id: 'CA01', name: 'Retrain Operator' },
    { id: 'CA02', name: 'Adjust Machine Settings' },
    { id: 'CA03', name: 'Provide Better Lighting' },
    { id: 'CA04', name: 'Change Needle' },
];

const CUSTOMERS: MasterDataItem[] = [...new Set(ORDERS.map(o => o.customer))].map((name, index) => ({
  id: `CUST${101 + index}`,
  name,
}));

const INITIAL_PERMISSIONS: Record<UserRole, Page[]> = {
    Admin: [...ALL_PAGES],
    'Production Manager': [
        'home', 'dashboard', 'lineDashboard', 'planningDashboard', 'qualityDashboard', 'gamificationDashboard',
        'production', 'productionHistory', 'attendance', 'kanbanEntry', 'kanbanManagement',
        'lineAllocation', 'linePlanning', 
        'orders', 'styles', 'employees', 'staff',
        'lines', 'operations', 'machines', 'operatorGrades', 'customers', 'defects', 'correctiveActions', 'reasons',
        'dailyReport', 'performanceAnalysis', 'orderClosingReport', 'skillMatrix',
        'teamPerformance', 'performanceReport', 'reviewSummary', 'myPerformance', 'growth',
        'inLineAudit', 'endLineInspection', 'aqlInspection', 'ncRegister',
        'aiInsights', 'iotControlPanel', 'iotDevices',
        'settings',
        'factorySettings', 'kanbanSettings', 'outputSettings', 'allowanceSettings', 'gradeSettings', 'kpiSettings', 'leaderboardSettings',
    ],
    Supervisor: [
        'home', 'lineDashboard', 'production', 'attendance', 'kanbanEntry', 'kanbanManagement',
        'lineAllocation', 'dailyReport', 
        'teamPerformance', 'reviewSummary', 'myPerformance',
        'inLineAudit', 'endLineInspection',
        'skillMatrix',
    ],
    'Quality Controller': [
        'home', 'qualityDashboard', 'lineDashboard',
        'inLineAudit', 'endLineInspection', 'aqlInspection', 'ncRegister',
        'productionHistory', 'defects', 'correctiveActions', 
        'myPerformance',
    ],
    'Industrial Engineer': [
        'home', 'lineDashboard', 'planningDashboard',
        'styles', 'operations', 'machines', 'operatorGrades',
        'timeStudy', 'aiInsights', 'performanceAnalysis', 'skillMatrix',
        'allowanceSettings', 'gradeSettings',
        'myPerformance', 'growth',
    ],
    Merchandiser: [
        'home', 'planningDashboard', 'orders', 'styles', 'customers', 'colors',
        'orderClosingReport', 'myPerformance',
    ],
    Operator: [
        'home', 'myPerformance', 'gamificationDashboard'
    ],
};

const GRADE_PERFORMANCE_SETTINGS: GradePerformanceSetting[] = [
    { gradeId: 'OG-A++', minEfficiency: 110, maxEfficiency: 9999 },
    { gradeId: 'OG-A+', minEfficiency: 100, maxEfficiency: 109 },
    { gradeId: 'OG-A', minEfficiency: 85, maxEfficiency: 99 },
    { gradeId: 'OG-B', minEfficiency: 70, maxEfficiency: 84 },
    { gradeId: 'OG-C', minEfficiency: 60, maxEfficiency: 69 },
    { gradeId: 'OG-D', minEfficiency: 0, maxEfficiency: 59 },
];

const KPI_SETTINGS: KpiSetting[] = [
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

const KANBAN_ENTRIES: KanbanEntry[] = [
    { id: 'KAN-1', timestamp: '2024-01-01T08:00:00Z', lineNumber: 'L01', orderNumber: 'ORD-001', colorId: 'C01', quantity: 1000, status: 'completed', producedOnCard: 850, dcNumber: 'DC101', dcDate: '2024-01-01' },
    { id: 'KAN-2', timestamp: '2024-01-01T08:05:00Z', lineNumber: 'L02', orderNumber: 'ORD-005', colorId: 'C05', quantity: 1200, status: 'completed', producedOnCard: 980, dcNumber: 'DC102', dcDate: '2024-01-01' },
    { id: 'KAN-3', timestamp: '2024-01-01T08:10:00Z', lineNumber: 'L03', orderNumber: 'ORD-003', colorId: 'C02', quantity: 800, status: 'active', producedOnCard: 650, dcNumber: 'DC103', dcDate: '2024-01-01' },
    { id: 'KAN-4', timestamp: '2024-01-01T08:15:00Z', lineNumber: 'L04', orderNumber: 'ORD-004', colorId: 'C01', quantity: 1500, status: 'active', producedOnCard: 1100, dcNumber: 'DC104', dcDate: '2024-01-01' },
];

const LINE_ALLOCATIONS: LineAllocation[] = [
    { id: 'ALLOC-1', lastUpdated: '2024-01-01T07:30:00Z', lineNumber: 'L01', orderNumber: 'ORD-001', assignments: STYLES.find(s=>s.id==='S101')!.operationBulletin.map((op, i) => ({ operationId: op.operationId, employeeIds: [`E1${String(i).padStart(2,'0')}`] })) },
    { id: 'ALLOC-2', lastUpdated: '2024-01-01T07:30:00Z', lineNumber: 'L02', orderNumber: 'ORD-005', assignments: STYLES.find(s=>s.id==='S101')!.operationBulletin.map((op, i) => ({ operationId: op.operationId, employeeIds: [`E2${String(i).padStart(2,'0')}`] })) },
    { id: 'ALLOC-3', lastUpdated: '2024-01-01T07:30:00Z', lineNumber: 'L03', orderNumber: 'ORD-003', assignments: STYLES.find(s=>s.id==='S103')!.operationBulletin.map((op, i) => ({ operationId: op.operationId, employeeIds: [`E3${String(i).padStart(2,'0')}`] })) },
    { id: 'ALLOC-4', lastUpdated: '2024-01-01T07:30:00Z', lineNumber: 'L04', orderNumber: 'ORD-004', assignments: STYLES.find(s=>s.id==='S104')!.operationBulletin.map((op, i) => ({ operationId: op.operationId, employeeIds: [`E4${String(i).padStart(2,'0')}`] })) },
];

const TIME_STUDIES: TimeStudy[] = [
    { id: 'TS-1', timestamp: '2024-01-02T10:00:00Z', employeeId: 'E101', employeeGradeId: 'OG-B', operationId: 'OP02', styleId: 'S101', machineId: 'M-SNLS', machineName: 'SNLS', cycles: [{cycleNumber:1, pickupTime:7.1, sewingTime:55.2, trimAndDisposalTime:6.9, totalObservedTime: 69.2, basicTime: 69.2, standardTime: 80.27, selected: true}], averageObservedTime: 69.2, averageStandardTime: 80.27 },
    { id: 'TS-2', timestamp: '2024-01-02T11:00:00Z', employeeId: 'E105', employeeGradeId: 'OG-A', operationId: 'OP04', styleId: 'S101', machineId: 'M-SNLS', machineName: 'SNLS', cycles: [{cycleNumber:1, pickupTime:10.5, sewingTime:68.1, trimAndDisposalTime:8.4, totalObservedTime: 87, basicTime: 87, standardTime: 101.0, selected: true}], averageObservedTime: 87, averageStandardTime: 101.0 },
    { id: 'TS-3', timestamp: '2024-01-03T09:00:00Z', employeeId: 'E401', employeeGradeId: 'OG-A', operationId: 'OP09', styleId: 'S104', machineId: 'M-DNLS', machineName: 'DNLS', cycles: [{cycleNumber:1, pickupTime:18.2, sewingTime:110.5, trimAndDisposalTime:15.3, totalObservedTime: 144, basicTime: 144, standardTime: 167.0, selected: true}], averageObservedTime: 144, averageStandardTime: 167.0 },
    { id: 'TS-4', timestamp: '2024-01-03T14:00:00Z', employeeId: 'E402', employeeGradeId: 'OG-A', operationId: 'OP10', styleId: 'S104', machineId: 'M-SNLS', machineName: 'SNLS', cycles: [{cycleNumber:1, pickupTime:20.1, sewingTime:125.9, trimAndDisposalTime:18.0, totalObservedTime: 164, basicTime: 164, standardTime: 190.2, selected: true}], averageObservedTime: 164, averageStandardTime: 190.2 },
];

const generateFullProductionData = () => {
    const entries: ProductionEntry[] = [];
    const endLineChecks: EndLineCheck[] = [];
    const inLineAudits: InLineAudit[] = [];
    const dailyAttendances: DailyAttendance[] = [];

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
        
        const presentEmployees = new Set<string>();
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
            const dailyWip = new Map<string, number>();
            let totalDayOutput = 0;

            for (let hour = 1; hour <= 8; hour++) {
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

            for(let i=0; i < totalDayOutput; i++) {
                const statusRoll = Math.random();
                let status: 'Pass' | 'Rework' | 'Reject' = 'Pass';
                if (statusRoll < 0.05) status = 'Reject';
                else if (statusRoll < 0.1) status = 'Rework';
                
                const check: EndLineCheck = {
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
             if (day % 2 === 0) { 
                inLineAudits.push({
                    id: `AUD-${dateStr}-${lineConfig.lineId}`, timestamp: new Date(`${dateStr}T11:00:00Z`).toISOString(),
                    lineNumber: lineConfig.lineId, visitNumber: 1, auditorId: 'U201',
                    records: Array.from(allocationMap.entries()).map(([opId, empIds]) => {
                        const statusRoll = Math.random();
                        let status: 'Green' | 'Yellow' | 'Red' = 'Green';
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
const DAILY_LINE_PLANS: DailyLinePlan[] = [
    { id: 'DLP-1', date: today, lineNumber: 'L01', orderNumber: 'ORD-001', colorId: 'C01', plannedQuantity: 250, plannedManpower: { operators: 20, helpers: 4, checkers: 2 } },
    { id: 'DLP-2', date: today, lineNumber: 'L02', orderNumber: 'ORD-005', colorId: 'C05', plannedQuantity: 280, plannedManpower: { operators: 22, helpers: 5, checkers: 2 } },
    { id: 'DLP-3', date: today, lineNumber: 'L03', orderNumber: 'ORD-003', colorId: 'C02', plannedQuantity: 220, plannedManpower: { operators: 18, helpers: 4, checkers: 2 } },
    { id: 'DLP-4', date: today, lineNumber: 'L04', orderNumber: 'ORD-004', colorId: 'C01', plannedQuantity: 180, plannedManpower: { operators: 25, helpers: 5, checkers: 3 } },
];

const NOTIFICATIONS: Notification[] = [
    { id: 'N1', userId: 'U100', message: 'Line 2 efficiency is below target at 68%.', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false, link: { page: 'lineDashboard' } },
    { id: 'N2', userId: 'U100', message: 'New NC Report requires your attention for AQL failure on KAN-1.', timestamp: new Date(Date.now() - 7200000).toISOString(), read: false, link: { page: 'ncRegister' } },
    { id: 'N3', userId: 'U100', message: 'Order ORD-002 is approaching its delivery date.', timestamp: new Date(Date.now() - 86400000).toISOString(), read: true, link: { page: 'orders' } },
];

const TEAM_MESSAGES: TeamMessage[] = [
    { id: 'M1', senderId: 'U401', recipientIds: ['U101'], subject: 'Line 1 Production Plan', message: 'Please ensure Line 1 focuses on ORD-001 Navy Blue for the first half of the day.', timestamp: new Date(Date.now() - 12000000).toISOString(), replies: [] },
    { id: 'M2', senderId: 'U101', recipientIds: ['U401'], subject: 'Re: Line 1 Production Plan', message: 'Acknowledged. We are prioritizing ORD-001.', timestamp: new Date(Date.now() - 11000000).toISOString(), replies: [] },
];

const STAFF_KPIS: StaffKpi[] = [
    // Production Manager
    { id: 'SKPI-PM-1', role: 'Production Manager', kpi: 'Total Factory OWE (Today)', definition: 'Overall Weighted Efficiency for all lines.', source: 'Automatic', unit: '%', weight: 40, target: 80, threshold: 70, category: 'Production', frequency: 'Daily', direction: 'Up' },
    { id: 'SKPI-PM-2', role: 'Production Manager', kpi: 'Overall On-Time Delivery % (All Orders)', definition: 'Percentage of orders shipped on or before their due date this month.', source: 'Automatic', unit: '%', weight: 30, target: 95, threshold: 85, category: 'Delivery', frequency: 'Monthly', direction: 'Up' },
    { id: 'SKPI-PM-3', role: 'Production Manager', kpi: 'Total Open NCs', definition: 'Number of open Non-Conformance reports across the factory.', source: 'Automatic', unit: 'count', weight: 15, target: 0, threshold: 3, category: 'Quality', frequency: 'Daily', direction: 'Down' },
    { id: 'SKPI-PM-4', role: 'Production Manager', kpi: 'Capacity Utilization % (Next 30d)', definition: 'Percentage of available minutes booked in the next 30 days.', source: 'Automatic', unit: '%', weight: 15, target: 90, threshold: 75, category: 'Planning', frequency: 'Daily', direction: 'Up' },
    
    // Supervisor
    { id: 'SKPI-SUP-1', role: 'Supervisor', kpi: "Team's Daily Efficiency", definition: 'OWE for all assigned lines.', source: 'Automatic', unit: '%', weight: 50, target: 82, threshold: 72, category: 'Production', frequency: 'Daily', direction: 'Up' },
    { id: 'SKPI-SUP-2', role: 'Supervisor', kpi: "Team's RFT", definition: 'Right-First-Time percentage for assigned lines.', source: 'Automatic', unit: '%', weight: 30, target: 97, threshold: 92, category: 'Quality', frequency: 'Daily', direction: 'Up' },
    { id: 'SKPI-SUP-3', role: 'Supervisor', kpi: 'Downtime Management', definition: 'Total downtime minutes for assigned lines.', source: 'Automatic', unit: 'mins', weight: 20, target: 30, threshold: 60, category: 'Production', frequency: 'Daily', direction: 'Down' },

    // Industrial Engineer
    { id: 'SKPI-IE-1', role: 'Industrial Engineer', kpi: 'Time Studies Conducted', definition: 'Number of new time studies completed today.', source: 'Automatic', unit: 'count', weight: 30, target: 2, threshold: 1, category: 'Engineering', frequency: 'Daily', direction: 'Up' },
    { id: 'SKPI-IE-2', role: 'Industrial Engineer', kpi: 'Overall Line Efficiency (OWE)', definition: 'Impact of IE improvements on overall factory efficiency.', source: 'Automatic', unit: '%', weight: 50, target: 80, threshold: 70, category: 'Production', frequency: 'Daily', direction: 'Up' },
    { id: 'SKPI-IE-3', role: 'Industrial Engineer', kpi: 'Manual Task: Process Audit', definition: 'Completed a process audit on a line.', source: 'Manual', unit: 'boolean', weight: 20, target: 1, threshold: 0, category: 'Engineering', frequency: 'Daily', direction: 'Up' },

    // Quality Controller
    { id: 'SKPI-QC-1', role: 'Quality Controller', kpi: 'Factory RFT%', definition: 'Overall RFT for the factory.', source: 'Automatic', unit: '%', weight: 40, target: 96, threshold: 90, category: 'Quality', frequency: 'Daily', direction: 'Up' },
    { id: 'SKPI-QC-2', role: 'Quality Controller', kpi: 'Audits Completed', definition: 'Number of in-line audits conducted.', source: 'Automatic', unit: 'count', weight: 40, target: 4, threshold: 2, category: 'Quality', frequency: 'Daily', direction: 'Up' },
    { id: 'SKPI-QC-3', role: 'Quality Controller', kpi: 'Total Open NCs', definition: 'Number of open Non-Conformance reports.', source: 'Automatic', unit: 'count', weight: 20, target: 0, threshold: 3, category: 'Quality', frequency: 'Daily', direction: 'Down' },
    
    // Merchandiser
    { id: 'SKPI-MERCH-1', role: 'Merchandiser', kpi: 'Overall On-Time Delivery % (All Orders)', definition: 'Percentage of orders shipped on time this month.', source: 'Automatic', unit: '%', weight: 60, target: 95, threshold: 85, category: 'Delivery', frequency: 'Monthly', direction: 'Up' },
    { id: 'SKPI-MERCH-2', role: 'Merchandiser', kpi: 'Assembly Cost / Garment', definition: 'Average assembly cost per produced garment for closed orders.', source: 'Automatic', unit: 'currency', weight: 40, target: 22, threshold: 25, category: 'Financial', frequency: 'Monthly', direction: 'Down' },
];

const OBJECTIVES: Objective[] = [
    {
        id: 'OBJ-U301-1',
        cycleId: 'PC-2024-Q3',
        ownerId: 'U301', // Indy Engineer
        title: 'Improve Line 3 Efficiency for S103 Hoodie',
        description: 'Reduce the SMV and increase output by optimizing the workflow for the Unisex Hoodie on Line 3.',
        visibility: 'Public',
        keyResults: [
            { id: 'KR-U301-1-1', description: 'Reduce total SMV for S103 from 8.8 to 8.5 minutes', type: 'NUMBER', startValue: 8.8, currentValue: 8.7, targetValue: 8.5, weight: 50 },
            { id: 'KR-U301-1-2', description: 'Increase average daily output on Line 3 from 220 to 240 units', type: 'NUMBER', startValue: 220, currentValue: 228, targetValue: 240, weight: 30 },
            { id: 'KR-U301-1-3', description: 'Decrease machine downtime on Line 3 by 15%', type: 'PERCENTAGE', startValue: 0, currentValue: 8, targetValue: 15, weight: 20 },
        ]
    },
    {
        id: 'OBJ-U101-1',
        cycleId: 'PC-2024-Q3',
        ownerId: 'U101', // Supervisor
        title: 'Enhance Quality Output on Line 1',
        description: 'Focus on training and process control to improve the Right-First-Time percentage and reduce defects.',
        visibility: 'Public',
        keyResults: [
            { id: 'KR-U101-1-1', description: 'Increase RFT% for Line 1 from 95% to 98%', type: 'PERCENTAGE', startValue: 95, currentValue: 96.2, targetValue: 98, weight: 70 },
            { id: 'KR-U101-1-2', description: 'Reduce open NC reports for Line 1 from 3 to 0', type: 'NUMBER', startValue: 3, currentValue: 1, targetValue: 0, weight: 30 },
        ]
    }
];

const db: AllData = {
    currentUser: STAFF[0],
    lines: LINES,
    staff: STAFF,
    employees: EMPLOYEES,
    downtimeReasons: DOWNTIME_REASONS,
    styles: STYLES,
    colors: COLORS,
    customers: CUSTOMERS,
    orders: ORDERS,
    operations: OPERATIONS,
    operatorGrades: OPERATOR_GRADES,
    machines: MACHINES,
    defects: DEFECTS,
    correctiveActions: CORRECTIVE_ACTIONS,
    kpiSettings: KPI_SETTINGS,
    kanbanSettings: { maxQuantityPerCard: 100, maxActiveCardsPerLine: 4 },
    allowanceSettings: { personalAndFatigue: 8, bundle: 5 },
    gradePerformanceSettings: GRADE_PERFORMANCE_SETTINGS,
    productionEntries: fullProdData.entries,
    kanbanEntries: KANBAN_ENTRIES,
    lineAllocations: LINE_ALLOCATIONS,
    allocationLog: [{id: 'LOG-1', timestamp: new Date().toISOString(), allocationId: 'ALLOC-1', details: 'Initial plan created for Line 1.'}],
    timeStudies: TIME_STUDIES,
    inLineAudits: fullProdData.inLineAudits,
    endLineChecks: fullProdData.endLineChecks,
    nonConformanceReports: [{ id: 'NCR-1', ncNumber: 'NC-101', date: today, source: 'Internal Audit', sourceId: 'AUD-1', details: 'High number of skip stitches on hoodies.', why1: 'Needle not changed', why2: 'Operator not trained on schedule', why3: 'PM schedule missed', why4: '', why5: '', rootCause: 'PM schedule adherence is low', correctiveAction: 'Retrain operator', preventiveAction: 'Implement PM alert system', responsibleStaffId: 'U101', dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], status: 'Open' }],
    permissions: INITIAL_PERMISSIONS,
    staffPerformanceRecords: [],
    staffKpis: STAFF_KPIS,
    dailyLinePlans: DAILY_LINE_PLANS,
    dailyAttendances: fullProdData.dailyAttendances,
    factorySettings: {
        workingHoursPerDay: 8,
        organizationDetails: {
            name: 'SewTrak Inc.',
            address: '123 Garment Way, Industrial Zone',
            logoBase64: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzJjNGU4YSIvPjxnIHRyYW5zZm9ybT0icm90YXRlKDEzNSA3MCAzMCkiPjxwYXRoIGQ9Ik0gNzAgMTAgTCA2OCA1MCBMIDcyIDUwIFoiIGZpbGw9IiNGRkYiLz48Y2lyY2xlIGN4PSI3MCIgY3k9IjIwIiByPSIyIiBmaWxsPSIjMmM0ZThhIi8+PC9nPjxwYXRoIGQ9Ik0yMCA3MCBMNDAgNTAgTDYwIDYwIEw4MCA0MCIgc3Ryb2tlPSIjZjdhOTNiIiBzdHJva2Utd2lkdGg9IjgiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg=='
        },
        planningMode: 'AI-Assisted',
        iotDeviceMode: true,
        customFieldDefinitions: [],
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
    objectives: OBJECTIVES,
    iotDevices: [],
    iotSignalLogs: [],
    aqlInspections: [],
    notifications: NOTIFICATIONS,
    teamMessages: TEAM_MESSAGES,
};

export default db;