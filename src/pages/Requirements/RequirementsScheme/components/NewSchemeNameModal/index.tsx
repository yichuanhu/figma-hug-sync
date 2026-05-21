import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';

interface Props {
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (values: { name: string; description?: string }) => Promise<void> | void;
}

const NewSchemeNameModal = ({ visible, loading, onCancel, onConfirm }: Props) => {
  const { t } = useTranslation();
  const apiRef = useRef<FormApi | null>(null);

  const handleOk = async () => {
    const api = apiRef.current;
    if (!api) return;
    try {
      const values = await api.validate();
      await onConfirm({
        name: (values.name as string).trim(),
        description: (values.description as string | undefined)?.trim() || undefined,
      });
    } catch {
      // 校验失败由 Form 自身展示
    }
  };

  return (
    <Modal
      title={t('requirements.scheme.createNew')}
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okText={t('common.create')}
      cancelText={t('common.cancel')}
      confirmLoading={loading}
      maskClosable={false}
      width={520}
      centered
      afterClose={() => apiRef.current?.reset()}
    >
      <Form
        getFormApi={(api) => { apiRef.current = api; }}
        initValues={{ name: '', description: '' }}
        labelPosition="top"
      >
        <Form.Input
          field="name"
          label={t('requirements.scheme.name') as string}
          placeholder="请输入模版名称"
          maxLength={50}
          showClear
          trigger={['blur', 'change']}
          rules={[
            { required: true, message: '请输入模版名称' },
            { max: 50, message: '名称最多 50 个字符' },
          ]}
        />
        <Form.TextArea
          field="description"
          label="描述"
          placeholder="可选：简要描述模版用途"
          maxCount={500}
          rows={3}
        />
      </Form>
    </Modal>
  );
};

export default NewSchemeNameModal;
