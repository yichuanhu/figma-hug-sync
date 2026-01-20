import AppLayout from '@/components/layout/AppLayout';
import { Breadcrumb } from '@douyinfe/semi-ui';
import { IconHome } from '@douyinfe/semi-icons';
import './index.less';

const RequirementsWorkbench = () => {
  return (
    <AppLayout>
      <div className="requirements-workbench">
        <div className="requirements-workbench breadcrumb">
          <Breadcrumb>
            <Breadcrumb.Item icon={<IconHome />} href="/">首页</Breadcrumb.Item>
            <Breadcrumb.Item>需求中心</Breadcrumb.Item>
            <Breadcrumb.Item>需求工作台</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        
        <div className="requirements-workbench header">
          <h1 className="requirements-workbench header title">需求工作台</h1>
        </div>

        <div className="requirements-workbench content">
          <div className="requirements-workbench content content-card">
            <p className="requirements-workbench content content-card placeholder-text">需求工作台内容区域</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RequirementsWorkbench;
