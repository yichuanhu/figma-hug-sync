import { useMemo } from 'react';
import FormModal from '@/components/FormModal';
import { BASIC_INFO_USER_POOL, updateProcessBasicInfo } from '@/mocks/processBasicInfo';
import { Toast } from '@douyinfe/semi-ui';

export type BasicInfoEditField = 'developer_id' | 'code_reviewer_ids';

interface BasicInfoEditModalProps {
  visible: boolean;
  field: BasicInfoEditField;
  processId: string;
  /** developer_id 时为 string | null；code_reviewer_ids 时为 string[] */
  initialValue: string | string[] | null;
  onClose: () => void;
}

const FIELD_TITLE: Record<BasicInfoEditField, string> = {
  developer_id: '编辑开发工程师',
  code_reviewer_ids: '编辑代码审核员',
};

const FIELD_LABEL: Record<BasicInfoEditField, string> = {
  developer_id: '开发工程师',
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

  const isMulti = field === 'code_reviewer_ids';

  return (
    <FormModal
      visible={visible}
      title={FIELD_TITLE[field]}
      onCancel={onClose}
      formKey={`${field}-${visible}`}
      initialValues={{ users: initialValue ?? (isMulti ? [] : undefined) }}
      successMessage="保存成功"
      fields={[
        {
          type: 'select',
          field: 'users',
          label: FIELD_LABEL[field],
          placeholder: isMulti ? '请选择用户（可多选）' : '请选择用户',
          options,
          filter: true,
          multiple: isMulti,
        },
      ]}
      onSubmit={async (values) => {
        if (isMulti) {
          const users = (values.users as string[] | undefined) || [];
          const unique = Array.from(new Set(users));
          if (unique.length !== users.length) {
            Toast.warning('不可重复选择同一用户');
            throw new Error('duplicate');
          }
          updateProcessBasicInfo(processId, { code_reviewer_ids: unique });
        } else {
          const user = (values.users as string | undefined) || null;
          updateProcessBasicInfo(processId, { developer_id: user });
        }
      }}
    />
  );
};

export default BasicInfoEditModal;
