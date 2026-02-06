import AppLayout from '@/components/layout/AppLayout';
import { Breadcrumb } from '@douyinfe/semi-ui';
import { IconHomeStroked } from '@douyinfe/semi-icons';
import './index.less';

const OperationsWorkbench = () => {
  return (
    <AppLayout>
      <div className="operations-workbench">
        <div className="operations-workbench breadcrumb">
          <Breadcrumb>
            <Breadcrumb.Item icon={<IconHomeStroked />} href="/">首页</Breadcrumb.Item>
            <Breadcrumb.Item>运营中心</Breadcrumb.Item>
            <Breadcrumb.Item>运营工作台</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        
        <div className="operations-workbench header">
          <h1 className="operations-workbench header title">运营工作台</h1>
        </div>

        <div className="operations-workbench content">
          <div className="operations-workbench content content-card">
            <p className="operations-workbench content content-card placeholder-text">运营工作台内容区域</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default OperationsWorkbench;
