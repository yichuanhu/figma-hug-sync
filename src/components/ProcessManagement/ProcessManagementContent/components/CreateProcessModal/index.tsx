import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast, Button, Select, Input } from '@douyinfe/semi-ui';
import type { LYCreateProcessRequest, LYProcessResponse } from '@/api';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import {
  fetchAllLinkableRequirements,
  type LinkableRequirementBrief,
} from '@/pages/Requirements/RequirementsProjects/mockData';
import DepartmentSearchSelect from '@/components/DepartmentSearchSelect';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import './index.less';

// 生成UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface BuildContext {
  owningDepartmentId: string;
  owningDepartmentName: string;
  ownerId: string;
  ownerName: string;
  requirement?: LinkableRequirementBrief;
}

const generateMockLYProcessResponse = (
  request: LYCreateProcessRequest,
  ctx: BuildContext,
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
    requirement_id: ctx.requirement?.id ?? null,
    created_at: nowIso,
    updated_at: nowIso,
    owning_department_id: ctx.owningDepartmentId,
    owning_department_name: ctx.owningDepartmentName,
    owner_id: ctx.ownerId,
    owner_name: ctx.ownerName,
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

  // 手动选择的归属部门 / 归属者（仅在未关联需求时使用）
  const [manualDepartmentId, setManualDepartmentId] = useState<string | undefined>(undefined);
  const [manualOwnerId, setManualOwnerId] = useState<string | undefined>(undefined);

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
      setManualDepartmentId(undefined);
      setManualOwnerId(undefined);
    }
  }, [visible]);

  const selectedRequirement = useMemo(
    () => requirementOptions.find((r) => r.id === requirementId),
    [requirementOptions, requirementId],
  );

  const hasRequirement = !!selectedRequirement;

  // 关联需求变更时联动清空手动选择
  useEffect(() => {
    if (selectedRequirement) {
      setManualDepartmentId(undefined);
      setManualOwnerId(undefined);
    }
  }, [selectedRequirement]);

  const effectiveDepartmentId = hasRequirement
    ? selectedRequirement!.owning_department_id
    : manualDepartmentId;
  const effectiveDepartmentName = hasRequirement
    ? selectedRequirement!.owning_department_name
    : '';
  const effectiveOwnerId = hasRequirement ? selectedRequirement!.owner_id : manualOwnerId;
  const effectiveOwnerName = hasRequirement ? (selectedRequirement!.owner_name ?? '') : '';

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
    if (!effectiveDepartmentId) {
      Toast.warning(t('common.owningDepartmentRequired'));
      return;
    }
    if (!effectiveOwnerId) {
      Toast.warning(t('common.ownerRequired'));
      return;
    }

    setLoading(true);
    try {
      const createRequest: LYCreateProcessRequest = {
        name: values.name as string,
        description: (values.description as string) || undefined,
        owning_department_id: effectiveDepartmentId,
        requirement_id: selectedRequirement?.id,
      };

      await new Promise((resolve) => setTimeout(resolve, 300));

      const mockResponse = generateMockLYProcessResponse(createRequest, {
        owningDepartmentId: effectiveDepartmentId,
        owningDepartmentName: effectiveDepartmentName,
        ownerId: effectiveOwnerId,
        ownerName: effectiveOwnerName || MOCK_CURRENT_USER.name,
        requirement: selectedRequirement,
      });

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

        <Form.Slot
          label={{ text: t('development.processDevelopment.createModal.fields.requirementLabel') }}
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
        </Form.Slot>

        <Form.Slot label={{ text: t('common.owningDepartment'), required: true }}>
          {hasRequirement ? (
            <Input
              value={effectiveDepartmentName}
              disabled
              placeholder={t('development.processDevelopment.createModal.fields.autoFillPlaceholder')}
            />
          ) : (
            <DepartmentSearchSelect
              value={manualDepartmentId}
              onChange={(v) => setManualDepartmentId(v)}
              placeholder={t('common.owningDepartmentRequired')}
              style={{ width: '100%' }}
            />
          )}
        </Form.Slot>

        <Form.Slot label={{ text: t('common.owner'), required: true }}>
          {hasRequirement ? (
            <Input
              value={effectiveOwnerName}
              disabled
              placeholder={t('development.processDevelopment.createModal.fields.autoFillPlaceholder')}
            />
          ) : (
            <OwnerSearchSelect
              value={manualOwnerId}
              onChange={(v) => setManualOwnerId(v)}
              placeholder={t('common.ownerRequired')}
              style={{ width: '100%' }}
            />
          )}
        </Form.Slot>

        <div className="create-process-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.create')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateProcessModal;
