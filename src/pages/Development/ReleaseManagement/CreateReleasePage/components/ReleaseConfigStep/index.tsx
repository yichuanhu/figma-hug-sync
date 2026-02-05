import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Card,
  Form,
  Select,
  TextArea,
  Tag,
  Button,
  Banner,
  Input,
  Checkbox,
  Row,
  Col,
  Space,
} from '@douyinfe/semi-ui';
import {
  IconClose,
  IconInfoCircle,
  IconPlus,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import type { ReleaseType, ResourceType } from '@/api';
import type { SelectedProcess, ResourceConfig } from '../../index';
import AddResourceModal from '../AddResourceModal';

import './index.less';

const { Title, Text } = Typography;

interface ReleaseConfigStepProps {
  selectedProcesses: SelectedProcess[];
  onRemoveProcess: (processId: string) => void;
  releaseType: ReleaseType;
  onReleaseTypeChange: (type: ReleaseType) => void;
  description: string;
  onDescriptionChange: (desc: string) => void;
  resources: ResourceConfig[];
  onResourcesChange: (resources: ResourceConfig[]) => void;
}

const ReleaseConfigStep: React.FC<ReleaseConfigStepProps> = ({
  selectedProcesses,
  onRemoveProcess,
  releaseType,
  onReleaseTypeChange,
  description,
  onDescriptionChange,
  resources,
  onResourcesChange,
}) => {
  const { t } = useTranslation();
  const [addResourceModalVisible, setAddResourceModalVisible] = useState(false);

  // 发布类型选项
  const releaseTypeOptions = [
    { value: 'FIRST_RELEASE', label: t('release.releaseTypes.FIRST_RELEASE') },
    { value: 'REQUIREMENT_CHANGE', label: t('release.releaseTypes.REQUIREMENT_CHANGE') },
    { value: 'BUG_FIX', label: t('release.releaseTypes.BUG_FIX') },
    { value: 'CONFIG_UPDATE', label: t('release.releaseTypes.CONFIG_UPDATE') },
    { value: 'OPTIMIZATION', label: t('release.releaseTypes.OPTIMIZATION') },
    { value: 'VERSION_ROLLBACK', label: t('release.releaseTypes.VERSION_ROLLBACK') },
  ];

  // 按类型分组资源
  const groupedResources = useMemo(() => {
    const groups: Record<ResourceType, ResourceConfig[]> = {
      PARAMETER: [],
      CREDENTIAL: [],
      QUEUE: [],
      FILE: [],
    };
    resources.forEach((r) => {
      if (groups[r.resource_type]) {
        groups[r.resource_type].push(r);
      }
    });
    return groups;
  }, [resources]);

  // 更新资源配置
  const updateResource = (resourceId: string, updates: Partial<ResourceConfig>) => {
    onResourcesChange(
      resources.map((r) =>
        r.resource_id === resourceId ? { ...r, ...updates } : r
      )
    );
  };

  // 删除手动添加的资源
  const removeManualResource = (resourceId: string) => {
    onResourcesChange(resources.filter((r) => r.resource_id !== resourceId));
  };

  // 添加手动资源
  const handleAddResources = (newResources: ResourceConfig[]) => {
    onResourcesChange([...resources, ...newResources]);
  };

  // 已添加资源的 ID 列表
  const existingResourceIds = useMemo(() => resources.map((r) => r.resource_id), [resources]);

  // 资源类型标签
  const resourceTypeLabels: Record<ResourceType, string> = {
    PARAMETER: t('release.create.resourceTypes.parameter'),
    CREDENTIAL: t('release.create.resourceTypes.credential'),
    QUEUE: t('release.create.resourceTypes.queue'),
    FILE: t('release.create.resourceTypes.file'),
  };

  // 渲染资源卡片
  const renderResourceCard = (resource: ResourceConfig) => {
    const isCredential = resource.resource_type === 'CREDENTIAL';
    const isQueue = resource.resource_type === 'QUEUE';
    const isFile = resource.resource_type === 'FILE';

    return (
      <div key={resource.resource_id} className="release-config-step-resource-card">
        <div className="release-config-step-resource-card-header">
          <div className="release-config-step-resource-card-title">
            <Text strong>{resource.resource_name}</Text>
            {resource.is_previously_published && (
              <Tag color="green" size="small" className="release-config-step-published-tag">
                {t('release.create.alreadyPublished')}
              </Tag>
            )}
          </div>
          <div className="release-config-step-resource-card-actions">
            {resource.is_manual && (
              <Tag color="grey" size="small">
                {t('release.create.manuallyAdded')}
              </Tag>
            )}
            {resource.used_by_processes.length > 0 && (
              <Text type="tertiary" size="small">
                {t('release.create.usedBy')}: {resource.used_by_processes.join(', ')}
              </Text>
            )}
            {resource.is_manual && (
              <Button
                icon={<IconDeleteStroked />}
                theme="borderless"
                type="danger"
                size="small"
                onClick={() => removeManualResource(resource.resource_id)}
              />
            )}
          </div>
        </div>

        {isFile ? (
          <div className="release-config-step-resource-card-body">
            <div className="release-config-step-field">
              <Text type="tertiary" size="small">
                {t('release.detail.originalFileName')}
              </Text>
              <Text>{resource.original_name || '-'}</Text>
            </div>
          </div>
        ) : !isQueue && (
          <div className="release-config-step-resource-card-body">
            <Row gutter={16}>
              <Col span={12}>
                <div className="release-config-step-field">
                  <Text type="tertiary" size="small">
                    {t('release.create.testValue')}
                  </Text>
                  <Text ellipsis={{ showTooltip: true }}>
                    {resource.test_value || '-'}
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <div className="release-config-step-field">
                  <Text type="tertiary" size="small">
                    {t('release.create.productionValue')}
                    {!resource.is_previously_published && !isCredential && (
                      <Text type="danger"> *</Text>
                    )}
                  </Text>
                  {resource.is_previously_published ? (
                    <div className="release-config-step-production-input">
                      <Input
                        placeholder={t('release.create.keepExistingValue')}
                        value={resource.production_value}
                        onChange={(value) =>
                          updateResource(resource.resource_id, { production_value: value })
                        }
                        disabled={resource.use_test_as_production}
                        type={isCredential ? 'password' : 'text'}
                      />
                    </div>
                  ) : (
                    <div className="release-config-step-production-input">
                      <Input
                        placeholder={
                          resource.use_test_as_production
                            ? resource.test_value || ''
                            : t('release.create.enterProductionValue')
                        }
                        value={resource.production_value}
                        onChange={(value) =>
                          updateResource(resource.resource_id, { production_value: value })
                        }
                        disabled={resource.use_test_as_production}
                        type={isCredential ? 'password' : 'text'}
                      />
                      <Checkbox
                        checked={resource.use_test_as_production}
                        onChange={(e) =>
                          updateResource(resource.resource_id, {
                            use_test_as_production: e.target.checked as boolean,
                            production_value: '',
                          })
                        }
                      >
                        <Text size="small">{t('release.create.useTestAsProduction')}</Text>
                      </Checkbox>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </div>
    );
  };

  // 渲染资源分组
  const renderResourceGroup = (type: ResourceType, resourceList: ResourceConfig[]) => {
    if (resourceList.length === 0) return null;

    return (
      <div key={type} className="release-config-step-resource-group">
        <div className="release-config-step-resource-group-header">
          <Space>
            <Text strong>{resourceTypeLabels[type]}</Text>
            <Tag size="small">{resourceList.length}</Tag>
          </Space>
        </div>
        <div className="release-config-step-resource-list">
          {resourceList.map(renderResourceCard)}
        </div>
      </div>
    );
  };

  const totalResourceCount = resources.length;

  return (
    <div className="release-config-step">
      {/* 基本信息 */}
      <Card className="release-config-step-section" title={t('release.create.basicInfo')}>
        <Form labelPosition="left" labelWidth={100}>
          <Form.Slot label={t('release.create.releaseType')}>
            <Select
              value={releaseType}
              onChange={(value) => onReleaseTypeChange(value as ReleaseType)}
              optionList={releaseTypeOptions}
              style={{ width: 200 }}
            />
          </Form.Slot>
          <Form.Slot label={t('release.create.description')}>
            <TextArea
              value={description}
              onChange={(value) => onDescriptionChange(value)}
              placeholder={t('release.create.descriptionPlaceholder')}
              maxCount={2000}
              showClear
              autosize={{ minRows: 3, maxRows: 6 }}
              style={{ width: '100%' }}
            />
            <Text type="tertiary" size="small">
              {t('release.create.descriptionHint')}
            </Text>
          </Form.Slot>
        </Form>
      </Card>

      {/* 已选择的流程 */}
      <Card
        className="release-config-step-section"
        title={
          <Space>
            <span>{t('release.create.selectedProcesses')}</span>
            <Tag size="small">{selectedProcesses.length}</Tag>
          </Space>
        }
      >
        <div className="release-config-step-process-list">
          {selectedProcesses.map((sp) => (
            <div key={sp.process.id} className="release-config-step-process-item">
              <div className="release-config-step-process-info">
                <Text strong>{sp.process.name}</Text>
                <Text type="tertiary" size="small">
                  ({sp.version_number})
                </Text>
              </div>
              <Button
                icon={<IconClose />}
                theme="borderless"
                type="tertiary"
                size="small"
                onClick={() => onRemoveProcess(sp.process.id)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* 依赖资源 */}
      <Card
        className="release-config-step-section"
        title={
          <Space>
            <span>{t('release.create.dependencyResources')}</span>
            <Tag size="small">{totalResourceCount}</Tag>
          </Space>
        }
        headerExtraContent={
          <Button
            icon={<IconPlus />}
            theme="light"
            size="small"
            onClick={() => setAddResourceModalVisible(true)}
          >
            {t('release.create.addResource.button')}
          </Button>
        }
      >
        <Banner
          type="info"
          icon={<IconInfoCircle />}
          description={t('release.create.dependencyHint')}
          className="release-config-step-banner"
        />

        <div className="release-config-step-resources">
          {renderResourceGroup('PARAMETER', groupedResources.PARAMETER)}
          {renderResourceGroup('CREDENTIAL', groupedResources.CREDENTIAL)}
          {renderResourceGroup('QUEUE', groupedResources.QUEUE)}
          {renderResourceGroup('FILE', groupedResources.FILE)}

          {totalResourceCount === 0 && (
            <div className="release-config-step-no-resources">
              <Text type="tertiary">{t('release.create.noDependencies')}</Text>
            </div>
          )}
        </div>
      </Card>

      {/* 添加资源模态框 */}
      <AddResourceModal
        visible={addResourceModalVisible}
        onClose={() => setAddResourceModalVisible(false)}
        onConfirm={handleAddResources}
        existingResourceIds={existingResourceIds}
      />
    </div>
  );
};

export default ReleaseConfigStep;
