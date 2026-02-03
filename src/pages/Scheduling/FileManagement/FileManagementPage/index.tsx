import AppLayout from '@/components/layout/AppLayout';
import FileManagementContent from '@/components/FileManagement/FileManagementContent';

import './index.less';

const SchedulingFileManagementPage = () => {
  return (
    <AppLayout>
      <div className="scheduling-file-management-page">
        <FileManagementContent context="scheduling" />
      </div>
    </AppLayout>
  );
};

export default SchedulingFileManagementPage;
