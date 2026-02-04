import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Modal, 
  Form, 
  Toast,
  Typography,
  Button,
} from '@douyinfe/semi-ui';
import type { LYQueueMessageResponse, QueueMessagePriority } from '@/api/index';

import './index.less';

interface RequeueMessageModalProps {
  visible: boolean;
  message: LYQueueMessageResponse | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const RequeueMessageModal = ({
  visible,
  message,
  onCancel,
  onSuccess,
}: RequeueMessageModalProps) => {
  const { t } = useTranslation();
  const { Text } = Typography;
  const [loading, setLoading] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);

  // 初始化表单值
  useEffect(() => {
    if (visible && message && formApi) {
      formApi.setValues({
        content: message.content,
        priority: message.priority,
        effectiveTime: new Date(),
        expiryTime: message.expiry_time ? new Date(message.expiry_time) : null,
      });
    }
  }, [visible, message, formApi]);

  // 自定义失效时间验证
  const validateExpiryTime = (value: Date | null, values: Record<string, unknown>) => {
    if (value && values.effectiveTime && value <= (values.effectiveTime as Date)) {
      return t('queueMessage.requeueModal.validation.expiryTimeInvalid');
    }
    return '';
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      Toast.success(t('queueMessage.requeueModal.success'));
      onSuccess();
    } catch {
      Toast.error(t('queueMessage.requeueModal.error'));
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'HIGH', label: t('queueMessage.priority.high') },
    { value: 'MEDIUM', label: t('queueMessage.priority.medium') },
    { value: 'LOW', label: t('queueMessage.priority.low') },
  ];

  return (
    <Modal
      title={t('queueMessage.requeueModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      className="requeue-message-modal"
      width={560}
    >
      <div className="requeue-message-modal-content">
        <Text type="tertiary" className="requeue-message-modal-tip">
          {t('queueMessage.requeueModal.description')}
        </Text>
        
        <Form 
          labelPosition="top" 
          className="requeue-message-modal-form"
          getFormApi={setFormApi}
          onSubmit={handleSubmit}
        >
          <Form.TextArea
            field="content"
            label={t('queueMessage.fields.content')}
            placeholder={t('queueMessage.fields.contentPlaceholder')}
            maxCount={4000}
            showClear
            autosize={{ minRows: 4, maxRows: 8 }}
            rules={[
              { required: true, message: t('queueMessage.requeueModal.validation.contentRequired') },
              { max: 4000, message: t('queueMessage.requeueModal.validation.contentTooLong') },
            ]}
          />

          <Form.Select
            field="priority"
            label={t('queueMessage.fields.priority')}
            optionList={priorityOptions}
            style={{ width: '100%' }}
            rules={[
              { required: true, message: t('queueMessage.validation.priorityRequired') },
            ]}
            initValue="MEDIUM"
          />

          <Form.DatePicker
            field="effectiveTime"
            label={t('queueMessage.fields.effectiveTime')}
            type="dateTime"
            style={{ width: '100%' }}
            rules={[
              { required: true, message: t('queueMessage.requeueModal.validation.effectiveTimeRequired') },
            ]}
            initValue={new Date()}
          />

          <Form.DatePicker
            field="expiryTime"
            label={t('queueMessage.fields.expiryTime')}
            type="dateTime"
            style={{ width: '100%' }}
            placeholder={t('queueMessage.fields.expiryTimePlaceholder')}
            validate={validateExpiryTime}
          />

          <div className="requeue-message-modal-footer">
            <Button theme="light" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
              {t('common.confirm')}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default RequeueMessageModal;
