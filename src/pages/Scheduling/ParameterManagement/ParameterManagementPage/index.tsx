import ParameterManagementContent from '@/components/ParameterManagement/ParameterManagementContent';

import './index.less';

const SchedulingParameterManagementPage = () => {
  return (
    <div className="scheduling-parameter-management-page">
      <ParameterManagementContent context="scheduling" />
    </div>
  );
};

export default SchedulingParameterManagementPage;
