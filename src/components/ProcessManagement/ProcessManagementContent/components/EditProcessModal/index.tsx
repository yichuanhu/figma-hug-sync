import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast, Button, Select, Input, DatePicker, Collapse } from '@douyinfe/semi-ui';
import type { LYUpdateProcessRequest, LYProcessResponse } from '@/api';
import DepartmentSearchSelect from '@/components/DepartmentSearchSelect';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import { useCollaboratorPermission } from '@/hooks/useCollaboratorPermission';
import { getDependents, cascadeUpdateDepartment } from '@/mocks/processDependencies';
import { getDepartmentName } from '@/mocks/departmentData';
import {
  getProcessBasicInfo,
  updateProcessBasicInfo,
} from '@/mocks/processBasicInfo';
import {
  getProcessLifecycleLedger,
  adjustLifecycleMilestone,
  type LifecycleField,
} from '@/mocks/processLifecycleLedger';
import {
  fetchAllLinkableRequirements,
  type LinkableRequirementBrief,
} from '@/pages/Requirements/RequirementsProjects/mockData';
import './index.less';

interface EditProcessModalProps {
  visible: boolean;
  onCancel: () => void;
  processData: LYProcessResponse | null;
  onSuccess?: (updatedData: LYProcessResponse) => void;
}

const EditProcessModal = ({ visible, onCancel, processData, onSuccess }: EditProcessModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [owningDepartmentId, setOwningDepartmentId] = useState<string | undefined>(processData?.owning_department_id || undefined);
  const [ownerId, setOwnerId] = useState<string | undefined>(processData?.owner_id || undefined);
  const [requirementId, setRequirementId] = useState<string | undefined>(processData?.requirement_id || undefined);
  const [requirementOptions, setRequirementOptions] = useState<LinkableRequirementBrief[]>([]);
  const [requirementLoading, setRequirementLoading] = useState(false);
  const { canManage } = useCollaboratorPermission('PROCESS', processData?.id);

  // 交付信息字段
  const [os, setOs] = useState<string | undefined>(undefined);
  const [developerIds, setDeveloperIds] = useState<string[]>([]);
  const [codeReviewerIds, setCodeReviewerIds] = useState<string[]>([]);
  const [developmentCompletedAt, setDevelopmentCompletedAt] = useState<Date | null>(null);
  const [deployedAt, setDeployedAt] = useState<Date | null>(null);
  const [offlineAt, setOfflineAt] = useState<Date | null>(null);
  // 保留原始生命周期值用于判断"是否变更"
  const initialLifecycleRef = useState<{ development_completed_at: string | null; deployed_at: string | null; offline_at: string | null }>({
    development_completed_at: null,
    deployed_at: null,
    offline_at: null,
  })[0];

  const existingProcessNames = ['订单自动处理流程', '财务报销审批流程', '人事入职流程'];

  // 打开时同步初始值
  useEffect(() => {
    if (visible && processData) {
      setOwningDepartmentId(processData.owning_department_id || undefined);
      setOwnerId(processData.owner_id || undefined);
      setRequirementId(processData.requirement_id || undefined);
      setOs(processData.os || undefined);

      // 加载交付信息初始值
      const basicInfo = getProcessBasicInfo(processData.id);
      setDeveloperIds(basicInfo.developer_ids || []);
      setCodeReviewerIds(basicInfo.code_reviewer_ids || []);

      const ledger = getProcessLifecycleLedger(processData.id);
      const toDate = (iso: string | null) => (iso ? new Date(iso) : null);
      setDevelopmentCompletedAt(toDate(ledger.development_completed_at.effective_at));
      setDeployedAt(toDate(ledger.deployed_at.effective_at));
      setOfflineAt(toDate(ledger.offline_at.effective_at));
      initialLifecycleRef.development_completed_at = ledger.development_completed_at.effective_at;
      initialLifecycleRef.deployed_at = ledger.deployed_at.effective_at;
      initialLifecycleRef.offline_at = ledger.offline_at.effective_at;
    }
  }, [visible, processData, initialLifecycleRef]);

  // 加载可关联需求
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

  const selectedRequirement = useMemo(
    () => requirementOptions.find((r) => r.id === requirementId),
    [requirementOptions, requirementId],
  );
  const hasRequirement = !!selectedRequirement;

  // 关联需求变更时联动覆盖部门/归属者
  const prevReqIdRef = useState<string | undefined>(processData?.requirement_id || undefined)[0];
  useEffect(() => {
    if (!visible) return;
    if (selectedRequirement) {
      setOwningDepartmentId(selectedRequirement.owning_department_id);
      setOwnerId(selectedRequirement.owner_id ?? undefined);
    }
    // 取消关联（requirementId 由有变无）时不强制清空，保留用户当前手动值
  }, [selectedRequirement, visible]);

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
    if (value === processData?.name) {
      callback();
      return true;
    }
    if (value && existingProcessNames.includes(value.trim())) {
      callback(t('development.processDevelopment.createModal.validation.nameExists'));
      return false;
    }
    callback();
    return true;
  };

  const performSubmit = async (values: Record<string, unknown>, finalDeptId: string | undefined) => {
    if (!processData?.id) return;
    setLoading(true);
    try {
      const finalDeptName = finalDeptId ? getDepartmentName(finalDeptId) : processData.owning_department_name;

      const updateRequest: LYUpdateProcessRequest = {
        name: values.name as string,
        description: (values.description as string) || undefined,
      };

      await new Promise((resolve) => setTimeout(resolve, 300));

      const deptChanged = finalDeptId !== processData.owning_department_id;
      let cascadedTotal = 0;
      if (deptChanged && finalDeptId) {
        const result = cascadeUpdateDepartment(processData.id, finalDeptId, finalDeptName || finalDeptId);
        cascadedTotal = result.total;
      }

      // 写入交付信息：开发工程师 / 代码审核员
      updateProcessBasicInfo(processData.id, {
        developer_ids: Array.from(new Set(developerIds)),
        code_reviewer_ids: Array.from(new Set(codeReviewerIds)),
      });

      // 写入生命周期时间（仅对发生变更的字段调用 adjust）
      const pad = (n: number) => String(n).padStart(2, '0');
      const toIso = (d: Date | null): string | null => {
        if (!d) return null;
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
      };
      const lifecyclePairs: Array<[LifecycleField, Date | null, string | null]> = [
        ['development_completed_at', developmentCompletedAt, initialLifecycleRef.development_completed_at],
        ['deployed_at', deployedAt, initialLifecycleRef.deployed_at],
        ['offline_at', offlineAt, initialLifecycleRef.offline_at],
      ];
      lifecyclePairs.forEach(([field, current, original]) => {
        const newIso = toIso(current);
        if (newIso && newIso !== original) {
          try {
            adjustLifecycleMilestone(processData.id, field, {
              new_effective_at: newIso,
              reason: '统一编辑',
              backfill: true,
            });
          } catch (e) {
            console.error('生命周期修正失败:', field, e);
          }
        }
      });

      const updatedProcess: LYProcessResponse = {
        ...processData,
        name: updateRequest.name || processData.name,
        description: updateRequest.description || processData.description,
        owning_department_id: finalDeptId ?? processData.owning_department_id,
        owning_department_name: finalDeptName ?? processData.owning_department_name,
        owner_id: ownerId ?? processData.owner_id,
        owner_name: hasRequirement ? (selectedRequirement!.owner_name ?? processData.owner_name) : processData.owner_name,
        requirement_id: requirementId ?? null,
        os: os ?? null,
        updated_at: new Date().toISOString(),
      };

      Toast.success(t('development.processDevelopment.editModal.success'));
      if (cascadedTotal > 0) {
        Toast.info(t('development.processDevelopment.editModal.cascadeSuccess', { total: cascadedTotal }));
      }
      onSuccess?.(updatedProcess);
      onCancel();
    } catch (error) {
      console.error('更新流程失败:', error);
      Toast.error(t('development.processDevelopment.editModal.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!processData?.id) return;
    if (!owningDepartmentId) {
      Toast.warning(t('common.owningDepartmentRequired'));
      return;
    }
    if (!ownerId) {
      Toast.warning(t('common.ownerRequired'));
      return;
    }

    const deptChanged = owningDepartmentId !== processData.owning_department_id;
    if (deptChanged) {
      const dependents = getDependents(processData.id);
      if (dependents.total > 0) {
        Modal.confirm({
          title: t('development.processDevelopment.editModal.cascadeConfirm.title'),
          content: t('development.processDevelopment.editModal.cascadeConfirm.content', {
            total: dependents.total,
            triggers: dependents.triggers.length,
            tasks: dependents.tasks.length,
            templates: dependents.templates.length,
          }),
          okText: t('development.processDevelopment.editModal.cascadeConfirm.ok'),
          cancelText: t('development.processDevelopment.editModal.cascadeConfirm.cancel'),
          onOk: () => performSubmit(values, owningDepartmentId),
        });
        return;
      }
    }
    performSubmit(values, owningDepartmentId);
  };

  return (
    <Modal
      title={t('development.processDevelopment.editModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={520}
      closeOnEsc
      maskClosable={false}
    >
      <Form
        onSubmit={handleSubmit}
        labelPosition="top"
        className="edit-process-modal-form"
        initValues={{
          name: processData?.name || '',
          description: processData?.description || '',
        }}
        key={processData?.id}
      >
        <div className="edit-process-modal-content">
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
            disabled={!canManage || (requirementOptions.length === 0 && !requirementLoading)}
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
              value={selectedRequirement!.owning_department_name}
              disabled
              placeholder={t('development.processDevelopment.createModal.fields.autoFillPlaceholder')}
            />
          ) : (
            <DepartmentSearchSelect
              value={owningDepartmentId}
              onChange={setOwningDepartmentId}
              disabled={!canManage}
            />
          )}
        </Form.Slot>

        <Form.Slot label={{ text: t('common.owner'), required: true }}>
          {hasRequirement ? (
            <Input
              value={selectedRequirement!.owner_name ?? ''}
              disabled
              placeholder={t('development.processDevelopment.createModal.fields.autoFillPlaceholder')}
            />
          ) : (
            <OwnerSearchSelect value={ownerId} onChange={setOwnerId} disabled={!canManage} />
          )}
        </Form.Slot>

        <Form.Slot label={{ text: t('development.processDevelopment.createModal.fields.osLabel') }}>
          <Select
            value={os}
            onChange={(v) => setOs(v as string | undefined)}
            placeholder={t('development.processDevelopment.createModal.fields.osPlaceholder')}
            showClear
            disabled={!canManage}
            style={{ width: '100%' }}
            optionList={[
              { value: 'Windows', label: 'Windows' },
              { value: 'Linux', label: 'Linux' },
              { value: 'macOS', label: 'macOS' },
            ]}
          />
        </Form.Slot>


        <div className="edit-process-modal-section">
          <div className="edit-process-modal-section-title">
            <span className="edit-process-modal-section-title-line" />
            <span>交付信息</span>
          </div>
        </div>

        <Form.Slot label={{ text: '开发工程师' }}>
          <OwnerSearchSelect
            multiple
            value={developerIds}
            onChange={(v: string[]) => setDeveloperIds(v || [])}
            placeholder="请选择开发工程师（可多选）"
          />
        </Form.Slot>

        <Form.Slot label={{ text: '代码审核员' }}>
          <OwnerSearchSelect
            multiple
            value={codeReviewerIds}
            onChange={(v: string[]) => setCodeReviewerIds(v || [])}
            placeholder="请选择代码审核员（可多选）"
          />
        </Form.Slot>

        <Form.Slot label={{ text: '开发完成时间' }}>
          <DatePicker
            type="dateTime"
            format="yyyy-MM-dd HH:mm"
            value={developmentCompletedAt ?? undefined}
            onChange={(v) => setDevelopmentCompletedAt((v as Date) ?? null)}
            style={{ width: '100%' }}
            placeholder="请选择开发完成时间"
          />
        </Form.Slot>

        <Form.Slot label={{ text: '部署上线时间' }}>
          <DatePicker
            type="dateTime"
            format="yyyy-MM-dd HH:mm"
            value={deployedAt ?? undefined}
            onChange={(v) => setDeployedAt((v as Date) ?? null)}
            style={{ width: '100%' }}
            placeholder="请选择部署上线时间"
          />
        </Form.Slot>

        <Form.Slot label={{ text: '流程下线时间' }}>
          <DatePicker
            type="dateTime"
            format="yyyy-MM-dd HH:mm"
            value={offlineAt ?? undefined}
            onChange={(v) => setOfflineAt((v as Date) ?? null)}
            style={{ width: '100%' }}
            placeholder="请选择流程下线时间"
          />
        </Form.Slot>
        </div>

        <div className="edit-process-modal-footer">

          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.save')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditProcessModal;
