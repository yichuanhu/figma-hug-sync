import AppLayout from '@/components/layout/AppLayout';
import { Breadcrumb } from '@douyinfe/semi-ui';
import { IconHomeStroked } from '@douyinfe/semi-icons';
import './index.less';

const SchedulingWorkbench = () => {
  return (
    <AppLayout>
      <div className="scheduling-workbench">
        <div className="scheduling-workbench breadcrumb">
          <Breadcrumb>
            <Breadcrumb.Item icon={<IconHomeStroked />} href="/">首页</Breadcrumb.Item>
            <Breadcrumb.Item>调度中心</Breadcrumb.Item>
            <Breadcrumb.Item>调度工作台</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        
        <div className="scheduling-workbench header">
          <h1 className="scheduling-workbench header title">调度工作台</h1>
        </div>

        <div className="scheduling-workbench content">
          <div className="scheduling-workbench content content-card">
            <p className="scheduling-workbench content content-card placeholder-text">调度工作台内容区域</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SchedulingWorkbench;
