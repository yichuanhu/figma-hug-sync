import EmptyState from '@/components/EmptyState';
import './index.less';

const MaintenanceWorkbench = () => {
  return (
    <div className="maintenance-workbench" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <EmptyState
        variant="maintenance"
        size={200}
        description="正在开发中，敬请期待"
        footer={
          <p style={{ maxWidth: 420, textAlign: 'center', color: 'var(--semi-color-text-2)', fontSize: 13, lineHeight: 1.8 }}>
            运维中心整合系统监控、告警管理和资源运维等功能，为IT基础设施部门、系统管理员提供平台稳定运行的技术保障。确保平台高可用、可扩展、安全可控。
          </p>
        }
      />
    </div>
  );
};

export default MaintenanceWorkbench;
