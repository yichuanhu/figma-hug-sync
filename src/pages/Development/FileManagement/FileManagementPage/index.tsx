import FileManagementContent from '@/components/FileManagement/FileManagementContent';

import './index.less';

const FileManagementPage = () => {
  return (
    <div className="dev-file-management-page">
      <FileManagementContent context="development" />
    </div>
  );
};

export default FileManagementPage;
