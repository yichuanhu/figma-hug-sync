import './index.less';

const MaintenanceWorkbench = () => {
  return (
    <div className="maintenance-workbench">
      <div className="maintenance-workbench header">
        <h1 className="maintenance-workbench header title">运维工作台</h1>
      </div>

      <div className="maintenance-workbench content">
        <div className="maintenance-workbench content content-card">
          <p className="maintenance-workbench content content-card placeholder-text">运维工作台内容区域</p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceWorkbench;
