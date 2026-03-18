import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Steps,
  Toast,
  Spin,
  Modal,
} from '@douyinfe/semi-ui';
import { IconArrowLeft, IconInfoCircle } from '@douyinfe/semi-icons';
// AppLayout removed - now handled at route level
import ProcessSelectionStep from './components/ProcessSelectionStep';
import ReleaseConfigStep from './components/ReleaseConfigStep';
import type {
  LYPublishableProcessResponse,
  ReleaseType,
  LYDependencyDetectionResponse,
  CreateReleaseRequest,
  ResourceType,
} from '@/api';

import './index.less';

const { Title, Text } = Typography;

export interface SelectedProcess {
  process: LYPublishableProcessResponse;
  version_id: string;
  version_number: string;
}

export interface ResourceConfig {
  resource_id: string;
  resource_name: string;
  resource_type: ResourceType;
  is_manual: boolean;
  is_previously_published: boolean;
  test_value?: string | null;
  test_username?: string;
  test_password?: string;
  production_value?: string;
  production_username?: string;
  production_password?: string;
  use_test_as_production: boolean;
  used_by_processes: string[];
  original_name?: string;
}

const CreateReleasePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 步骤控制
  const [currentStep, setCurrentStep] = useState(0);

  // 步骤1: 流程选择
  const [selectedProcesses, setSelectedProcesses] = useState<SelectedProcess[]>([]);

  // 步骤2: 发布配置
  const [releaseType, setReleaseType] = useState<ReleaseType>('REQUIREMENT_CHANGE');
  const [description, setDescription] = useState('');
  const [resources, setResources] = useState<ResourceConfig[]>([]);
  const [detectingDependencies, setDetectingDependencies] = useState(false);

  // 提交状态
  const [submitting, setSubmitting] = useState(false);

  // Mock 依赖检测
  const detectDependencies = useCallback(async (processes: SelectedProcess[]): Promise<LYDependencyDetectionResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock 检测结果
    const parameters = [
      {
        resource_id: 'PARAM-001',
        resource_name: 'ERP API 地址',
        is_previously_published: true,
        test_value: 'https://test.erp.com/api',
        used_by_processes: processes.map((p) => ({
          process_id: p.process.id,
          process_name: p.process.name,
        })),
      },
      {
        resource_id: 'PARAM-002',
        resource_name: '批量处理数量',
        is_previously_published: false,
        test_value: '100',
        used_by_processes: processes.slice(0, 1).map((p) => ({
          process_id: p.process.id,
          process_name: p.process.name,
        })),
      },
      {
        resource_id: 'PARAM-003',
        resource_name: '这是一个超级超级长的参数名称用来测试当参数名称文本过长时候资源卡片的标题区域是否能正确处理截断和换行的边界场景',
        is_previously_published: false,
        test_value: '这是一段非常非常长的文本类型参数值，用来模拟实际业务中可能出现的超长配置文本。例如一段完整的JSON配置内容：{"database":{"host":"192.168.1.100","port":5432,"username":"admin","password":"encrypted_password_here","database_name":"production_db","connection_pool_size":20,"timeout_ms":30000},"redis":{"host":"192.168.1.101","port":6379,"cluster_mode":true},"logging":{"level":"INFO","output":"file","path":"/var/log/app/"}}',
        used_by_processes: processes.map((p) => ({
          process_id: p.process.id,
          process_name: p.process.name,
        })),
      },
      {
        resource_id: 'PARAM-004',
        resource_name: '全局化多语言翻译映射配置参数_包含中英日韩法德西葡俄阿等十国语言对照表',
        is_previously_published: true,
        test_value: 'https://translation-service.internal.company.com/api/v3/multilingual/mapping?source=zh-CN&targets=en-US,ja-JP,ko-KR,fr-FR,de-DE,es-ES,pt-BR,ru-RU,ar-SA&format=json&include_variants=true&fallback=en-US',
        used_by_processes: processes.slice(0, 2).map((p) => ({
          process_id: p.process.id,
          process_name: p.process.name,
        })),
      },
    ];

    const credentials = [
      {
        resource_id: 'CRED-001',
        resource_name: 'ERP 系统凭据',
        is_previously_published: true,
        test_value: '******',
        used_by_processes: processes.map((p) => ({
          process_id: p.process.id,
          process_name: p.process.name,
        })),
      },
    ];

    const queues = processes.length > 1
      ? [
          {
            resource_id: 'QUEUE-001',
            resource_name: '订单处理队列',
            is_previously_published: false,
            test_value: null,
            used_by_processes: processes.slice(0, 1).map((p) => ({
              process_id: p.process.id,
              process_name: p.process.name,
            })),
          },
        ]
      : [];

    const files = [
      {
        resource_id: 'FILE-001',
        resource_name: '订单模板',
        original_name: '订单模板_v2.xlsx',
        is_previously_published: true,
        test_value: null,
        used_by_processes: processes.slice(0, 1).map((p) => ({
          process_id: p.process.id,
          process_name: p.process.name,
        })),
      },
    ];

    return { parameters, credentials, queues, files };
  }, []);

  // 当进入步骤2时，检测依赖
  useEffect(() => {
    if (currentStep === 1 && selectedProcesses.length > 0) {
      setDetectingDependencies(true);
      detectDependencies(selectedProcesses)
        .then((result) => {
          const allResources: ResourceConfig[] = [
            ...result.parameters.map((r) => ({
              resource_id: r.resource_id,
              resource_name: r.resource_name,
              resource_type: 'PARAMETER' as ResourceType,
              is_manual: false,
              is_previously_published: r.is_previously_published,
              test_value: r.test_value,
              production_value: '',
              use_test_as_production: false,
              used_by_processes: r.used_by_processes.map((p) => p.process_name),
            })),
            ...result.credentials.map((r) => ({
              resource_id: r.resource_id,
              resource_name: r.resource_name,
              resource_type: 'CREDENTIAL' as ResourceType,
              is_manual: false,
              is_previously_published: r.is_previously_published,
              test_value: r.test_value,
              test_username: (r as any).test_username || 'test_admin',
              test_password: (r as any).test_password || '********',
              production_value: '',
              use_test_as_production: false,
              used_by_processes: r.used_by_processes.map((p) => p.process_name),
            })),
            ...result.queues.map((r) => ({
              resource_id: r.resource_id,
              resource_name: r.resource_name,
              resource_type: 'QUEUE' as ResourceType,
              is_manual: false,
              is_previously_published: r.is_previously_published,
              test_value: r.test_value,
              production_value: '',
              use_test_as_production: false,
              used_by_processes: r.used_by_processes.map((p) => p.process_name),
            })),
            ...(result.files || []).map((r) => ({
              resource_id: r.resource_id,
              resource_name: r.resource_name,
              resource_type: 'FILE' as ResourceType,
              is_manual: false,
              is_previously_published: r.is_previously_published,
              test_value: r.test_value,
              production_value: '',
              use_test_as_production: false,
              used_by_processes: r.used_by_processes.map((p) => p.process_name),
              original_name: (r as any).original_name,
            })),
          ];
          setResources(allResources);
        })
        .finally(() => {
          setDetectingDependencies(false);
        });
    }
  }, [currentStep, selectedProcesses, detectDependencies]);

  // 处理步骤变化
  const handleNext = () => {
    if (currentStep === 0) {
      if (selectedProcesses.length === 0) {
        Toast.warning(t('release.create.validation.noProcessSelected'));
        return;
      }
      setCurrentStep(1);
    }
  };

  const handlePrev = () => {
    if (currentStep === 1) {
      setCurrentStep(0);
    }
  };

  // 处理发布提交
  const handleSubmit = async () => {
    if (!description.trim()) {
      Toast.warning(t('release.create.validation.descriptionRequired'));
      return;
    }

    // 检查未发布资源的生产值
    const missingProductionValues = resources.filter((r) => {
      if (r.is_previously_published || r.use_test_as_production) return false;
      if (r.resource_type === 'QUEUE' || r.resource_type === 'FILE') return false;
      if (r.resource_type === 'CREDENTIAL') {
        return !r.production_username || !r.production_password;
      }
      return !r.production_value;
    });

    if (missingProductionValues.length > 0) {
      Toast.warning(t('release.create.validation.missingProductionValues'));
      return;
    }

    setSubmitting(true);
    try {
      // Mock API 调用
      const request: CreateReleaseRequest = {
        release_type: releaseType,
        description: description.trim(),
        process_versions: selectedProcesses.map((sp) => ({
          process_id: sp.process.id,
          version_id: sp.version_id,
        })),
        resources: resources.map((r) => ({
          resource_id: r.resource_id,
          resource_type: r.resource_type,
          is_manual: r.is_manual,
          use_test_as_production: r.use_test_as_production,
          production_value: r.production_value,
        })),
      };

      console.log('Creating release:', request);

      await new Promise((resolve) => setTimeout(resolve, 1500));
      Toast.success(t('release.create.success'));
      navigate('/dev-center/release-management');
    } catch (error) {
      Toast.error(t('release.create.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // 检查是否有填写内容
  const hasContent = useMemo(() => {
    // 检查是否选择了流程
    if (selectedProcesses.length > 0) return true;
    // 检查是否填写了描述
    if (description.trim()) return true;
    // 检查是否修改了资源配置
    if (resources.some((r) => r.production_value || r.use_test_as_production)) return true;
    return false;
  }, [selectedProcesses, description, resources]);

  // 处理取消/返回
  const handleCancel = () => {
    if (hasContent) {
      Modal.confirm({
        title: t('release.create.exitConfirm.title'),
        icon: <IconInfoCircle style={{ color: 'var(--semi-color-warning)' }} />,
        content: t('release.create.exitConfirm.content'),
        okText: t('release.create.exitConfirm.confirm'),
        cancelText: t('release.create.exitConfirm.cancel'),
        onOk: () => {
          navigate('/dev-center/release-management');
        },
      });
    } else {
      navigate('/dev-center/release-management');
    }
  };

  return (
      <div className="create-release-page">

        {/* 头部 */}
        <div className="create-release-page-header">
          <Button
            icon={<IconArrowLeft />}
            theme="borderless"
            type="tertiary"
            onClick={handleCancel}
            className="create-release-page-back-btn"
          />
          <Title heading={4} className="create-release-page-title">
            {t('release.create.title')}
          </Title>
        </div>

        {/* 步骤条 */}
        <div className="create-release-page-steps">
          <Steps current={currentStep} type="basic">
            <Steps.Step
              title={t('release.create.steps.selectProcess')}
              description={t('release.create.steps.selectProcessDesc')}
            />
            <Steps.Step
              title={t('release.create.steps.configRelease')}
              description={t('release.create.steps.configReleaseDesc')}
            />
          </Steps>
        </div>

        {/* 内容区域 */}
        <div className="create-release-page-content">
          {currentStep === 0 && (
            <ProcessSelectionStep
              selectedProcesses={selectedProcesses}
              onSelectionChange={setSelectedProcesses}
            />
          )}

          {currentStep === 1 && (
            <Spin spinning={detectingDependencies} tip={t('release.create.detectingDependencies')}>
              <ReleaseConfigStep
                selectedProcesses={selectedProcesses}
                onRemoveProcess={(processId) => {
                  setSelectedProcesses((prev) =>
                    prev.filter((sp) => sp.process.id !== processId)
                  );
                }}
                releaseType={releaseType}
                onReleaseTypeChange={setReleaseType}
                description={description}
                onDescriptionChange={setDescription}
                resources={resources}
                onResourcesChange={setResources}
              />
            </Spin>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="create-release-page-footer">
          <div className="create-release-page-footer-left">
            {currentStep === 0 && (
              <Text type="tertiary">
                {t('release.create.selectedCount', { count: selectedProcesses.length })}
              </Text>
            )}
          </div>
          <div className="create-release-page-footer-right">
            <Button onClick={handleCancel}>{t('common.cancel')}</Button>
            {currentStep === 1 && (
              <Button onClick={handlePrev}>{t('release.create.prevStep')}</Button>
            )}
            {currentStep === 0 && (
              <Button
                type="primary"
                theme="solid"
                onClick={handleNext}
                disabled={selectedProcesses.length === 0}
              >
                {t('release.create.nextStep')}
              </Button>
            )}
            {currentStep === 1 && (
              <Button
                type="primary"
                theme="solid"
                onClick={handleSubmit}
                loading={submitting}
                disabled={detectingDependencies || selectedProcesses.length === 0}
              >
                {t('release.create.confirmPublish')}
              </Button>
            )}
          </div>
        </div>
      </div>
  );
};

export default CreateReleasePage;
