import CredentialManagementContent from '@/components/CredentialManagement/CredentialManagementContent';

import './index.less';

const CredentialManagementPage = () => {
  return (
    <div className="credential-management-page">
      <CredentialManagementContent context="development" />
    </div>
  );
};

export default CredentialManagementPage;
