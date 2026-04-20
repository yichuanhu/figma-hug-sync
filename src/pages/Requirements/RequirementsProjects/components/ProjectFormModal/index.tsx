import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast, Typography } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import type { Project } from '../../types';
import {
  addProject,
  updateProject,
  addWorkspace,
  linkRequirements,
  fetchUnlinkedRequirements,
  type LinkableRequirementBrief,
} from '../../mockData';

interface Props {
  visible: boolean;
  initialData?: Project | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  name: string;
  dateRange?: [Date | string, Date | string];
  description?: string;
  linkedRequirementIds?: string[];
}

const ProjectFormModal = ({ visible, initialData, onClose, onSuccess }: Props) => {
  const { t } = useTranslation();
  const formApiRef = useRef<FormApi | null>(null);
  const isEdit = !!initialData;
  const [candidateReqs, setCandidateReqs] = useState<LinkableRequirementBrief[]>([]);

  useEffect(() => {
    if (visible && formApiRef.current) {
      formApiRef.current.reset();
      if (initialData) {
        formApiRef.current.setValues({
          name: initialData.name,
          dateRange:
            initialData.startDate && initialData.endDate
              ? [initialData.startDate, initialData.endDate]
              : undefined,
          description: initialData.description,
        });
      }
    }
    if (visible && !isEdit) {
      fetchUnlinkedRequirements().then(setCandidateReqs);
    }
  }, [visible, initialData, isEdit]);

  const handleOk = async () => {
    if (!formApiRef.current) return;
    try {
      const values = (await formApiRef.current.validate()) as FormValues;
      const startDate = values.dateRange?.[0]
        ? new Date(values.dateRange[0]).toISOString().slice(0, 10)
        : undefined;
      const endDate = values.dateRange?.[1]
        ? new Date(values.dateRange[1]).toISOString().slice(0, 10)
        : undefined;
      if (initialData) {
        await updateProject(initialData.id, {
          name: values.name,
          startDate,
          endDate,
          description: values.description,
        });
        Toast.success(t('common.editSuccess'));
      } else {
        const created = await addProject({
          name: values.name,
          startDate,
          endDate,
          description: values.description,
        });
        // 自动按部门建工作空间 + 关联需求
        const selectedIds = values.linkedRequirementIds ?? [];
        let createdWsCount = 0;
        if (selectedIds.length > 0) {
          const selectedReqs = candidateReqs.filter((r) => selectedIds.includes(r.id));
          const groups = new Map<string, { deptName: string; reqIds: string[] }>();
          selectedReqs.forEach((r) => {
            const g = groups.get(r.owning_department_id);
            if (g) g.reqIds.push(r.id);
            else groups.set(r.owning_department_id, { deptName: r.owning_department_name, reqIds: [r.id] });
          });
          for (const [deptId, { deptName, reqIds }] of groups) {
            try {
              const ws = await addWorkspace({
                projectId: created.id,
                name: t('requirements.projects.autoWorkspaceNamePattern', { project: values.name, dept: deptName }),
                departmentId: deptId,
                departmentName: deptName,
                description: '',
              });
              await linkRequirements(ws.id, reqIds);
              createdWsCount += 1;
            } catch (e) {
              // 忽略单个工作空间失败，继续后续
              console.error('auto workspace create failed', e);
            }
          }
        }
        if (createdWsCount > 0) {
          Toast.success(t('requirements.projects.autoWorkspaceCreated', { count: createdWsCount }));
        } else {
          Toast.success(t('common.createSuccess'));
        }
      }
      onSuccess();
      onClose();
    } catch {
      // validate fail
    }
  };

  return (
    <Modal
      title={initialData ? t('requirements.projects.editProject') : t('requirements.projects.createProject')}
      visible={visible}
      onCancel={onClose}
      onOk={handleOk}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      width={520}
      centered
      maskClosable={false}
    >
      <Form
        getFormApi={(api) => (formApiRef.current = api)}
        labelPosition="top"
        style={{ paddingTop: 8 }}
      >
        <Form.Input
          field="name"
          label={t('requirements.projects.fields.name')}
          placeholder={t('requirements.projects.placeholders.name')}
          maxLength={80}
          showClear
          rules={[
            { required: true, message: t('requirements.projects.validation.nameRequired') },
            { max: 80, message: t('requirements.projects.validation.nameMax') },
          ]}
          trigger={['blur', 'change']}
        />
        <Form.DatePicker
          field="dateRange"
          type="dateRange"
          label={t('requirements.projects.fields.dateRange')}
          style={{ width: '100%' }}
        />
        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('requirements.projects.placeholders.description')}
          maxCount={2000}
          showClear
          autosize={{ minRows: 3, maxRows: 6 }}
          rules={[{ max: 2000, message: t('requirements.projects.validation.descMax') }]}
          trigger={['blur', 'change']}
        />
        {!isEdit && (
          <>
            <Form.Select
              field="linkedRequirementIds"
              label={t('requirements.projects.linkedRequirementsOptional')}
              placeholder={t('requirements.projects.linkedRequirementsPlaceholder')}
              multiple
              filter
              showClear
              style={{ width: '100%' }}
              optionList={candidateReqs.map((r) => ({
                value: r.id,
                label: `${r.req_no ? `[${r.req_no}] ` : ''}${r.title} · ${r.owning_department_name}`,
              }))}
            />
            <Typography.Text type="tertiary" size="small" style={{ display: 'block', marginTop: -8 }}>
              {t('requirements.projects.autoCreateWorkspaceTip')}
            </Typography.Text>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default ProjectFormModal;
