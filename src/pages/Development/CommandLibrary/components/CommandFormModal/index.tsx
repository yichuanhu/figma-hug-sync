import { useEffect, useState } from 'react';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import DepartmentSelect from '@/components/DepartmentSelect';
import OwnerSelect from '@/components/OwnerSelect';
import { COMMAND_PLATFORM_OPTIONS, type CommandItem, type CommandPlatform } from '@/mocks/commandLibrary';

interface CommandFormModalProps {
  visible: boolean;
  command: CommandItem | null;
  onCancel: () => void;
  onSubmit: (values: {
    name: string;
    owning_department_id: string;
    owner_id: string;
    platforms: CommandPlatform[];
    description: string;
  }) => void;
}

const CommandFormModal = ({ visible, command, onCancel, onSubmit }: CommandFormModalProps) => {
  const [formApi, setFormApi] = useState<FormApi | null>(null);
  const isEdit = !!command;

  useEffect(() => {
    if (!visible || !formApi) return;
    if (command) {
      formApi.setValues({
        name: command.name,
        owning_department_id: command.owning_department_id,
        owner_id: command.owner_id,
        platforms: command.platforms,
        description: command.description,
      });
    } else {
      formApi.reset();
    }
  }, [visible, command, formApi]);

  const handleOk = async () => {
    if (!formApi) return;
    try {
      const values = await formApi.validate();
      onSubmit(values as never);
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
        <Form.Slot label={{ text: '所属部门', required: true }}>
          <Form.Select
            field="owning_department_id"
            noLabel
            style={{ display: 'none' }}
          />
        </Form.Slot>
        <Form.Slot style={{ display: 'none' }} />
        <Form.Select
          field="platforms"
          label="适用平台"
          placeholder="请选择适用平台"
          multiple
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
