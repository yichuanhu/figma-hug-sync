import AppLayout from '@/components/layout/AppLayout';
import { Breadcrumb } from '@douyinfe/semi-ui';
import { IconHomeStroked } from '@douyinfe/semi-icons';
import './index.less';

const DevelopmentWorkbench = () => {
  return (
    <AppLayout>
      <div className="development-workbench">
        <div className="development-workbench breadcrumb">
          <Breadcrumb>
            <Breadcrumb.Item icon={<IconHomeStroked />} href="/">首页</Breadcrumb.Item>
            <Breadcrumb.Item>开发中心</Breadcrumb.Item>
            <Breadcrumb.Item>开发工作台</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        
        <div className="development-workbench header">
          <h1 className="development-workbench header title">开发工作台</h1>
        </div>

        <div className="development-workbench content">
          <div className="development-workbench content content-card">
            <p className="development-workbench content content-card placeholder-text">开发工作台内容区域</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DevelopmentWorkbench;
