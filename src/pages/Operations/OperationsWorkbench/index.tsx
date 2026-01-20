import AppLayout from '@/components/layout/AppLayout';
import '../WorkerManagement/index.less';

const OperationsWorkbench = () => {
  return (
    <AppLayout>
      <div className="workbench">
        <h1 className="workbench-title">运营工作台</h1>
        <div className="workbench-content">
          <p className="workbench-placeholder">运营工作台内容区域</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default OperationsWorkbench;
