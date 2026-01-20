import AppLayout from '@/components/layout/AppLayout';
import { Breadcrumb } from '@douyinfe/semi-ui';
import { IconHome } from '@douyinfe/semi-icons';

const DevelopmentWorkbench = () => {
  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }}>
        <Breadcrumb>
          <Breadcrumb.Item icon={<IconHome />} href="/">首页</Breadcrumb.Item>
          <Breadcrumb.Item>开发中心</Breadcrumb.Item>
          <Breadcrumb.Item>开发工作台</Breadcrumb.Item>
        </Breadcrumb>
        
        <h1 style={{ 
          fontSize: 20, 
          fontWeight: 600, 
          marginTop: 16,
          marginBottom: 24,
          color: 'var(--semi-color-text-0)'
        }}>
          开发工作台
        </h1>

        <div style={{
          backgroundColor: 'var(--semi-color-bg-0)',
          borderRadius: 8,
          padding: 24,
          minHeight: 400,
        }}>
          <p style={{ color: 'var(--semi-color-text-2)' }}>开发工作台内容区域</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default DevelopmentWorkbench;
