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
// AppLayout removed - now handled at route level
import ProcessSelectionStep from './components/ProcessSelectionStep';
import ReleaseConfigStep from './components/ReleaseConfigStep';
import type {
  LYPublishableProcessResponse,
  ReleaseType,
  CreateReleaseRequest,
  ResourceType,
} from '@/api';

import './index.less';
import { ArrowLeft } from 'lucide-react';

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
  param_type?: 'TEXT' | 'BOOLEAN' | 'NUMBER';
}

const CreateReleasePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Step控制
  const [currentStep, setCurrentStep] = useState(0);

  // Step1: Processselect
  const [selectedProcesses, setSelectedProcesses] = useState<SelectedProcess[]>([]);

  // Step2: ReleaseConfig
  const [releaseType, setReleaseType] = useState<ReleaseType>('REQUIREMENT_CHANGE');
  const [description, setDescription] = useState('');
  const [resources, setResources] = useState<ResourceConfig[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 当进入Step2时, 从流程依赖聚合资源
  useEffect(() => {
    if (currentStep === 1 && selectedProcesses.length > 0) {
      const allResources: ResourceConfig[] = [];
      const seenIds = new Set<string>();

      selectedProcesses.forEach((sp) => {
        const deps = sp.process.dependencies || [];
        deps.forEach((dep) => {
          if (seenIds.has(dep.resource_id)) {
            // 已存在，合并 used_by_processes
            const existing = allResources.find((r) => r.resource_id === dep.resource_id);
            if (existing && !existing.used_by_processes.includes(sp.process.name)) {
              existing.used_by_processes.push(sp.process.name);
            }
            return;
          }
          seenIds.add(dep.resource_id);
          allResources.push({
            resource_id: dep.resource_id,
            resource_name: dep.resource_name,
            resource_type: dep.resource_type,
            is_manual: dep.source === 'MANUAL',
            is_previously_published: false,
            test_value: undefined,
            production_value: '',
            use_test_as_production: false,
            used_by_processes: [sp.process.name],
            param_type: dep.param_type || 'TEXT',
            original_name: dep.original_name,
          });
        });
      });

      setResources(allResources);
    }
  }, [currentStep, selectedProcesses]);

  // processingStep变化
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

  // processingReleaseSubmit
  const handleSubmit = async () => {
    if (!description.trim()) {
      Toast.warning(t('release.create.validation.descriptionRequired'));
      return;
    }

    // Check未ReleaseResource's 生产值
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
      // Mock API 调use
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

  // Checkis否has填写Content
  const hasContent = useMemo(() => {
    // Checkis否select Process
    if (selectedProcesses.length > 0) return true;
    // Checkis否填写 Description
    if (description.trim()) return true;
    // Checkis否Modify ResourceConfig
    if (resources.some((r) => r.production_value || r.use_test_as_production)) return true;
    return false;
  }, [selectedProcesses, description, resources]);

  // processingCancel/Back
  const handleCancel = () => {
    if (hasContent) {
      Modal.confirm({
        title: t('release.create.exitConfirm.title'),        content: t('release.create.exitConfirm.content'),
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

        {/* Header */}
        <div className="create-release-page-header">
          <Button
            icon={<ArrowLeft size={16} strokeWidth={2} />}
            theme="borderless"
            type="tertiary"
            onClick={handleCancel}
            className="create-release-page-back-btn"
          />
          <Title heading={3} className="create-release-page-title">
            {t('release.create.title')}
          </Title>
        </div>

        {/* Step bar */}
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

        {/* Content area */}
        <div className="create-release-page-content">
          {currentStep === 0 && (
            <ProcessSelectionStep
              selectedProcesses={selectedProcesses}
              onSelectionChange={setSelectedProcesses}
            />
          )}

          {currentStep === 1 && (
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
          )}
        </div>

        {/* Operation */}
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
                disabled={selectedProcesses.length === 0}
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
