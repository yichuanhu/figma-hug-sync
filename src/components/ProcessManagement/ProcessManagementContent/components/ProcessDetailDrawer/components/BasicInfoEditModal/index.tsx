import { useMemo } from 'react';
import FormModal from '@/components/FormModal';
import { BASIC_INFO_USER_POOL, updateProcessBasicInfo } from '@/mocks/processBasicInfo';
import { Toast } from '@douyinfe/semi-ui';

export type BasicInfoEditField = 'developer_ids' | 'code_reviewer_ids';

interface BasicInfoEditModalProps {
  visible: boolean;
  field: BasicInfoEditField;
  processId: string;
  initialValue: string[];
  onClose: () => void;
}

const FIELD_TITLE: Record<BasicInfoEditField, string> = {
  developer_ids: '编辑开发工程师',
  code_reviewer_ids: '编辑代码审核员',
};

const FIELD_LABEL: Record<BasicInfoEditField, string> = {
  developer_ids: '开发工程师',
  code_reviewer_ids: '代码审核员',
};

const BasicInfoEditModal = ({
  visible,
  field,
  processId,
  initialValue,
  onClose,
}: BasicInfoEditModalProps) => {
  const options = useMemo(
    () =>
      BASIC_INFO_USER_POOL.map((u) => ({
        value: u.id,
        label: u.department ? `${u.name} · ${u.department}` : u.name,
      })),
    [],
  );

  return (
    <FormModal
      visible={visible}
      title={FIELD_TITLE[field]}
      onCancel={onClose}
      formKey={`${field}-${visible}`}
      initialValues={{ users: initialValue }}
      successMessage="保存成功"
      fields={[
        {
          type: 'select',
          field: 'users',
          label: FIELD_LABEL[field],
          placeholder: '请选择用户（可多选）',
          options,
          filter: true,
          multiple: true,
        },
      ]}
      onSubmit={async (values) => {
        const users = (values.users as string[] | undefined) || [];
        // 去重校验
        const unique = Array.from(new Set(users));
        if (unique.length !== users.length) {
          Toast.warning('不可重复选择同一用户');
          throw new Error('duplicate');
        }
        updateProcessBasicInfo(processId, { [field]: unique } as Partial<{
          developer_ids: string[];
          code_reviewer_ids: string[];
        }>);
      }}
    />
  );
};

export default BasicInfoEditModal;
