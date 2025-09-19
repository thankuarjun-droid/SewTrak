const LINES = [
  { id: 'L01', name: 'Line 1', color: 'bg-sky-50' },
  { id: 'L02', name: 'Line 2', color: 'bg-teal-50' },
  { id: 'L03', name: 'Line 3', color: 'bg-rose-50' },
  { id: 'L04', name: 'Line 4', color: 'bg-amber-50' },
];

const COLORS = [
  { id: 'C01', name: 'Navy Blue' },
  { id: 'C02', name: 'Charcoal Grey' },
  { id: 'C03', name: 'Burgundy' },
  { id: 'C04', name: 'Forrest Green' },
  { id: 'C05', name: 'Black' },
];

const OPERATOR_GRADES = [
    { id: 'OG-A++', name: 'Grade A++' },
    { id: 'OG-A+', name: 'Grade A+' },
    { id: 'OG-A', name: 'Grade A' },
    { id: 'OG-B', name: 'Grade B' },
    { id: 'OG-C', name: 'Grade C' },
    { id: 'OG-D', name: 'Grade D' },
];

const MACHINES = [
    { id: 'M-OL', name: 'OverLock', allowance: 5 },
    { id: 'M-FL', name: 'FlatLock', allowance: 5 },
    { id: 'M-SNLS', name: 'SNLS (Single Needle Lock Stitch)', allowance: 3 },
    { id: 'M-SP', name: 'Special Machine', allowance: 7 },
    { id: 'M-MAN', name: 'Manual Operation', allowance: 0 },
    { id: 'M-DNLS', name: 'DNLS (Double Needle Lock Stitch)', allowance: 4 },
];

const OPERATIONS = [
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

const STYLES = [
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

const ORDERS = [
  { id: 'ORD-001', name: 'Order #001', styleId: 'S101', customer: 'Global Textiles', quantities: [{ colorId: 'C01', quantity: 1000 }, { colorId: 'C05', quantity: 1500 }], poDate: '2024-06-01', deliveryDate: '2024-07-30', creationDate: '2024-06-02' },
  { id: 'ORD-002', name: 'Order #002', styleId: 'S102', customer: 'Fashion Forward', quantities: [{ colorId: 'C03', quantity: 500 }, { colorId: 'C04', quantity: 500 }], poDate: '2024-06-05', deliveryDate: '2024-08-15', creationDate: '2024-06-06' },
  { id: 'ORD-003', name: 'Order #003', styleId: 'S103', customer: 'Urban Outfitters', quantities: [{ colorId: 'C01', quantity: 800 }, { colorId: 'C02', quantity: 1200 }, { colorId: 'C05', quantity: 2000 }], poDate: '2024-06-10', deliveryDate: '2024-08-30', creationDate: '2024-06-11' },
  { id: 'ORD-004', name: 'Order #004', styleId: 'S104', customer: 'Denim Co.', quantities: [{ colorId: 'C01', quantity: 2500 }], poDate: '2024-06-15', deliveryDate: '2024-09-15', creationDate: '2024-06-16' },
  { id: 'ORD-005', name: 'Order #005', styleId: 'S101', customer: 'Global Textiles', quantities: [{ colorId: 'C05', quantity: 3000 }], poDate: '2024-06-20', deliveryDate: '2024-08-20', creationDate: '2024-06-21' },
];

const STAFF = [
    { id: 'U100', name: 'Admin User', email: 'admin@sewtrak.com', password: 'password', role: 'Admin', lineAssignments: ['all'] },
    { id: 'U101', name: 'Super Visor', email: 'supervisor@sewtrak.com', password: 'password', role: 'Supervisor', lineAssignments: ['L01', 'L02'] },
    { id: 'U201', name: 'QA Controller', email: 'qc@sewtrak.com', password: 'password', role: 'Quality Controller', lineAssignments: ['L01', 'L02', 'L03', 'L04'] },
    { id: 'U301', name: 'Indy Engineer', email: 'ie@sewtrak.com', password: 'password', role: 'Industrial Engineer', lineAssignments: ['L03'] },
    { id: 'U401', name: 'Prod Manager', email: 'pm@sewtrak.com', password: 'password', role: 'Production Manager', lineAssignments: ['all'] },
    { id: 'U402', name: 'Merch Andiser', email: 'merch@sewtrak.com', password: 'password', role: 'Merchandiser', lineAssignments: ['all'] },
];

const firstNames = ['John', 'Jane', 'Peter', 'Mary', 'David', 'Susan', 'Michael', 'Linda', 'James', 'Patricia'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

const generateEmployees = () => {
  const employeeList = [];
  const grades = ['OG-A', 'OG-B', 'OG-C', 'OG-D'];
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];

  for (let line = 1; line <= 4; line++) {
    for (let i = 0; i < 20; i++) {
        const id = `E${line}${String(i).padStart(2, '0')}`;
        const designation = i < 15 ? 'Stitching Operator' : i < 18 ? 'Checker' : 'Helper';
        const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        const gender = Math.random() > 0.4 ? 'Female' : 'Male';
        
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

const EMPLOYEES = generateEmployees();

const DOWNTIME_REASONS = [
  { id: 'DR01', name: 'Machine malfunction' },
  { id: 'DR02', name: 'Material shortage' },
  { id: 'DR03', name: 'Operator break' },
  { id: 'DR04', name: 'Quality check failure' },
  { id: 'DR05', name: 'Power outage' },
];

const DEFECTS = [
    { id: 'DEF01', name: 'Broken Stitch' },
    { id: 'DEF02', name: 'Skip Stitch' },
    { id: 'DEF03', name: 'Open Seam' },
    { id: 'DEF04', name: 'Fabric Defect' },
    { id: 'DEF05', name: 'Measurement Out of Tolerance' },
];

const CORRECTIVE_ACTIONS = [
    { id: 'CA01', name: 'Retrain Operator' },
    { id: 'CA02', name: 'Adjust Machine Settings' },
    { id: 'CA03', name: 'Provide Better Lighting' },
    { id: 'CA04', name: 'Change Needle' },
];

const CUSTOMERS = [...new Set(ORDERS.map(o => o.customer))].map((name, index) => ({
  id: `CUST${101 + index}`,
  name,
}));

const ALL_PAGES = [
    'home', 'dashboard', 'lineDashboard', 'dailyReport', 'timeStudy', 'production', 'orders', 'kanban', 
    'kanbanSettings', 'lineAllocation', 'lines', 'employeeMaster', 'staffManagement', 
    'userRights', 'reasons', 'styles', 'colors', 'customers', 'operatorGrades', 
    'machines', 'operations', 'adminPanel'
];

const INITIAL_PERMISSIONS = {
    Admin: [...ALL_PAGES.filter(p => p !== 'login')],
    Supervisor: ['home', 'lineDashboard', 'production', 'lineAllocation'],
    'Quality Controller': ['home', 'kanban'],
    'Industrial Engineer': ['home', 'timeStudy', 'styles', 'lines', 'reasons', 'colors', 'operatorGrades', 'machines', 'operations'],
    'Production Manager': ['home', 'dashboard', 'lineDashboard', 'dailyReport', 'orders', 'styles', 'employeeMaster'],
    Merchandiser: ['home', 'orders', 'styles', 'colors', 'customers'],
    Operator: ['home'],
};

const GRADE_PERFORMANCE_SETTINGS = [
    { gradeId: 'OG-A++', minEfficiency: 110, maxEfficiency: 9999 },
    { gradeId: 'OG-A+', minEfficiency: 100, maxEfficiency: 109 },
    { gradeId: 'OG-A', minEfficiency: 85, maxEfficiency: 99 },
    { gradeId: 'OG-B', minEfficiency: 70, maxEfficiency: 84 },
    { gradeId: 'OG-C', minEfficiency: 60, maxEfficiency: 69 },
    { gradeId: 'OG-D', minEfficiency: 0, maxEfficiency: 59 },
];

module.exports = {
    LINES,
    COLORS,
    OPERATOR_GRADES,
    MACHINES,
    OPERATIONS,
    STYLES,
    ORDERS,
    STAFF,
    EMPLOYEES,
    DOWNTIME_REASONS,
    CUSTOMERS,
    DEFECTS,
    CORRECTIVE_ACTIONS,
    ALL_PAGES,
    INITIAL_PERMISSIONS,
    GRADE_PERFORMANCE_SETTINGS,
};