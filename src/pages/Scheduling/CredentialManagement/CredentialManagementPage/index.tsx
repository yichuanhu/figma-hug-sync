import AppLayout from '@/components/layout/AppLayout';
import CredentialManagementContent from '@/components/CredentialManagement/CredentialManagementContent';

import './index.less';

const SchedulingCredentialManagementPage = () => {
  return (
    <AppLayout>
      <div className="scheduling-credential-management-page">
        <CredentialManagementContent context="scheduling" />
      </div>
    </AppLayout>
  );
};

export default SchedulingCredentialManagementPage;
