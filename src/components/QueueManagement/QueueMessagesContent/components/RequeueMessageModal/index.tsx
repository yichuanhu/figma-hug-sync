import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Modal, 
  Form, 
  TextArea, 
  Select, 
  DatePicker, 
  Toast,
  Typography,
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
  const [formValues, setFormValues] = useState({
    content: '',
    priority: 'MEDIUM' as QueueMessagePriority,
    effectiveTime: new Date(),
    expiryTime: null as Date | null,
  });

  // 初始化表单值
  useEffect(() => {
    if (visible && message) {
      setFormValues({
        content: message.content,
        priority: message.priority,
        effectiveTime: new Date(),
        expiryTime: message.expiry_time ? new Date(message.expiry_time) : null,
      });
    }
  }, [visible, message]);

  const handleSubmit = async () => {
    // 验证
    if (!formValues.content.trim()) {
      Toast.error(t('queueMessage.requeueModal.validation.contentRequired'));
      return;
    }

    if (formValues.content.length > 4000) {
      Toast.error(t('queueMessage.requeueModal.validation.contentTooLong'));
      return;
    }

    if (!formValues.effectiveTime) {
      Toast.error(t('queueMessage.requeueModal.validation.effectiveTimeRequired'));
      return;
    }

    if (formValues.expiryTime && formValues.expiryTime <= formValues.effectiveTime) {
      Toast.error(t('queueMessage.requeueModal.validation.expiryTimeInvalid'));
      return;
    }

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
      onOk={handleSubmit}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      confirmLoading={loading}
      className="requeue-message-modal"
      width={560}
    >
      <div className="requeue-message-modal-content">
        <Text type="tertiary" className="requeue-message-modal-tip">
          {t('queueMessage.requeueModal.description')}
        </Text>
        
        <Form labelPosition="top" className="requeue-message-modal-form">
          <Form.Slot label={<span>{t('queueMessage.fields.content')} <span style={{ color: 'var(--semi-color-danger)' }}>*</span></span>}>
            <TextArea
              value={formValues.content}
              onChange={(value) => setFormValues({ ...formValues, content: value })}
              placeholder={t('queueMessage.fields.contentPlaceholder')}
              maxCount={4000}
              showClear
              autosize={{ minRows: 4, maxRows: 8 }}
            />
          </Form.Slot>

          <Form.Slot label={<span>{t('queueMessage.fields.priority')} <span style={{ color: 'var(--semi-color-danger)' }}>*</span></span>}>
            <Select
              value={formValues.priority}
              onChange={(value) => setFormValues({ ...formValues, priority: value as QueueMessagePriority })}
              optionList={priorityOptions}
              style={{ width: '100%' }}
            />
          </Form.Slot>

          <Form.Slot label={<span>{t('queueMessage.fields.effectiveTime')} <span style={{ color: 'var(--semi-color-danger)' }}>*</span></span>}>
            <DatePicker
              type="dateTime"
              value={formValues.effectiveTime}
              onChange={(date) => setFormValues({ ...formValues, effectiveTime: date as Date })}
              style={{ width: '100%' }}
            />
          </Form.Slot>

          <Form.Slot label={t('queueMessage.fields.expiryTime')}>
            <DatePicker
              type="dateTime"
              value={formValues.expiryTime}
              onChange={(date) => setFormValues({ ...formValues, expiryTime: date as Date | null })}
              style={{ width: '100%' }}
              placeholder={t('queueMessage.fields.expiryTimePlaceholder')}
            />
          </Form.Slot>
        </Form>
      </div>
    </Modal>
  );
};

export default RequeueMessageModal;
