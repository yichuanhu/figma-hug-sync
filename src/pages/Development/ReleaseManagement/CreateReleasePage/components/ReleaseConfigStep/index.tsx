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
  InputNumber,
  Checkbox,
  RadioGroup,
  Radio,
  Row,
  Col,
  Space,
} from '@douyinfe/semi-ui';
import {
  IconClose,
  IconInfoCircle,
  IconPlusStroked,
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

  // ReleaseType选项
  const releaseTypeOptions = [
    { value: 'FIRST_RELEASE', label: t('release.releaseTypes.FIRST_RELEASE') },
    { value: 'REQUIREMENT_CHANGE', label: t('release.releaseTypes.REQUIREMENT_CHANGE') },
    { value: 'BUG_FIX', label: t('release.releaseTypes.BUG_FIX') },
    { value: 'CONFIG_UPDATE', label: t('release.releaseTypes.CONFIG_UPDATE') },
    { value: 'OPTIMIZATION', label: t('release.releaseTypes.OPTIMIZATION') },
    { value: 'VERSION_ROLLBACK', label: t('release.releaseTypes.VERSION_ROLLBACK') },
  ];

  // 按Type分组Resource
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

  // UpdateResourceConfig
  const updateResource = (resourceId: string, updates: Partial<ResourceConfig>) => {
    onResourcesChange(
      resources.map((r) =>
        r.resource_id === resourceId ? { ...r, ...updates } : r
      )
    );
  };

  // Delete手动添加的Resource
  const removeManualResource = (resourceId: string) => {
    onResourcesChange(resources.filter((r) => r.resource_id !== resourceId));
  };

  // 添加手动Resource
  const handleAddResources = (newResources: ResourceConfig[]) => {
    onResourcesChange([...resources, ...newResources]);
  };

  // 已添加Resource的 ID List
  const existingResourceIds = useMemo(() => resources.map((r) => r.resource_id), [resources]);

  // ResourceType标签
  const resourceTypeLabels: Record<ResourceType, string> = {
    PARAMETER: t('release.create.resourceTypes.parameter'),
    CREDENTIAL: t('release.create.resourceTypes.credential'),
    QUEUE: t('release.create.resourceTypes.queue'),
    FILE: t('release.create.resourceTypes.file'),
  };

  // 渲染Resource卡片
  const renderResourceCard = (resource: ResourceConfig) => {
    const isCredential = resource.resource_type === 'CREDENTIAL';
    const isQueue = resource.resource_type === 'QUEUE';
    const isFile = resource.resource_type === 'FILE';

    return (
      <div key={resource.resource_id} className="release-config-step-resource-card">
        <div className="release-config-step-resource-card-header">
          <div className="release-config-step-resource-card-title">
            <Text strong ellipsis={{ showTooltip: true }}>{resource.resource_name}</Text>
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
              <Text type="tertiary" size="small" ellipsis={{ showTooltip: true }} style={{ maxWidth: 200 }}>
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

        {isFile ? null : !isQueue && (
          <div className="release-config-step-resource-card-body">
            <Row gutter={16}>
              <Col span={12}>
                <div className="release-config-step-field">
                  <Text type="tertiary" size="small">
                    {t('release.create.testValue')}
                  </Text>
                  {isCredential ? (
                    <div className="release-config-step-credential-group">
                      <div className="release-config-step-credential-item">
                        <Text className="release-config-step-credential-label" size="small">
                          {t('release.create.credentialUsername', '账号')}
                        </Text>
                        <Text>{resource.test_username || '-'}</Text>
                      </div>
                      <div className="release-config-step-credential-item">
                        <Text className="release-config-step-credential-label" size="small">
                          {t('release.create.credentialPassword', '密码')}
                        </Text>
                        <Text>******</Text>
                      </div>
                    </div>
                  ) : (
                    <div className="release-config-step-test-value-scroll">
                      {resource.test_value || '-'}
                    </div>
                  )}
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
                  {isCredential ? (
                    <div className="release-config-step-credential-group">
                      <div className="release-config-step-credential-item">
                        <Text className="release-config-step-credential-label" size="small">
                          {t('release.create.credentialUsername', '账号')}
                        </Text>
                        <Input
                          placeholder={resource.is_previously_published
                            ? t('release.create.keepExistingValue')
                            : t('release.create.enterCredentialUsername', 'Please enter账号')}
                          value={resource.production_username}
                          onChange={(value) =>
                            updateResource(resource.resource_id, { production_username: value })
                          }
                        />
                      </div>
                      <div className="release-config-step-credential-item">
                        <Text className="release-config-step-credential-label" size="small">
                          {t('release.create.credentialPassword', '密码')}
                        </Text>
                        <Input
                          placeholder={resource.is_previously_published
                            ? t('release.create.keepExistingValue')
                            : t('release.create.enterCredentialPassword', 'Please enter密码')}
                          value={resource.production_password}
                          onChange={(value) =>
                            updateResource(resource.resource_id, { production_password: value })
                          }
                          type="password"
                        />
                      </div>
                    </div>
                  ) : (() => {
                    const paramType = resource.param_type || 'TEXT';
                    const isPublished = resource.is_previously_published;
                    const useTestCheckbox = !isPublished && (
                      <Checkbox
                        checked={resource.use_test_as_production}
                        onChange={(e) =>
                          updateResource(resource.resource_id, {
                            use_test_as_production: e.target.checked as boolean,
                            production_value: '',
                          })
                        }
                      >
                        {t('release.create.useTestAsProduction')}
                      </Checkbox>
                    );

                    if (paramType === 'BOOLEAN') {
                      return (
                        <div className="release-config-step-production-input">
                          <RadioGroup
                            value={resource.production_value || undefined}
                            onChange={(e) =>
                              updateResource(resource.resource_id, { production_value: e.target.value })
                            }
                            disabled={resource.use_test_as_production}
                          >
                            <Radio value="true">True</Radio>
                            <Radio value="false">False</Radio>
                          </RadioGroup>
                          {useTestCheckbox}
                        </div>
                      );
                    }

                    if (paramType === 'NUMBER') {
                      return (
                        <div className="release-config-step-production-input">
                          <InputNumber
                            placeholder={isPublished ? t('release.create.keepExistingValue') : t('release.create.enterProductionValue')}
                            value={resource.production_value ? Number(resource.production_value) : undefined}
                            onChange={(value) =>
                              updateResource(resource.resource_id, { production_value: String(value ?? '') })
                            }
                            disabled={resource.use_test_as_production}
                            style={{ width: '100%' }}
                          />
                          {useTestCheckbox}
                        </div>
                      );
                    }

                    return (
                      <div className="release-config-step-production-input">
                        <TextArea
                          placeholder={
                            resource.use_test_as_production
                              ? resource.test_value || ''
                              : isPublished
                                ? t('release.create.keepExistingValue')
                                : t('release.create.enterProductionValue')
                          }
                          value={resource.production_value}
                          onChange={(value) =>
                            updateResource(resource.resource_id, { production_value: value })
                          }
                          disabled={resource.use_test_as_production}
                          autosize={{ minRows: 2, maxRows: 6 }}
                        />
                        {useTestCheckbox}
                      </div>
                    );
                  })()}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </div>
    );
  };

  // 渲染Resource分组
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
      {/* Basic Info */}
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

      {/* Selected processes */}
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
                <Text strong ellipsis={{ showTooltip: true }} style={{ maxWidth: 300 }}>{sp.process.name}</Text>
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

      {/* Dependent resources */}
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
            icon={<IconPlusStroked />}
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

      {/* 添加Resource模态框 */}
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
