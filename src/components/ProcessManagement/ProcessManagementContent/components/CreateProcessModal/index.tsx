import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast, Button, Select, Input, Typography } from '@douyinfe/semi-ui';
import type { LYCreateProcessRequest, LYProcessResponse } from '@/api';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import {
  fetchAllLinkableRequirements,
  type LinkableRequirementBrief,
} from '@/pages/Requirements/RequirementsProjects/mockData';
import './index.less';

const { Text } = Typography;

// 生成UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateMockLYProcessResponse = (
  request: LYCreateProcessRequest,
  brief: LinkableRequirementBrief,
): LYProcessResponse => {
  const nowIso = new Date().toISOString();
  return {
    id: generateUUID(),
    name: request.name,
    description: request.description || null,
    language: 'Python',
    process_type: 'RPA',
    timeout: 60,
    status: 'DEVELOPING',
    current_version_id: null,
    creator_id: MOCK_CURRENT_USER.id,
    requirement_id: brief.id,
    created_at: nowIso,
    updated_at: nowIso,
    owning_department_id: brief.owning_department_id,
    owning_department_name: brief.owning_department_name,
    owner_id: brief.owner_id ?? MOCK_CURRENT_USER.id,
    owner_name: brief.owner_name ?? MOCK_CURRENT_USER.name,
  };
};

interface CreateProcessModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: (processData: LYProcessResponse) => void;
}

const CreateProcessModal = ({ visible, onCancel, onSuccess }: CreateProcessModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [requirementId, setRequirementId] = useState<string | undefined>(undefined);
  const [requirementOptions, setRequirementOptions] = useState<LinkableRequirementBrief[]>([]);
  const [requirementLoading, setRequirementLoading] = useState(false);

  const existingProcessNames = ['订单自动处理流程', '财务报销审批流程', '人事入职流程'];

  // 加载所有可关联需求
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setRequirementLoading(true);
    fetchAllLinkableRequirements()
      .then((list) => {
        if (!cancelled) setRequirementOptions(list);
      })
      .finally(() => {
        if (!cancelled) setRequirementLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  // 关闭时重置
  useEffect(() => {
    if (!visible) {
      setRequirementId(undefined);
    }
  }, [visible]);

  const selectedRequirement = useMemo(
    () => requirementOptions.find((r) => r.id === requirementId),
    [requirementOptions, requirementId],
  );

  const validateProcessNameFormat = (rule: unknown, value: string, callback: (error?: string) => void) => {
    if (!value) {
      callback();
      return true;
    }
    const namePattern = /^[^\d][a-zA-Z0-9\u4e00-\u9fa5_]*$/;
    if (!namePattern.test(value.trim())) {
      callback(t('development.processDevelopment.createModal.validation.nameFormatError'));
      return false;
    }
    callback();
    return true;
  };

  const validateProcessNameUnique = (rule: unknown, value: string, callback: (error?: string) => void) => {
    if (value && existingProcessNames.includes(value.trim())) {
      callback(t('development.processDevelopment.createModal.validation.nameExists'));
      return false;
    }
    callback();
    return true;
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      if (!selectedRequirement) {
        Toast.warning(
          t('development.processDevelopment.createModal.validation.requirementRequired'),
        );
        setLoading(false);
        return;
      }

      const createRequest: LYCreateProcessRequest = {
        name: values.name as string,
        description: (values.description as string) || undefined,
        owning_department_id: selectedRequirement.owning_department_id,
        requirement_id: selectedRequirement.id,
      };

      await new Promise((resolve) => setTimeout(resolve, 300));

      const mockResponse = generateMockLYProcessResponse(createRequest, selectedRequirement);

      Toast.success(t('development.processDevelopment.createModal.success'));
      onCancel();
      onSuccess?.(mockResponse);
    } catch (error) {
      console.error('创建流程失败:', error);
      Toast.error(t('development.processDevelopment.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('development.processDevelopment.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={520}
      closeOnEsc
      maskClosable={false}
    >
      <Form onSubmit={handleSubmit} labelPosition="top" className="create-process-modal-form">
        <Form.Input
          field="name"
          label={t('development.processDevelopment.fields.processName')}
          placeholder={t('development.processDevelopment.createModal.fields.namePlaceholder')}
          trigger={['blur', 'change']}
          rules={[
            { required: true, message: t('development.processDevelopment.createModal.validation.nameRequired') },
            { max: 100, message: t('development.processDevelopment.createModal.validation.nameLengthError') },
            { validator: validateProcessNameFormat },
            { validator: validateProcessNameUnique },
          ]}
          showClear
        />

        <Form.Slot
          label={{
            text: t('development.processDevelopment.createModal.fields.requirementLabel'),
            required: true,
          }}
        >
          <Select
            value={requirementId}
            onChange={(v) => setRequirementId(v as string | undefined)}
            placeholder={
              requirementLoading
                ? t('common.loading')
                : requirementOptions.length === 0
                  ? t('development.processDevelopment.createModal.fields.requirementGlobalEmpty')
                  : t('development.processDevelopment.createModal.fields.requirementPlaceholder')
            }
            disabled={requirementOptions.length === 0 && !requirementLoading}
            loading={requirementLoading}
            showClear
            filter
            style={{ width: '100%' }}
            optionList={requirementOptions.map((r) => ({
              value: r.id,
              label: r.req_no ? `[${r.req_no}] ${r.title}` : r.title,
            }))}
          />
          <Text type="tertiary" size="small" style={{ marginTop: 4, display: 'block' }}>
            {t('development.processDevelopment.createModal.fields.requirementAutoFillHelp')}
          </Text>
        </Form.Slot>

        <Form.Slot label={{ text: t('common.owningDepartment'), required: true }}>
          <Input
            value={selectedRequirement?.owning_department_name ?? ''}
            disabled
            placeholder={t('development.processDevelopment.createModal.fields.autoFillPlaceholder')}
          />
        </Form.Slot>

        <Form.Slot label={{ text: t('workspaceSelect.label'), required: true }}>
          <Input
            value={
              selectedRequirement
                ? `${selectedRequirement.projectName} / ${selectedRequirement.workspaceName}`
                : ''
            }
            disabled
            placeholder={t('development.processDevelopment.createModal.fields.autoFillPlaceholder')}
          />
        </Form.Slot>

        <Form.Slot label={{ text: t('common.owner'), required: true }}>
          <Input
            value={selectedRequirement?.owner_name ?? ''}
            disabled
            placeholder={t('development.processDevelopment.createModal.fields.autoFillPlaceholder')}
          />
        </Form.Slot>

        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('development.processDevelopment.createModal.fields.descriptionPlaceholder')}
          autosize={{ minRows: 3, maxRows: 6 }}
          maxCount={2000}
          trigger={['blur', 'change']}
          rules={[
            { max: 2000, message: t('development.processDevelopment.createModal.validation.descriptionLengthError') },
          ]}
        />

        <div className="create-process-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading} disabled={!selectedRequirement}>
            {t('common.create')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateProcessModal;
