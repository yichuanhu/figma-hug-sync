import FileManagementContent from '@/components/FileManagement/FileManagementContent';

import './index.less';

const SchedulingFileManagementPage = () => {
  return (
    <div className="scheduling-file-management-page">
      <FileManagementContent context="scheduling" />
    </div>
  );
};

export default SchedulingFileManagementPage;
