import AppLayout from '@/components/layout/AppLayout';
import FileManagementContent from '@/components/FileManagement/FileManagementContent';

import './index.less';

const FileManagementPage = () => {
  return (
    <AppLayout>
      <div className="dev-file-management-page">
        <FileManagementContent context="development" />
      </div>
    </AppLayout>
  );
};

export default FileManagementPage;
