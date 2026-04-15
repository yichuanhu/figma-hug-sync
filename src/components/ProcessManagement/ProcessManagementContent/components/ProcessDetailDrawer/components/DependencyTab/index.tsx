import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Typography, Tag, Button, Modal, Toast } from '@douyinfe/semi-ui';
import { IconDeleteStroked } from '@douyinfe/semi-icons';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import type { LYProcessDependency, ResourceType } from '@/api';
import AddResourceModal from '@/pages/Development/ReleaseManagement/CreateReleasePage/components/AddResourceModal';
import type { ResourceConfig } from '@/pages/Development/ReleaseManagement/CreateReleasePage';

import './index.less';

const { Title, Text } = Typography;

interface DependencyTabProps {
  dependencies: LYProcessDependency[];
  onDependenciesChange?: (deps: LYProcessDependency[]) => void;
  readOnly?: boolean;
  context?: 'development' | 'scheduling';
}

const RESOURCE_TYPE_ROUTE_MAP: Record<ResourceType, string> = {
  PARAMETER: 'parameters',
  CREDENTIAL: 'credentials',
  QUEUE: 'queues',
  FILE: 'files',
};

const DependencyTab = ({ dependencies, onDependenciesChange, readOnly = false, context = 'development' }: DependencyTabProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      resource_value: r.test_value || undefined,
    }));
    onDependenciesChange?.([...dependencies, ...newDeps]);
    Toast.success(t('processDependency.addSuccess', { count: newDeps.length }));
  };

  const handleNavigateToResource = (dep: LYProcessDependency) => {
    const basePath = context === 'development'
      ? '/dev-center/business-assets'
      : '/scheduling-center/business-assets';
    const route = RESOURCE_TYPE_ROUTE_MAP[dep.resource_type];
    navigate(`${basePath}/${route}?resourceId=${dep.resource_id}`);
  };

  const existingIds = useMemo(() => dependencies.map((d) => d.resource_id), [dependencies]);

  const renderResourceCard = (dep: LYProcessDependency) => (
    <div key={dep.resource_id} className="dependency-tab-resource-card">
      <div className="dependency-tab-resource-card-header">
        <span
          className="dependency-tab-resource-name"
          onClick={() => handleNavigateToResource(dep)}
        >
          <Text strong ellipsis={{ showTooltip: true }}>{dep.resource_name}</Text>
          <ExternalLink size={16} strokeWidth={2} className="dependency-tab-link-icon" />
        </span>
        <Tag
          color={dep.source === 'AUTO_DETECTED' ? 'blue' : 'grey'}
          size="small"
          type="light"
          className="dependency-tab-resource-tag"
        >
          {dep.source === 'AUTO_DETECTED'
            ? t('processDependency.sourceAutoDetected')
            : t('processDependency.sourceManual')}
        </Tag>
        {!readOnly && dep.source === 'MANUAL' && (
          <Button
            icon={<Trash2 size={14} strokeWidth={2} />}
            theme="borderless"
            type="danger"
            size="small"
            className="dependency-tab-delete-btn"
            onClick={() => handleDelete(dep)}
          />
        )}
      </div>
      <div className="dependency-tab-resource-card-body">
        {dep.resource_type === 'CREDENTIAL' ? (
          <Text type="tertiary" ellipsis={{ showTooltip: true }}>
            {context === 'development' ? t('processDependency.devValue') : t('processDependency.prodValue')}：********
          </Text>
        ) : dep.resource_type === 'PARAMETER' && dep.resource_value ? (
          <div className="dependency-tab-value-field">
            <Text type="tertiary">{context === 'development' ? t('processDependency.devValue') : t('processDependency.prodValue')}：</Text>
            <div className="dependency-tab-value-scroll">
              <Text>{dep.resource_value}</Text>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderGroup = (type: ResourceType, items: LYProcessDependency[]) => {
    if (items.length === 0) return null;
    return (
      <div key={type} className="dependency-tab-section">
        <Title heading={6} className="dependency-tab-section-title">
          {resourceTypeLabels[type]} ({items.length})
        </Title>
        <div className="dependency-tab-resource-list">
          {items.map((dep) => renderResourceCard(dep))}
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
