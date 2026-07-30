import { useEffect, useState } from 'react';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import DepartmentSelect from '@/components/DepartmentSelect';
import OwnerSelect from '@/components/OwnerSelect';
import { COMMAND_PLATFORM_OPTIONS, type CommandItem, type CommandPlatform } from '@/mocks/commandLibrary';

export interface CommandFormValues {
  name: string;
  owning_department_id: string;
  owner_id: string;
  platforms: CommandPlatform[];
  description: string;
}

interface CommandFormModalProps {
  visible: boolean;
  command: CommandItem | null;
  onCancel: () => void;
  onSubmit: (values: CommandFormValues) => void;
}

const CommandFormModal = ({ visible, command, onCancel, onSubmit }: CommandFormModalProps) => {
  const [formApi, setFormApi] = useState<FormApi | null>(null);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [ownerId, setOwnerId] = useState<string>('');
  const [deptError, setDeptError] = useState('');
  const isEdit = !!command;

  useEffect(() => {
    if (!visible || !formApi) return;
    setDeptError('');
    if (command) {
      setDepartmentId(command.owning_department_id);
      setOwnerId(command.owner_id);
      formApi.setValues({
        name: command.name,
        platforms: command.platforms,
        description: command.description,
      });
    } else {
      setDepartmentId('');
      setOwnerId('');
      formApi.reset();
    }
  }, [visible, command, formApi]);

  const handleOk = async () => {
    if (!formApi) return;
    if (!departmentId) {
      setDeptError('请选择所属部门');
      return;
    }
    try {
      const values = (await formApi.validate()) as Omit<CommandFormValues, 'owning_department_id' | 'owner_id'>;
      onSubmit({ ...values, owning_department_id: departmentId, owner_id: ownerId });
      Toast.success(isEdit ? '命令已更新' : '命令已创建');
      onCancel();
    } catch {
      /* 校验失败由表单自身提示 */
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑命令' : '新建命令'}
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
      cancelText="取消"
      width={520}
      centered
    >
      <Form getFormApi={setFormApi} labelPosition="top">
        <Form.Input
          field="name"
          label="命令名称"
          placeholder="请输入命令名称"
          maxLength={100}
          showClear
          trigger={['blur', 'change']}
          rules={[{ required: true, message: '请输入命令名称' }]}
        />

        <Form.Slot label={{ text: '所属部门', required: true }} error={deptError ? { error: deptError } : undefined}>
          <DepartmentSelect
            value={departmentId}
            onChange={(val) => {
              setDepartmentId(val);
              setDeptError('');
            }}
            placeholder="请选择所属部门"
            style={{ width: '100%' }}
            showClear
          />
        </Form.Slot>

        <Form.Slot label={{ text: '创建者' }}>
          <OwnerSelect value={ownerId} onChange={setOwnerId} placeholder="请选择创建者" style={{ width: '100%' }} />
        </Form.Slot>

        <Form.Select
          field="platforms"
          label="适用平台"
          placeholder="请选择适用平台"
          multiple
          style={{ width: '100%' }}
          trigger={['blur', 'change']}
          rules={[{ required: true, message: '请选择适用平台' }]}
          optionList={COMMAND_PLATFORM_OPTIONS.map((p) => ({ value: p, label: p }))}
        />

        <Form.TextArea
          field="description"
          label="描述"
          placeholder="请输入命令描述"
          maxCount={2000}
          autosize={{ minRows: 3, maxRows: 6 }}
        />
      </Form>
    </Modal>
  );
};

export default CommandFormModal;
