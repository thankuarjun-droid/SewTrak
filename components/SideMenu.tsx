import React from 'react';
import type { Staff, Page, UserRole } from '../types';
import { 
    SewTrakLogo, HomeIcon, ChartBarIcon, UsersIcon, TagIcon, WrenchIcon, CogIcon, 
    ArrowLeftOnRectangleIcon, MenuIcon, XIcon, ClipboardListIcon, TruckIcon,
    DocumentTextIcon, ClipboardCheckIcon, CalendarDaysIcon, ChartPieIcon,
    ShieldCheckIcon, BoltIcon, UsersGroupIcon, TrophyIcon, BuildingOfficeIcon,
    PaletteIcon, StarIcon, ExclamationTriangleIcon, ClipboardIcon, ClockIcon,
    SparkleIcon, AdjustmentsHorizontalIcon, DocumentCheckIcon, UserIcon
} from './IconComponents';

interface NavLink {
    page: Page;
    label: string;
    icon: React.ComponentType<any>;
}

interface NavGroup {
    group: string;
    links: NavLink[];
}

const NAV_STRUCTURE: NavGroup[] = [
    { group: 'Dashboards', links: [
        { page: 'dashboard', label: 'Factory', icon: ChartBarIcon },
        { page: 'lineDashboard', label: 'Line', icon: ChartBarIcon },
        { page: 'planningDashboard', label: 'Planning', icon: CalendarDaysIcon },
        { page: 'qualityDashboard', label: 'Quality', icon: ShieldCheckIcon },
        { page: 'gamificationDashboard', label: 'Gamification', icon: TrophyIcon },
    ]},
    { group: 'TRANSACTIONS', links: [
        { page: 'production', label: 'Production Entry', icon: WrenchIcon },
        { page: 'attendance', label: 'Attendance', icon: ClipboardCheckIcon },
        { page: 'kanbanManagement', label: 'KANBAN', icon: ClipboardListIcon },
        { page: 'lineAllocation', label: 'Line Allocation', icon: UsersGroupIcon },
        { page: 'productionHistory', label: 'Production History', icon: DocumentTextIcon },
    ]},
    { group: 'PLANNING', links: [
        { page: 'linePlanning', label: 'Line Planning', icon: CalendarDaysIcon },
    ]},
    { group: 'QUALITY CONTROL', links: [
        { page: 'inLineAudit', label: 'In-Line Audit', icon: ClipboardCheckIcon },
        { page: 'endLineInspection', label: 'End-Line Inspection', icon: DocumentCheckIcon },
        { page: 'aqlInspection', label: 'AQL Inspection', icon: ShieldCheckIcon },
        { page: 'ncRegister', label: 'NC Register', icon: ExclamationTriangleIcon },
    ]},
    { group: 'Analysis & Reports', links: [
        { page: 'dailyReport', label: 'Daily Report', icon: DocumentTextIcon },
        { page: 'performanceAnalysis', label: 'Operator Analysis', icon: ChartBarIcon },
        { page: 'skillMatrix', label: 'Skill Matrix', icon: ChartPieIcon },
        { page: 'orderClosingReport', label: 'Order Closing', icon: DocumentCheckIcon },
    ]},
    { group: 'Performance', links: [
        { page: 'myPerformance', label: 'My Performance', icon: UserIcon },
        { page: 'teamPerformance', label: 'Team Performance', icon: UsersIcon },
        { page: 'reviewSummary', label: 'Review Summary', icon: ClipboardListIcon },
        { page: 'performanceReport', label: 'Performance Report', icon: DocumentTextIcon },
    ]},
    { group: 'Growth', links: [
        { page: 'growth', label: 'Growth Hub (OKRs)', icon: ClipboardCheckIcon },
    ]},
    { group: 'Master Data', links: [
        { page: 'orders', label: 'Orders', icon: DocumentTextIcon },
        { page: 'styles', label: 'Styles', icon: TagIcon },
        { page: 'employees', label: 'Employees', icon: UsersIcon },
        { page: 'staff', label: 'Staff / Users', icon: UsersGroupIcon },
        { page: 'operations', label: 'Operations', icon: WrenchIcon },
        { page: 'machines', label: 'Machines', icon: CogIcon },
        { page: 'lines', label: 'Lines', icon: BuildingOfficeIcon },
        { page: 'colors', label: 'Colors', icon: PaletteIcon },
        { page: 'operatorGrades', label: 'Operator Grades', icon: StarIcon },
        { page: 'customers', label: 'Customers', icon: UsersIcon },
        { page: 'defects', label: 'Defects', icon: ExclamationTriangleIcon },
        { page: 'correctiveActions', label: 'Corrective Actions', icon: ClipboardCheckIcon },
        { page: 'reasons', label: 'Downtime Reasons', icon: ClipboardIcon },
    ]},
    { group: 'Industrial Engineering', links: [
        { page: 'timeStudy', label: 'Time Study', icon: ClockIcon },
        { page: 'aiInsights', label: 'AI Insights', icon: SparkleIcon },
    ]},
    { group: 'IoT', links: [
        { page: 'iotControlPanel', label: 'Control Panel', icon: BoltIcon },
        { page: 'iotDevices', label: 'Manage Devices', icon: CogIcon },
    ]},
    { group: 'Settings', links: [
        { page: 'factorySettings', label: 'Factory Details', icon: BuildingOfficeIcon },
        { page: 'kanbanSettings', label: 'KANBAN Rules', icon: ClipboardListIcon },
        { page: 'outputSettings', label: 'Output Rules', icon: WrenchIcon },
        { page: 'allowanceSettings', label: 'Allowances', icon: ClockIcon },
        { page: 'gradeSettings', label: 'Grade Performance', icon: StarIcon },
        { page: 'kpiSettings', label: 'KPI Targets', icon: ChartBarIcon },
        { page: 'leaderboardSettings', label: 'Gamification', icon: TrophyIcon },
        { page: 'fieldConfiguration', label: 'Field Configuration', icon: AdjustmentsHorizontalIcon },
        { page: 'userRights', label: 'User Rights', icon: ShieldCheckIcon },
    ]}
];


interface SideMenuProps {
    currentUser: Staff;
    currentPage: Page;
    onNavigate: (page: Page) => void;
    onLogout: () => void;
    permissions: Record<UserRole, Page[]>;
    isMenuOpen: boolean;
    setIsMenuOpen: (isOpen: boolean) => void;
}

export const SideMenu = ({ currentUser, currentPage, onNavigate, onLogout, permissions, isMenuOpen, setIsMenuOpen }: SideMenuProps) => {

    const userPermissions = new Set(permissions[currentUser.role] || []);

    const accessibleNav = NAV_STRUCTURE.map(group => ({
        ...group,
        links: group.links.filter(link => userPermissions.has(link.page)),
    })).filter(group => group.links.length > 0);

    const navContent = (
         <div className="flex flex-col h-full">
            <div className="p-4 flex-shrink-0">
                <SewTrakLogo className="h-12 text-slate-800 dark:text-slate-100" />
            </div>
            <nav className="flex-1 overflow-y-auto px-4 space-y-4">
                <button
                    onClick={() => onNavigate('home')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${currentPage === 'home' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                    <HomeIcon className="w-5 h-5" /> Home
                </button>
                {accessibleNav.map(group => (
                    <div key={group.group}>
                        <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{group.group}</h3>
                        <div className="mt-2 space-y-1">
                            {group.links.map(link => (
                                <button
                                    key={link.page}
                                    onClick={() => onNavigate(link.page)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${currentPage === link.page ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                >
                                    <link.icon className="w-5 h-5" /> {link.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
            <div className="p-4 flex-shrink-0 border-t dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-600">{currentUser.name.charAt(0)}</div>
                    <div>
                        <p className="font-semibold text-sm">{currentUser.name}</p>
                        <p className="text-xs text-slate-500">{currentUser.role}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 mt-4 text-sm font-medium rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Logout
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Overlay for mobile */}
            {isMenuOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setIsMenuOpen(false)}></div>}

            <aside className={`fixed lg:relative flex-shrink-0 h-full z-40 w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 flex flex-col transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:-ml-64'}`}>
                {navContent}
            </aside>
        </>
    );
};