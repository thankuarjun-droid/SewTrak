import React, { useState } from 'react';
import type { Page, UserRole, AllData } from '../types';
import * as api from '../services/api';
import { ALL_PAGES } from '../constants';

interface UserRightsPageProps {
  allData: AllData;
  onUpdatePermissions: (newPermissions: Record<UserRole, Page[]>) => void;
}

const UserRightsPage = ({ allData, onUpdatePermissions }: UserRightsPageProps) => {
  const [permissions, setPermissions] = useState(allData.permissions);
  const [saveMessage, setSaveMessage] = useState('');

  const handleTogglePermission = (role: UserRole, page: Page) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      const rolePermissions = new Set(newPermissions[role]);
      if (rolePermissions.has(page)) {
        rolePermissions.delete(page);
      } else {
        rolePermissions.add(page);
      }
      newPermissions[role] = Array.from(rolePermissions);
      return newPermissions;
    });
  };

  const handleSave = async () => {
    try {
      // FIX: The function `savePermissions` was missing from the api service. It has been added.
      await api.savePermissions(permissions);
      onUpdatePermissions(permissions);
      setSaveMessage('Permissions saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      alert('Failed to save permissions.');
    }
  };
  
  const pageCategories: Record<string, Page[]> = {
    'Dashboards': ['dashboard', 'lineDashboard', 'planningDashboard', 'qualityDashboard', 'gamificationDashboard'],
    'Execution': ['production', 'productionHistory', 'attendance', 'kanbanEntry', 'kanbanManagement', 'lineAllocation', 'linePlanning'],
    'Quality Control': ['inLineAudit', 'endLineInspection', 'aqlInspection', 'ncRegister'],
    'Analysis & Reports': ['dailyReport', 'performanceAnalysis', 'skillMatrix', 'orderClosingReport', 'aiInsights', 'performanceReport', 'reviewSummary'],
    'Performance': ['myPerformance', 'teamPerformance'],
    'Growth': ['growth'],
    'Master Data': ['orders', 'styles', 'employees', 'staff', 'lines', 'colors', 'reasons', 'operations', 'machines', 'operatorGrades', 'customers', 'defects', 'correctiveActions'],
    'Industrial Engineering': ['timeStudy'],
    'IoT': ['iotControlPanel', 'iotDevices'],
    'Settings': ['settings', 'kanbanSettings', 'allowanceSettings', 'outputSettings', 'gradeSettings', 'kpiSettings', 'leaderboardSettings', 'factorySettings', 'userRights'],
    'Admin': ['admin'],
  };


  return (
    <div className="p-4 sm:p-6 md:p-10">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">User Rights Management</h1>
          <p className="text-slate-600 mt-2">Configure page access for different user roles.</p>
        </div>
        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md">Save Changes</button>
      </header>
      {saveMessage && <p className="text-green-600 mb-4">{saveMessage}</p>}

      <div className="bg-white p-4 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 font-semibold text-left">Page / Feature</th>
                {Object.keys(permissions).map(role => (
                  <th key={role} className="p-2 font-semibold text-center">{role}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(pageCategories).map(([category, pages]) => (
                <React.Fragment key={category}>
                  <tr className="bg-slate-50">
                    <td colSpan={Object.keys(permissions).length + 1} className="p-2 font-bold text-slate-700">{category}</td>
                  </tr>
                  {pages.filter(p => ALL_PAGES.includes(p)).map(page => (
                    <tr key={page} className="border-b hover:bg-slate-50">
                      <td className="p-2">{page}</td>
                      {Object.keys(permissions).map(role => (
                        <td key={`${role}-${page}`} className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={permissions[role as UserRole]?.includes(page)}
                            onChange={() => handleTogglePermission(role as UserRole, page)}
                            className="h-4 w-4"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserRightsPage;