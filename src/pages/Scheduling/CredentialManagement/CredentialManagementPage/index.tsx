import CredentialManagementContent from '@/components/CredentialManagement/CredentialManagementContent';

import './index.less';

const SchedulingCredentialManagementPage = () => {
  return (
    <div className="scheduling-credential-management-page">
      <CredentialManagementContent context="scheduling" />
    </div>
  );
};

export default SchedulingCredentialManagementPage;
