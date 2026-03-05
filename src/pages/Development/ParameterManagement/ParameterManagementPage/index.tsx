import ParameterManagementContent from '@/components/ParameterManagement/ParameterManagementContent';

import './index.less';

const ParameterManagementPage = () => {
  return (
    <div className="parameter-management-page">
      <ParameterManagementContent context="development" />
    </div>
  );
};

export default ParameterManagementPage;
