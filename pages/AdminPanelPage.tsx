import React from 'react';
import type { Staff, MasterDataItem } from '../types';
import StaffMasterPage from './StaffMasterPage';

interface AdminPanelPageProps {
  staff: Staff[];
  lines: MasterDataItem[];
  onAddStaff: (staff: Staff) => void;
  onUpdateStaff: (staff: Staff) => void;
  onDeleteStaff: (staffId: string) => void;
  currentUser: Staff;
}

const AdminPanelPage = (props: AdminPanelPageProps) => {
  return (
    <div>
      <StaffMasterPage {...props} />
    </div>
  );
};

export default AdminPanelPage;