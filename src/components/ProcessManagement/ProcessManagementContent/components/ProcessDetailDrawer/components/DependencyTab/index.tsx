import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tag, Button, Space, Modal, Toast } from '@douyinfe/semi-ui';
import { IconDeleteStroked } from '@douyinfe/semi-icons';
import { Plus, Trash2 } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import type { LYProcessDependency, ResourceType } from '@/api';
import AddResourceModal from '@/pages/Development/ReleaseManagement/CreateReleasePage/components/AddResourceModal';
import type { ResourceConfig } from '@/pages/Development/ReleaseManagement/CreateReleasePage';

import './index.less';

const { Text } = Typography;

interface DependencyTabProps {
  dependencies: LYProcessDependency[];
  onDependenciesChange?: (deps: LYProcessDependency[]) => void;
  readOnly?: boolean;
}

const DependencyTab = ({ dependencies, onDependenciesChange, readOnly = false }: DependencyTabProps) => {
  const { t } = useTranslation();
  const [addModalVisible, setAddModalVisible] = useState(false);

  const resourceTypeLabels: Record<ResourceType, string> = {
    PARAMETER: t('release.create.resourceTypes.parameter'),
    CREDENTIAL: t('release.create.resourceTypes.credential'),
    QUEUE: t('release.create.resourceTypes.queue'),
    FILE: t('release.create.resourceTypes.file'),
  };

  const grouped = useMemo(() => {
    const groups: Record<ResourceType, LYProcessDependency[]> = {
      PARAMETER: [],
      CREDENTIAL: [],
      QUEUE: [],
      FILE: [],
    };
    dependencies.forEach((d) => {
      if (groups[d.resource_type]) {
        groups[d.resource_type].push(d);
      }
    });
    return groups;
  }, [dependencies]);

  const handleDelete = (dep: LYProcessDependency) => {
    Modal.confirm({
      title: t('processDependency.deleteConfirm.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('processDependency.deleteConfirm.content', { name: dep.resource_name }),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: () => {
        onDependenciesChange?.(dependencies.filter((d) => d.resource_id !== dep.resource_id));
        Toast.success(t('processDependency.deleteSuccess'));
      },
    });
  };

  const handleAddResources = (resources: ResourceConfig[]) => {
    const newDeps: LYProcessDependency[] = resources.map((r) => ({
      resource_id: r.resource_id,
      resource_name: r.resource_name,
      resource_type: r.resource_type,
      source: 'MANUAL' as const,
      param_type: r.param_type,
      original_name: r.original_name,
    }));
    onDependenciesChange?.([...dependencies, ...newDeps]);
    Toast.success(t('processDependency.addSuccess', { count: newDeps.length }));
  };

  const existingIds = useMemo(() => dependencies.map((d) => d.resource_id), [dependencies]);

  const renderGroup = (type: ResourceType, items: LYProcessDependency[]) => {
    if (items.length === 0) return null;
    return (
      <div key={type} className="dependency-tab-group">
        <div className="dependency-tab-group-header">
          <Space>
            <Text strong>{resourceTypeLabels[type]}</Text>
            <Tag size="small">{items.length}</Tag>
          </Space>
        </div>
        <div className="dependency-tab-group-list">
          {items.map((dep) => (
            <div key={dep.resource_id} className="dependency-tab-item">
              <div className="dependency-tab-item-left">
                <Text strong ellipsis={{ showTooltip: true }} style={{ maxWidth: 300 }}>
                  {dep.resource_name}
                </Text>
                <Tag
                  color={dep.source === 'AUTO_DETECTED' ? 'blue' : 'grey'}
                  size="small"
                  type="light"
                >
                  {dep.source === 'AUTO_DETECTED'
                    ? t('processDependency.sourceAutoDetected')
                    : t('processDependency.sourceManual')}
                </Tag>
              </div>
              {!readOnly && dep.source === 'MANUAL' && (
                <Button
                  icon={<Trash2 size={14} strokeWidth={2} />}
                  theme="borderless"
                  type="danger"
                  size="small"
                  onClick={() => handleDelete(dep)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="dependency-tab">
      {!readOnly && (
        <div className="dependency-tab-toolbar">
          <Button
            icon={<Plus size={16} strokeWidth={2} />}
            theme="light"
            size="small"
            onClick={() => setAddModalVisible(true)}
          >
            {t('processDependency.addButton')}
          </Button>
        </div>
      )}

      {dependencies.length === 0 ? (
        <div className="dependency-tab-empty">
          <EmptyState
            description={t('processDependency.empty')}
            size={100}
          />
        </div>
      ) : (
        <div className="dependency-tab-content">
          {renderGroup('PARAMETER', grouped.PARAMETER)}
          {renderGroup('CREDENTIAL', grouped.CREDENTIAL)}
          {renderGroup('QUEUE', grouped.QUEUE)}
          {renderGroup('FILE', grouped.FILE)}
        </div>
      )}

      <AddResourceModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onConfirm={handleAddResources}
        existingResourceIds={existingIds}
      />
    </div>
  );
};

export default DependencyTab;
