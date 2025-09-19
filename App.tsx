import React, { useState, useEffect, useCallback } from 'react';
import type { AllData, Page, Staff, UserRole, Order, DailyAttendance, MasterDataItem, Operation, KpiSetting, InLineAudit, EndLineCheck, AqlInspection, NonConformanceReport, NonConformanceReport as NCReport, StaffPerformanceRecord, Objective, KeyResult, GamificationSettings, LevelDefinition, KanbanEntry, LineAllocation, DailyLinePlan, Notification, TeamMessage, TeamMessageReply, FactorySettings, KanbanSettings, OutputSettings, AllowanceSettings, Machine, GradePerformanceSetting } from './types';
import { SideMenu } from './components/SideMenu';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
// ... import all page components
import * as api from './services/api';
import MasterDataManagementPage from './pages/MasterDataManagementPage';
import StylesPage from './pages/StylesPage';
import OrdersPage from './pages/OrdersPage';
import EmployeesPage from './pages/EmployeesPage';
import StaffMasterPage from './pages/StaffMasterPage';
import LineAllocationPage from './pages/LineAllocationPage';
import ProductionEntryPage from './pages/ProductionEntryPage';
import ProductionHistoryPage from './pages/ProductionHistoryPage';
import LineDashboardPage from './pages/LineDashboardPage';
import AiInsightsPage from './pages/AiInsightsPage';
import KanbanManagementPage from './pages/KanbanManagementPage';
import TimeStudyPage from './pages/TimeStudyPage';
import OperationsPage from './pages/OperationsPage';
import DailyReportPage from './pages/DailyReportPage';
import PerformanceAnalysisPage from './pages/PerformanceAnalysisPage';
import SkillMatrixPage from './pages/SkillMatrixPage';
import PlanningDashboardPage from './pages/PlanningDashboardPage';
import QualityDashboardPage from './pages/QualityDashboardPage';
import LinePlanningPage from './pages/LinePlanningPage';
import InLineAuditPage from './pages/InLineAuditPage';
import EndLineInspectionPage from './pages/EndLineInspectionPage';
import AqlInspectionPage from './pages/AqlInspectionPage';
import NCRegisterPage from './pages/NCRegisterPage';
import OrderClosingReportPage from './pages/OrderClosingReportPage';
import MyPerformancePage from './pages/MyPerformancePage';
import TeamPerformancePage from './pages/TeamPerformancePage';
import PerformanceReportPage from './pages/PerformanceReportPage';
import ReviewSummaryPage from './pages/ReviewSummaryPage';
import OperatorMonthlyReviewPage from './pages/OperatorMonthlyReviewPage';
import GamificationDashboardPage from './pages/GamificationDashboardPage';
import CertificateTemplatePage from './pages/CertificateTemplatePage';
import IoTControlPanelPage from './pages/IoTControlPanelPage';
import IoTDevicesPage from './pages/IoTDevicesPage';
import FactorySettingsPage from './pages/FactorySettingsPage';
import AttendanceAllocationPage from './pages/AttendanceAllocationPage';
import GrowthAndPerformancePage from './pages/GrowthAndPerformancePage';
import { ALL_PAGES } from './constants';
import { MenuIcon } from './components/IconComponents';

// Import restored settings pages
import KanbanSettingsPage from './pages/KanbanSettingsPage';
import UserRightsPage from './pages/UserRightsPage';
import AllowanceSettingsPage from './pages/AllowanceSettingsPage';
import OutputSettingsPage from './pages/OutputSettingsPage';
import GradeSettingsPage from './pages/GradeSettingsPage';
import KpiSettingsPage from './pages/KpiSettingsPage';
import LeaderboardSettingsPage from './pages/LeaderboardSettingsPage';
import FieldConfigurationPage from './pages/FieldConfigurationPage';


export const App = () => {
    const [allData, setAllData] = useState<AllData | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(true);

    const init = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getInitialData();
            const loggedInUser = sessionStorage.getItem('currentUser');
            if (loggedInUser) {
                data.currentUser = JSON.parse(loggedInUser);
            }
            setAllData(data);
        } catch (error) {
            console.error("Failed to load initial data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        init();
        const path = window.location.pathname.replace('/', '');
        if (path && ALL_PAGES.includes(path as Page)) {
            setCurrentPage(path as Page);
        }
    }, [init]);

    const handleLogin = async (email: string, password: string): Promise<boolean> => {
        try {
            const user = await api.login(email, password);
            if (user && allData) {
                const updatedData = { ...allData, currentUser: user };
                setAllData(updatedData);
                sessionStorage.setItem('currentUser', JSON.stringify(user));
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('currentUser');
        setAllData(prev => prev ? { ...prev, currentUser: null as any } : null);
        setCurrentPage('home');
    };

    const handleNavigate = (page: Page) => {
        setCurrentPage(page);
        if (window.innerWidth < 1024) {
            setIsMenuOpen(false);
        }
    };
    
    // Generic handlers for simple master data pages
    const handleAddMasterDataItem = (type: string) => async (name: string): Promise<MasterDataItem | null> => {
        try {
            const newItem = await api.addMasterDataItem(type, name);
            if (allData) {
                const storeKey = type === 'reasons' ? 'downtimeReasons' : type;
                const newStore = [...(allData as any)[storeKey], newItem];
                setAllData({ ...allData, [storeKey]: newStore });
            }
            return newItem;
        } catch (error: any) {
            alert(error.message);
            return null;
        }
    };

    const handleDeleteMasterDataItem = (type: string) => async (id: string) => {
        if (window.confirm('Are you sure you want to delete this item? This might affect existing records.')) {
            try {
                await api.deleteMasterDataItem(type, id);
                if (allData) {
                    const storeKey = type === 'reasons' ? 'downtimeReasons' : type;
                    const newStore = (allData as any)[storeKey].filter((i: any) => i.id !== id);
                    setAllData({ ...allData, [storeKey]: newStore });
                }
            } catch (error: any) {
                alert(error.message);
            }
        }
    };
    
    const handleAddOperationFromModal = async (name: string): Promise<Operation | null> => {
        try {
            const newItem = await api.addOperation(name);
             if (allData) {
                setAllData({ ...allData, operations: [...allData.operations, newItem] });
            }
            return newItem;
        } catch (error: any) {
            alert(error.message);
            return null;
        }
    };
    
    const handleSavePerformanceRecord = async (record: StaffPerformanceRecord) => {
        const savedRecord = await api.savePerformanceRecord(record);
        if (allData) {
            const existingIndex = allData.staffPerformanceRecords.findIndex(r => r.id === savedRecord.id);
            const newRecords = [...allData.staffPerformanceRecords];
            if (existingIndex > -1) {
                newRecords[existingIndex] = savedRecord;
            } else {
                newRecords.push(savedRecord);
            }
            setAllData({ ...allData, staffPerformanceRecords: newRecords });
        }
    };

    const handleSaveObjective = async (objective: Objective) => {
        const savedObjective = await api.saveObjective(objective);
        if (allData) {
            const existingIndex = allData.objectives.findIndex(o => o.id === savedObjective.id);
            const newObjectives = [...allData.objectives];
            if (existingIndex > -1) {
                newObjectives[existingIndex] = savedObjective;
            } else {
                newObjectives.push(savedObjective);
            }
            setAllData({ ...allData, objectives: newObjectives });
        }
    };

    const handleUpdateKeyResult = async (keyResult: KeyResult) => {
        const updatedObjective = await api.updateKeyResult(keyResult);
        if (allData) {
            const newObjectives = allData.objectives.map(o => o.id === updatedObjective.id ? updatedObjective : o);
            setAllData({ ...allData, objectives: newObjectives });
        }
    };

    const handleSaveAllocation = async (allocation: LineAllocation) => {
        const { savedAllocation, newLogEntry } = await api.saveLineAllocation(allocation);
        if (allData) {
            const existingIndex = allData.lineAllocations.findIndex(a => a.id === savedAllocation.id);
            const newLineAllocations = [...allData.lineAllocations];
            if (existingIndex > -1) {
                newLineAllocations[existingIndex] = savedAllocation;
            } else {
                newLineAllocations.push(savedAllocation);
            }
            setAllData({ 
                ...allData, 
                lineAllocations: newLineAllocations,
                allocationLog: [newLogEntry, ...allData.allocationLog] 
            });
        }
        return savedAllocation;
    };

    const handleAddKanbanEntry = async (entry: KanbanEntry) => {
        const newEntry = await api.saveKanbanEntry(entry);
        if (allData) {
            setAllData({ ...allData, kanbanEntries: [...allData.kanbanEntries, newEntry] });
        }
    };
    
    const handleSaveDailyLinePlans = async (plans: DailyLinePlan[]) => {
        const savedPlans = await api.saveDailyLinePlans(plans);
        if (allData) {
            const planMap = new Map(allData.dailyLinePlans.map(p => [p.id, p]));
            savedPlans.forEach(savedPlan => {
                planMap.set(savedPlan.id, savedPlan);
            });
            setAllData({ ...allData, dailyLinePlans: Array.from(planMap.values()) });
        }
    };

    const handleDeleteDailyLinePlan = async (planId: string) => {
        if (!planId) return;
        await api.deleteDailyLinePlan(planId);
        if (allData) {
            setAllData({
                ...allData,
                dailyLinePlans: allData.dailyLinePlans.filter(p => p.id !== planId)
            });
        }
    };

    const handleMarkRead = async (id: string) => {
        const updatedNotification = await api.markNotificationRead(id);
        if(allData) {
            setAllData({...allData, notifications: allData.notifications.map(n => n.id === id ? updatedNotification : n)});
        }
    };
    
    const handleSendMessage = async (msg: Omit<TeamMessage, 'id' | 'timestamp' | 'replies'>) => {
        const newMessage = await api.sendMessage(msg);
        if(allData) {
            setAllData({...allData, teamMessages: [...allData.teamMessages, newMessage]});
        }
    };
    
    const handleReply = async (msgId: string, reply: Omit<TeamMessageReply, 'id'| 'timestamp'>) => {
        const updatedMessage = await api.replyToMessage(msgId, reply);
        if(allData) {
            setAllData({...allData, teamMessages: allData.teamMessages.map(m => m.id === msgId ? updatedMessage : m)});
        }
    };

    // --- Restored Individual Settings Handlers ---
    const handleSaveFactorySettings = async (settings: FactorySettings) => {
        const saved = await api.saveFactorySettings(settings);
        if(allData) setAllData({...allData, factorySettings: saved});
    };
    const handleSaveKanbanSettings = async (settings: KanbanSettings) => {
        const saved = await api.saveKanbanSettings(settings);
        if(allData) setAllData({...allData, kanbanSettings: saved});
    };
    const handleSaveOutputSettings = async (settings: OutputSettings) => {
        const saved = await api.saveOutputSettings(settings);
        if(allData) setAllData({...allData, outputSettings: saved});
    };
    const handleSaveAllowanceSettings = async (settings: AllowanceSettings) => {
        const saved = await api.saveAllowanceSettings(settings);
        if(allData) setAllData({...allData, allowanceSettings: saved});
    };
    const handleSaveMachines = async (machines: Machine[]) => {
        const saved = await api.saveMachines(machines);
        if(allData) setAllData({...allData, machines: saved});
    };
    const handleSaveGradeSettings = async (settings: GradePerformanceSetting[]) => {
        const saved = await api.saveGradePerformanceSettings(settings);
        if(allData) setAllData({...allData, gradePerformanceSettings: saved});
    };
    const handleSaveKpiSettings = async (settings: KpiSetting[]) => {
        const saved = await api.saveKpiSettings(settings);
        if(allData) setAllData({...allData, kpiSettings: saved});
    };
    const handleSaveGamificationSettings = async (gamification: GamificationSettings, levels: LevelDefinition[]) => {
        const saved = await api.saveGamificationSettings({gamification, levels});
        if(allData) setAllData({...allData, gamificationSettings: saved.gamification, levelDefinitions: saved.levels });
    };
    const handleSavePermissions = async (permissions: Record<UserRole, Page[]>) => {
        const saved = await api.savePermissions(permissions);
        if(allData) setAllData({...allData, permissions: saved});
    };


    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!allData || !allData.currentUser) {
        return <LoginPage onLogin={handleLogin} staffList={allData?.staff || []} />;
    }
    
    const pages: Record<Page, React.ComponentType<any>> = {
        home: HomePage,
        dashboard: DashboardPage,
        lineDashboard: LineDashboardPage,
        planningDashboard: PlanningDashboardPage,
        qualityDashboard: QualityDashboardPage,
        production: ProductionEntryPage,
        productionHistory: ProductionHistoryPage,
        attendance: AttendanceAllocationPage,
        kanbanEntry: LineAllocationPage,
        kanbanManagement: KanbanManagementPage,
        lineAllocation: LineAllocationPage,
        linePlanning: LinePlanningPage,
        orders: OrdersPage,
        styles: StylesPage,
        employees: EmployeesPage,
        staff: StaffMasterPage,
        lines: () => <MasterDataManagementPage title="Lines" items={allData.lines} onAddItem={handleAddMasterDataItem('lines')} onDeleteItem={handleDeleteMasterDataItem('lines')} />,
        colors: () => <MasterDataManagementPage title="Colors" items={allData.colors} onAddItem={handleAddMasterDataItem('colors')} onDeleteItem={handleDeleteMasterDataItem('colors')} />,
        reasons: () => <MasterDataManagementPage title="Downtime Reasons" items={allData.downtimeReasons} onAddItem={handleAddMasterDataItem('reasons')} onDeleteItem={handleDeleteMasterDataItem('reasons')} />,
        operations: OperationsPage,
        machines: () => <MasterDataManagementPage title="Machines" items={allData.machines} onAddItem={handleAddMasterDataItem('machines')} onDeleteItem={handleDeleteMasterDataItem('machines')} note="Machine allowance is set in Allowance Settings." />,
        operatorGrades: () => <MasterDataManagementPage title="Operator Grades" items={allData.operatorGrades} onAddItem={handleAddMasterDataItem('operatorGrades')} onDeleteItem={handleDeleteMasterDataItem('operatorGrades')} />,
        customers: () => <MasterDataManagementPage title="Customers" items={allData.customers} onAddItem={handleAddMasterDataItem('customers')} onDeleteItem={handleDeleteMasterDataItem('customers')} />,
        defects: () => <MasterDataManagementPage title="Defects" items={allData.defects} onAddItem={handleAddMasterDataItem('defects')} onDeleteItem={handleDeleteMasterDataItem('defects')} />,
        correctiveActions: () => <MasterDataManagementPage title="Corrective Actions" items={allData.correctiveActions} onAddItem={handleAddMasterDataItem('correctiveActions')} onDeleteItem={handleDeleteMasterDataItem('correctiveActions')} />,
        timeStudy: TimeStudyPage,
        skillMatrix: SkillMatrixPage,
        dailyReport: DailyReportPage,
        performanceAnalysis: PerformanceAnalysisPage,
        orderClosingReport: OrderClosingReportPage,
        aiInsights: AiInsightsPage,
        iotControlPanel: IoTControlPanelPage,
        iotDevices: IoTDevicesPage,
        myPerformance: MyPerformancePage,
        teamPerformance: TeamPerformancePage,
        performanceReport: PerformanceReportPage,
        reviewSummary: ReviewSummaryPage,
        admin: StaffMasterPage,
        inLineAudit: InLineAuditPage,
        endLineInspection: EndLineInspectionPage,
        aqlInspection: AqlInspectionPage,
        ncRegister: NCRegisterPage,
        growth: GrowthAndPerformancePage,
        certificateTemplate: CertificateTemplatePage,
        gamificationDashboard: GamificationDashboardPage,
        // Individual Settings Pages
        settings: FactorySettingsPage, // Keep a default settings link
        factorySettings: FactorySettingsPage,
        kanbanSettings: KanbanSettingsPage,
        userRights: UserRightsPage,
        outputSettings: OutputSettingsPage,
        allowanceSettings: AllowanceSettingsPage,
        gradeSettings: GradeSettingsPage,
        kpiSettings: KpiSettingsPage,
        leaderboardSettings: LeaderboardSettingsPage,
        fieldConfiguration: FieldConfigurationPage,
    };

    const CurrentPageComponent = pages[currentPage] || HomePage;
    
    const pageProps = {
        allData,
        ...allData,
        onNavigate: handleNavigate,
        onAddOrder: async (order: any) => { 
            const newOrder = await api.createOrder(order);
            if(allData) setAllData({...allData, orders: [...allData.orders, newOrder]});
        },
        onUpdateOrder: async (order: any) => { 
            const updatedOrder = await api.updateOrder(order);
            if(allData) setAllData({...allData, orders: allData.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)});
        },
        onDeleteOrder: async (id: string) => { 
            await api.deleteOrder(id); 
            if(allData) setAllData({...allData, orders: allData.orders.filter(o => o.id !== id)});
        },
        onAddCustomer: handleAddMasterDataItem('customers'),
        onDeleteProductionEntry: async (entryId: string) => { 
            const { kanbanEntries } = await api.deleteProductionEntry(entryId); 
            if(allData) {
                setAllData({
                    ...allData, 
                    productionEntries: allData.productionEntries.filter(p => p.id !== entryId),
                    kanbanEntries: kanbanEntries,
                });
            }
        },
        onAddStyle: async (style: any) => {
            const newStyle = await api.saveStyle(style);
            if(allData) setAllData({...allData, styles: [...allData.styles, newStyle]});
        },
        onUpdateStyle: async (style: any) => {
            const updatedStyle = await api.saveStyle(style);
            if(allData) setAllData({...allData, styles: allData.styles.map(s => s.id === updatedStyle.id ? updatedStyle : s)});
        },
        onDeleteStyle: async (id: string) => {
            await api.deleteStyle(id);
            if(allData) setAllData({...allData, styles: allData.styles.filter(s => s.id !== id)});
        },
        onAddEmployee: async (employee: any) => {
            const newEmployee = await api.saveEmployee(employee);
            if(allData) setAllData({...allData, employees: [...allData.employees, newEmployee]});
        },
        onUpdateEmployee: async (employee: any) => {
            const updatedEmployee = await api.saveEmployee(employee);
            if(allData) setAllData({...allData, employees: allData.employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e)});
        },
        onDeleteEmployee: async (id: string) => {
            await api.deleteEmployee(id);
            if(allData) setAllData({...allData, employees: allData.employees.filter(e => e.id !== id)});
        },
        onAddColor: handleAddMasterDataItem('colors'),
        onAddOperatorGrade: handleAddMasterDataItem('operatorGrades'),
        onAddMachine: handleAddMasterDataItem('machines'),
        onAddOperationFromModal: handleAddOperationFromModal,
        onSaveAttendance: async (attendance: DailyAttendance) => {
            const updatedAttendance = await api.saveAttendance(attendance);
            if(allData) {
                const existingIndex = allData.dailyAttendances.findIndex(a => a.date === updatedAttendance.date);
                const newAttendances = [...allData.dailyAttendances];
                if (existingIndex > -1) newAttendances[existingIndex] = updatedAttendance;
                else newAttendances.push(updatedAttendance);
                setAllData({...allData, dailyAttendances: newAttendances});
            }
        },
        onAddStaff: async (staff: any) => {
            const newStaff = await api.saveStaff(staff);
            if(allData) setAllData({...allData, staff: [...allData.staff, newStaff]});
        },
        onUpdateStaff: async (staff: any) => {
            const updatedStaff = await api.saveStaff(staff);
            if(allData) setAllData({...allData, staff: allData.staff.map(s => s.id === updatedStaff.id ? updatedStaff : s)});
        },
        onDeleteStaff: async (id: string) => {
            await api.deleteStaff(id);
            if(allData) setAllData({...allData, staff: allData.staff.filter(s => s.id !== id)});
        },
        onAddOperation: async (op: any) => {
            const newOp = await api.saveOperation(op);
            if(allData) setAllData({...allData, operations: [...allData.operations, newOp]});
        },
        onUpdateOperation: async (op: any) => {
            const updatedOp = await api.saveOperation(op);
            if(allData) setAllData({...allData, operations: allData.operations.map(o => o.id === updatedOp.id ? updatedOp : o)});
        },
        onDeleteOperation: async (id: string) => {
            await api.deleteOperation(id);
            if(allData) setAllData({...allData, operations: allData.operations.filter(o => o.id !== id)});
        },
        onSaveAudit: async (audit: InLineAudit) => {
            const newAudit = await api.saveInLineAudit(audit);
            if(allData) setAllData({...allData, inLineAudits: [...allData.inLineAudits, newAudit]});
        },
        onSaveCheck: async (check: EndLineCheck) => {
            const { savedCheck } = await api.saveEndLineCheck(check);
            if(allData) setAllData({...allData, endLineChecks: [...allData.endLineChecks, savedCheck]});
        },
        onUpdateCheck: async (check: EndLineCheck) => {
            const { savedCheck } = await api.updateEndLineCheck(check);
            if(allData) setAllData({...allData, endLineChecks: allData.endLineChecks.map(c => c.id === savedCheck.id ? savedCheck : c)});
        },
        onSaveAql: async (aql: AqlInspection) => {
            const { savedAql, newNcReport } = await api.saveAqlInspection(aql);
            if(allData) {
                const updatedData = {...allData, aqlInspections: [...allData.aqlInspections, savedAql]};
                if (newNcReport) {
                    updatedData.nonConformanceReports = [...updatedData.nonConformanceReports, newNcReport];
                }
                setAllData(updatedData);
            }
        },
        onSaveNcReport: async (nc: NCReport) => {
            const savedNc = await api.saveNcReport(nc);
            if(allData) {
                const existing = allData.nonConformanceReports.find(r => r.id === savedNc.id);
                if (existing) {
                    setAllData({...allData, nonConformanceReports: allData.nonConformanceReports.map(r => r.id === savedNc.id ? savedNc : r)});
                } else {
                    setAllData({...allData, nonConformanceReports: [...allData.nonConformanceReports, savedNc]});
                }
            }
        },
        onSaveRecord: handleSavePerformanceRecord,
        onSaveObjective: handleSaveObjective,
        onUpdateKeyResult: handleUpdateKeyResult,
        onSaveAllocation: handleSaveAllocation,
        onAddKanbanEntry: handleAddKanbanEntry,
        onSavePlans: handleSaveDailyLinePlans,
        onDeletePlan: handleDeleteDailyLinePlan,
        onMarkRead: handleMarkRead,
        onSendMessage: handleSendMessage,
        onReply: handleReply,
        
        // Settings page props
        settings: allData,
        onSave: () => {}, // Placeholder, specific handlers used below
        onSaveFactorySettings: handleSaveFactorySettings,
        onSaveKanbanSettings: handleSaveKanbanSettings,
        onUpdatePermissions: handleSavePermissions,
        onSaveOutputSettings: handleSaveOutputSettings,
        onSaveAllowanceSettings: handleSaveAllowanceSettings,
        onSaveMachines: handleSaveMachines,
        onSaveGradeSettings: handleSaveGradeSettings,
        onSaveKpiSettings: handleSaveKpiSettings,
        onSaveGamificationSettings: handleSaveGamificationSettings,
    };

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <SideMenu 
                currentUser={allData.currentUser}
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                permissions={allData.permissions}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
            />
            <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="p-4 border-b dark:border-slate-700">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <MenuIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <CurrentPageComponent {...pageProps} />
                </div>
            </div>
        </div>
    );
};