import AppLayout from '@/components/layout/AppLayout';
import { Breadcrumb } from '@douyinfe/semi-ui';
import { IconHome } from '@douyinfe/semi-icons';
import './index.less';

const MaintenanceWorkbench = () => {
  return (
    <AppLayout>
      <div className="maintenance-workbench">
        <div className="maintenance-workbench breadcrumb">
          <Breadcrumb>
            <Breadcrumb.Item icon={<IconHome />} href="/">首页</Breadcrumb.Item>
            <Breadcrumb.Item>运维中心</Breadcrumb.Item>
            <Breadcrumb.Item>运维工作台</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        
        <div className="maintenance-workbench header">
          <h1 className="maintenance-workbench header title">运维工作台</h1>
        </div>

        <div className="maintenance-workbench content">
          <div className="maintenance-workbench content content-card">
            <p className="maintenance-workbench content content-card placeholder-text">运维工作台内容区域</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MaintenanceWorkbench;
