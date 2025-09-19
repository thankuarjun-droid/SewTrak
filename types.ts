import type { ReactNode } from 'react';

export type MasterDataItem = {
  id: string;
  name: string;
};

export type Line = MasterDataItem & { color: string };
export type Defect = MasterDataItem;
export type CorrectiveAction = MasterDataItem;
export type Customer = MasterDataItem;
export type OperatorGrade = MasterDataItem;

export type OrderColorQuantity = {
  colorId: string;
  quantity: number;
};

export type Order = {
  id: string;
  name: string;
  customer: string;
  styleId: string;
  quantities: OrderColorQuantity[];
  deliveryDate: string;
  poDate: string;
  creationDate: string;
  customData?: Record<string, any>;
};

export type ObStatus = 'Draft' | 'Pending Approval' | 'Approved';

export type OperationBulletinItem = {
  sNo: number;
  operationId: string;
  operatorGradeId: string;
  machineId: string;
  pickupTime: number;
  sewingTime: number;
  trimAndDisposalTime: number;
  workstation?: number;
  allocatedOperators?: number;
};

export type PreviousOperationBulletin = {
  bulletin: OperationBulletinItem[];
  changeDate: string;
  changedBy: string;
};

export type Style = {
  id: string;
  name: string;
  colorIds: string[];
  operationBulletin: OperationBulletinItem[];
  imageUrl?: string;
  fabric?: string;
  obStatus: ObStatus;
  obApproverId?: string;

  obApprovalDate?: string;
  previousOperationBulletins?: PreviousOperationBulletin[];
  targetDailyOutput?: number;
  targetEfficiency?: number;
  customData?: Record<string, any>;
};

export type Employee = {
  id: string;
  name: string;
  designation: string;
  ctc: number;
  currentLineId: string;
  doj: string;
  operatorGradeId: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  area: string;
  customData?: Record<string, any>;
};

export type ProductionEntry = {
  id: string;
  timestamp: string;
  lineNumber: string;
  orderNumber: string;
  styleNumber: string;
  colorId: string;
  hourCounter: number;
  operation: string;
  employeeId: string;
  productionQuantity: number;
  downTime: number;
  downTimeReason: string;
};

export type LineAllocation = {
  id: string;
  lastUpdated: string;
  lineNumber: string;
  orderNumber: string;
  assignments: { operationId: string, employeeIds: string[] }[];
};

export type KanbanEntry = {
  id: string;
  timestamp: string;
  lineNumber: string;
  orderNumber: string;
  colorId: string;
  quantity: number;
  status: 'active' | 'closed' | 'completed';
  producedOnCard: number;
  dcNumber: string;
  dcDate: string;
};

export type KanbanSettings = {
  maxQuantityPerCard: number;
  maxActiveCardsPerLine: number;
};

export type OutputSettings = {
  source: 'lastOperation' | 'endOfLine';
};

export type EndLineCheck = {
  id: string;
  timestamp: string;
  lineNumber: string;
  orderNumber: string;
  styleNumber: string;
  checkerId: string;
  kanbanCardId: string;
  status: 'Pass' | 'Rework' | 'Reject';
  defectToken?: string;
  defectId?: string;
  responsibleOpId?: string;
  responsibleEmpId?: string;
  reworkStatus?: 'pending' | 'completed';
};

export type KpiSetting = {
  id: string;
  kpi: string;
  category: string;
  definition: string;
  unit: string;
  frequency: string;
  direction: 'Up' | 'Down' | 'Neutral';
  targetStart: number;
  targetStretch: number;
};

export type Machine = {
  id: string;
  name: string;
  allowance: number;
};

export type Operation = {
  id: string;
  name: string;
  skillType: 'Basic' | 'Semi Critical' | 'Critical';
};

export type UserRole = 'Admin' | 'Supervisor' | 'Quality Controller' | 'Industrial Engineer' | 'Production Manager' | 'Merchandiser' | 'Operator';

export type Staff = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  lineAssignments: string[];
};

export type CustomFieldDefinition = {
    id: string;
    targetEntity: 'Order' | 'Style' | 'Employee';
    fieldName: string;
    label: string;
    fieldType: 'text' | 'number' | 'date' | 'dropdown';
    options?: string[]; // For dropdown type
};

export type FactorySettings = {
  workingHoursPerDay: number;
  organizationDetails: {
    name: string;
    address: string;
    logoBase64: string;
  };
  planningMode: 'Manual' | 'AI-Assisted';
  iotDeviceMode: boolean;
  customFieldDefinitions: CustomFieldDefinition[];
};

export type DailyAttendance = {
  date: string;
  presentEmployeeIds: string[];
};

export type InLineAudit = {
  id: string;
  timestamp: string;
  lineNumber: string;
  visitNumber: number;
  auditorId: string;
  records: {
    operationId: string;
    employeeId: string;
    defectsFound: number;
    status: 'Green' | 'Yellow' | 'Red';
    defectId?: string;
    correctiveActionId?: string;
  }[];
};

export type AllocationLogEntry = {
  id: string;
  timestamp: string;
  allocationId: string;
  details: string;
};

export type CycleRecord = {
  cycleNumber: number;
  pickupTime: number;
  sewingTime: number;
  trimAndDisposalTime: number;
  totalObservedTime: number;
  basicTime: number;
  standardTime: number;
  selected: boolean;
};

export type TimeStudy = {
  id: string;
  timestamp: string;
  employeeId: string;
  employeeGradeId: string;
  operationId: string;
  styleId: string;
  machineId: string;
  machineName: string;
  cycles: CycleRecord[];
  averageObservedTime: number;
  averageStandardTime: number;
};

export type AllowanceSettings = {
  personalAndFatigue: number;
  bundle: number;
};

export type GradePerformanceSetting = {
  gradeId: string;
  minEfficiency: number;
  maxEfficiency: number;
};

export type DailyLinePlan = {
  id: string;
  date: string;
  lineNumber: string;
  orderNumber: string;
  colorId: string;
  plannedQuantity: number;
  plannedManpower: {
    operators: number;
    helpers: number;
    checkers: number;
  };
};

export type AqlInspection = {
  id: string;
  kanbanCardId: string;
  timestamp: string;
  offeredQty: number;
  sampleSize: number;
  majorDefectsFound: number;
  minorDefectsFound: number;
  result: 'Pass' | 'Fail';
};

export type NonConformanceReport = {
  id: string;
  ncNumber: string;
  date: string;
  source: string;
  sourceId: string;
  details: string;
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  responsibleStaffId: string;
  dueDate: string;
  status: 'Open' | 'Closed';
};

export type Page =
  | 'home'
  | 'dashboard'
  | 'lineDashboard'
  | 'planningDashboard'
  | 'qualityDashboard'
  | 'production'
  | 'productionHistory'
  | 'attendance'
  | 'kanbanEntry'
  | 'kanbanManagement'
  | 'lineAllocation'
  | 'linePlanning'
  | 'orders'
  | 'styles'
  | 'employees'
  | 'staff'
  | 'lines'
  | 'colors'
  | 'reasons'
  | 'operations'
  | 'machines'
  | 'operatorGrades'
  | 'customers'
  | 'defects'
  | 'correctiveActions'
  | 'timeStudy'
  | 'skillMatrix'
  | 'dailyReport'
  | 'performanceAnalysis'
  | 'orderClosingReport'
  | 'aiInsights'
  | 'iotControlPanel'
  | 'settings'
  | 'kanbanSettings'
  | 'allowanceSettings'
  | 'outputSettings'
  | 'gradeSettings'
  | 'kpiSettings'
  | 'gamificationDashboard'
  | 'leaderboardSettings'
  | 'iotDevices'
  | 'myPerformance'
  | 'teamPerformance'
  | 'performanceReport'
  | 'reviewSummary'
  | 'admin'
  | 'userRights'
  | 'factorySettings'
  // Added pages for quality control
  | 'inLineAudit'
  | 'endLineInspection'
  | 'aqlInspection'
  | 'ncRegister'
  // Add new page for growth
  | 'growth'
  // Add page for certificate template
  | 'certificateTemplate'
  // Add new page for custom field configuration
  | 'fieldConfiguration';

export type PerformanceRecordStatus =
  | 'Pending Self-Rating'
  | 'Pending Supervisor Approval'
  | 'Pending Manager Approval'
  | 'Approved'
  | 'Rejected'
  | 'Closed';

export type StaffPerformanceRecord = {
  id: string;
  staffId: string;
  date: string;
  autoMetrics: Record<string, number>;
  manualTasks: { task: string; completed: boolean }[];
  selfRating: number;
  selfComments: string;
  supervisorId?: string;
  supervisorComments?: string;
  supervisorActionDate?: string;
  status: PerformanceRecordStatus;
  lastUpdated: string;
  capa?: {
    reasonForShortfall: string;
    actionPlan: string;
    dueDate: string;
  };
};

export type StaffKpi = {
    id: string;
    role: UserRole;
    kpi: string;
    definition: string;
    source: 'Automatic' | 'Manual';
    unit: string;
    weight: number;
    target: number;
    threshold: number;
    category: string;
    frequency: string;
    direction: 'Up' | 'Down' | 'Neutral';
};

export type GamificationSettings = {
    pointsForAttendance: number;
    pointsPerProductionUnit: number;
    pointsPerEfficiencyPercent: number;
    efficiencyBaseline: number;
    pointsPerRFTPercent: number;
    pointsForMilestone: number;
    pointsForNoDefects: number;
    pointsForHelping: number;
    pointsForTraining: number;
    coinConversionRate: number;
};

export type LevelDefinition = {
    level: number;
    name: string;
    pointsRequired: number;
    avatar: string;
};

export type Notification = {
    id: string;
    userId: string;
    message: string;
    timestamp: string;
    read: boolean;
    link?: { page: Page };
};

export type TeamMessage = {
    id: string;
    senderId: string;
    recipientIds: string[];
    subject: string;
    message: string;
    timestamp: string;
    replies: TeamMessageReply[];
};

export type TeamMessageReply = {
    id: string;
    senderId: string;
    message: string;
    timestamp: string;
};

export type OperatorMonthlyReview = {
    id: string;
    employeeId: string;
    monthYear: string; // "YYYY-MM"
    status: 'Pending Supervisor Approval' | 'Pending Manager Approval' | 'Approved' | 'Rejected';
    selfRating?: number;
    selfComments?: string;
    supervisorId?: string;
    supervisorComments?: string;
    supervisorApprovalDate?: string;
    managerId?: string;
    managerComments?: string;
    managerApprovalDate?: string;
};

export type IoTDevice = {
  id: string;
  name: string;
  assignedLineId: string | null;
  assignedEmployeeId: string | null;
};

export type IoTSignalLog = {
  id: string;
  deviceId: string;
  timestamp: string;
  error?: string;
};

export type KeyResultType = 'NUMBER' | 'PERCENTAGE' | 'CURRENCY';

export type KeyResult = {
    id: string;
    description: string;
    type: KeyResultType;
    startValue: number;
    currentValue: number;
    targetValue: number;
    weight: number; // Percentage
};

export type Objective = {
    id: string;
    cycleId: string;
    ownerId: string;
    title: string;
    description?: string;
    visibility: 'Public' | 'Private';
    keyResults: KeyResult[];
};

export type PerformanceCycle = {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'Active' | 'Closed';
};

export type AllData = {
    currentUser: Staff;
    lines: Line[];
    staff: Staff[];
    employees: Employee[];
    staffPerformanceRecords: StaffPerformanceRecord[];
    staffKpis: StaffKpi[];
    productionEntries: ProductionEntry[];
    inLineAudits: InLineAudit[];
    endLineChecks: EndLineCheck[];
    styles: Style[];
    timeStudies: TimeStudy[];
    orders: Order[];
    dailyLinePlans: DailyLinePlan[];
    nonConformanceReports: NonConformanceReport[];
    dailyAttendances: DailyAttendance[];
    kanbanEntries: KanbanEntry[];
    operations: Operation[];
    operatorGrades: OperatorGrade[];
    machines: Machine[];
    defects: Defect[];
    correctiveActions: CorrectiveAction[];
    colors: MasterDataItem[];
    customers: Customer[];
    downtimeReasons: MasterDataItem[];
    factorySettings: FactorySettings;
    kanbanSettings: KanbanSettings;
    outputSettings: OutputSettings;
    allowanceSettings: AllowanceSettings;
    gradePerformanceSettings: GradePerformanceSetting[];
    levelDefinitions: LevelDefinition[];
    gamificationSettings: GamificationSettings;
    performanceCycles: PerformanceCycle[];
    objectives: Objective[];
    permissions: Record<UserRole, Page[]>;
    kpiSettings: KpiSetting[];
    aqlInspections: AqlInspection[];
    lineAllocations: LineAllocation[];
    allocationLog: AllocationLogEntry[];
    // FIX: Add missing properties iotDevices and iotSignalLogs to the AllData type.
    iotDevices: IoTDevice[];
    iotSignalLogs: IoTSignalLog[];
    notifications: Notification[];
    teamMessages: TeamMessage[];
};

export type PageComponentProps = {
    allData: AllData,
    onNavigate: (page: Page) => void;
};