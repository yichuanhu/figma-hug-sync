import { useMemo } from 'react';
import FormModal from '@/components/FormModal';
import { BASIC_INFO_USER_POOL, updateProcessBasicInfo } from '@/mocks/processBasicInfo';

export type BasicInfoEditField = 'developer_id' | 'code_reviewer_id';

interface BasicInfoEditModalProps {
  visible: boolean;
  field: BasicInfoEditField;
  processId: string;
  initialValue: string | null;
  onClose: () => void;
}

const FIELD_TITLE: Record<BasicInfoEditField, string> = {
  developer_id: '编辑开发工程师',
  code_reviewer_id: '编辑代码审核员',
};

const FIELD_LABEL: Record<BasicInfoEditField, string> = {
  developer_id: '开发工程师',
  code_reviewer_id: '代码审核员',
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
      initialValues={{ users: initialValue ?? undefined }}
      successMessage="保存成功"
      fields={[
        {
          type: 'select',
          field: 'users',
          label: FIELD_LABEL[field],
          placeholder: '请选择用户',
          options,
          filter: true,
        },
      ]}
      onSubmit={async (values) => {
        const user = (values.users as string | undefined) || null;
        if (field === 'developer_id') {
          updateProcessBasicInfo(processId, { developer_id: user });
        } else {
          updateProcessBasicInfo(processId, { code_reviewer_id: user });
        }
      }}
    />
  );
};

export default BasicInfoEditModal;
