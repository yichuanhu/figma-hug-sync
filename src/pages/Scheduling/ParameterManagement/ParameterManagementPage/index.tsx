import AppLayout from '@/components/layout/AppLayout';
import ParameterManagementContent from '@/components/ParameterManagement/ParameterManagementContent';

import './index.less';

const SchedulingParameterManagementPage = () => {
  return (
    <AppLayout>
      <div className="scheduling-parameter-management-page">
        <ParameterManagementContent context="scheduling" />
      </div>
    </AppLayout>
  );
};

export default SchedulingParameterManagementPage;
