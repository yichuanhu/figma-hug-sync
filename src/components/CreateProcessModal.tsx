import { useState } from 'react';
import { 
  Modal, 
  Form, 
  Toast,
  Button
} from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';

interface ProcessData {
  id: string;
  name: string;
  description: string;
  status: string;
  organization: string;
  creator: string;
  createdAt: string;
}

interface CreateProcessModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: (processData: ProcessData) => void;
}

const CreateProcessModal = ({ visible, onCancel, onSuccess }: CreateProcessModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 生成流程ID
  const generateProcessId = () => {
    const year = new Date().getFullYear();
    const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `PROC-${year}-${randomNum}`;
  };

  // 模拟已存在的流程名称列表（实际应从API获取）
  const existingProcessNames = [
    '订单自动处理流程',
    '财务报销审批流程',
    '人事入职流程',
  ];

  // 检查流程名称是否唯一
  const validateProcessNameUnique = (
    rule: unknown, 
    value: string, 
    callback: (error?: string) => void
  ) => {
    if (value && existingProcessNames.includes(value.trim())) {
      callback('流程名称已存在，请使用其他名称');
      return false;
    }
    callback();
    return true;
  };

  // 关联需求选项
  const requirementOptions = [
    { value: 'REQ-2024-001', label: 'REQ-2024-001 - 订单自动处理需求' },
    { value: 'REQ-2024-002', label: 'REQ-2024-002 - 财务报销自动化' },
    { value: 'REQ-2024-003', label: 'REQ-2024-003 - 人事审批流程优化' },
  ];

  // 归属组织选项
  const organizationOptions = [
    { value: '财务部', label: '财务部' },
    { value: '人事部', label: '人事部' },
    { value: '技术部', label: '技术部' },
    { value: '运营部', label: '运营部' },
  ];

  // 流程类型选项
  const processTypeOptions = [
    { value: '原生流程', label: '原生流程' },
  ];

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const processId = generateProcessId();
      const now = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const processData = {
        id: processId,
        name: values.name as string,
        description: values.description as string,
        type: values.type as string,
        relatedRequirement: values.relatedRequirement as string,
        organization: values.organization as string,
        status: '草稿',
        creator: '当前用户', // 实际应从用户上下文获取
        createdAt: now,
      };

      Toast.success('流程创建成功！');
      onCancel();
      onSuccess?.(processData);
    } catch (error) {
      Toast.error('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="新建流程"
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
        style={{ paddingTop: 4 }}
      >
        <Form.Input
          field="name"
          label="流程名称"
          placeholder="请输入流程名称"
          rules={[
            { required: true, message: '请输入流程名称' },
            { min: 1, message: '流程名称长度必须在1-100字符之间' },
            { max: 100, message: '流程名称长度必须在1-100字符之间' },
            { validator: validateProcessNameUnique },
          ]}
        />
        
        <Form.TextArea
          field="description"
          label="流程描述"
          placeholder="请输入流程描述，例如：自动处理电商平台的订单，包括订单验证、库存检查、发货通知"
          autosize={{ minRows: 3, maxRows: 6 }}
          maxCount={500}
          rules={[
            { required: true, message: '请输入流程描述' },
            { min: 1, message: '流程描述长度必须在1-500字符之间' },
            { max: 500, message: '流程描述长度必须在1-500字符之间' },
          ]}
        />

        <Form.Select
          field="type"
          label="流程类型"
          placeholder="请选择流程类型"
          initValue="原生流程"
          optionList={processTypeOptions}
          rules={[{ required: true, message: '请选择流程类型' }]}
          style={{ width: '100%' }}
        />

        <Form.Select
          field="relatedRequirement"
          label="关联需求"
          placeholder="请选择"
          optionList={requirementOptions}
          showClear
          style={{ width: '100%' }}
        />

        <Form.Select
          field="organization"
          label="归属组织"
          placeholder="请选择"
          optionList={organizationOptions}
          rules={[{ required: true, message: '请选择归属组织' }]}
          style={{ width: '100%' }}
        />

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 12, 
          marginTop: 12,
          paddingTop: 16,
          paddingBottom: 12,
          borderTop: '1px solid var(--semi-color-border)'
        }}>
          <Button theme="light" onClick={onCancel}>
            取消
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            创建
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateProcessModal;
