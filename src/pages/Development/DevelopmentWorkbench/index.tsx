import AppLayout from '@/components/layout/AppLayout';
import './index.less';

const DevelopmentWorkbench = () => {
  return (
    <AppLayout>
      <div className="workbench">
        <h1 className="workbench-title">开发工作台</h1>
        <div className="workbench-content">
          <p className="workbench-placeholder">开发工作台内容区域</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default DevelopmentWorkbench;
