import AppLayout from '@/components/layout/AppLayout';
import '@/pages/Development/DevelopmentWorkbench/index.less';

const RequirementsWorkbench = () => {
  return (
    <AppLayout>
      <div className="workbench">
        <h1 className="workbench-title">需求工作台</h1>
        <div className="workbench-content">
          <p className="workbench-placeholder">需求工作台内容区域</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default RequirementsWorkbench;
