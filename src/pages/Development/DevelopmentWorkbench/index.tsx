import './index.less';

const DevelopmentWorkbench = () => {
  return (
    <div className="development-workbench">
      <div className="development-workbench header">
        <h1 className="development-workbench header title">开发工作台</h1>
      </div>

      <div className="development-workbench content">
        <div className="development-workbench content content-card">
          <p className="development-workbench content content-card placeholder-text">开发工作台内容区域</p>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentWorkbench;
