import AppLayout from '@/components/layout/AppLayout';
import ParameterManagementContent from '@/components/ParameterManagement/ParameterManagementContent';

import './index.less';

const ParameterManagementPage = () => {
  return (
    <AppLayout>
      <div className="parameter-management-page">
        <ParameterManagementContent context="development" />
      </div>
    </AppLayout>
  );
};

export default ParameterManagementPage;
