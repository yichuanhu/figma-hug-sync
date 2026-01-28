import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Form,
  Toast,
  Typography,
  Select,
  DatePicker,
  Banner,
} from '@douyinfe/semi-ui';
import type { LYQueueMessageResponse, MessagePriority } from '@/api/index';

import './index.less';

interface RequeueModalProps {
  visible: boolean;
  message: LYQueueMessageResponse | null;
  isBatch: boolean;
  batchCount?: number;
  onCancel: () => void;
  onSuccess: () => void;
}

const RequeueModal = ({
  visible,
  message,
  isBatch,
  batchCount,
  onCancel,
  onSuccess,
}: RequeueModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);

  const { Text } = Typography;

  // 重置表单
  useEffect(() => {
    if (visible && formApi) {
      if (isBatch) {
        formApi.setValues({
          priority: 'MEDIUM',
          effective_time: new Date(),
          expiry_time: null,
        });
      } else if (message) {
        formApi.setValues({
          content: message.content,
          priority: message.priority,
          effective_time: new Date(),
          expiry_time: message.expiry_time ? new Date(message.expiry_time) : null,
        });
      }
    }
  }, [visible, message, isBatch, formApi]);

  const priorityOptions = [
    { value: 'HIGH', label: t('queueMessage.priority.high') },
    { value: 'MEDIUM', label: t('queueMessage.priority.medium') },
    { value: 'LOW', label: t('queueMessage.priority.low') },
  ];

  const handleSubmit = async (values: any) => {
    // 验证失效时间必须大于生效时间
    if (values.expiry_time && values.effective_time) {
      if (new Date(values.expiry_time) <= new Date(values.effective_time)) {
        Toast.error(t('queueMessage.requeueModal.expiryTimeError'));
        return;
      }
    }

    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      Toast.success(
        isBatch 
          ? t('queueMessage.requeueModal.batchSuccess', { count: batchCount })
          : t('queueMessage.requeueModal.success')
      );
      onSuccess();
    } catch (error) {
      Toast.error(t('queueMessage.requeueModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isBatch ? t('queueMessage.requeueModal.batchTitle') : t('queueMessage.requeueModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      className="requeue-modal"
    >
      <div className="requeue-modal-content">
        {isBatch && (
          <Banner
            type="info"
            description={t('queueMessage.requeueModal.batchTips', { count: batchCount })}
            className="requeue-modal-banner"
          />
        )}

        <Form
          getFormApi={setFormApi}
          onSubmit={handleSubmit}
          labelPosition="top"
          className="requeue-modal-form"
        >
          {!isBatch && (
            <Form.TextArea
              field="content"
              label={t('queueMessage.detail.content')}
              placeholder={t('queueMessage.requeueModal.contentPlaceholder')}
              maxCount={4000}
              rules={[
                { required: true, message: t('queueMessage.requeueModal.contentRequired') },
              ]}
              autosize={{ minRows: 4, maxRows: 8 }}
            />
          )}

          <Form.Select
            field="priority"
            label={t('queueMessage.table.priority')}
            optionList={priorityOptions}
            rules={[
              { required: true, message: t('queueMessage.requeueModal.priorityRequired') },
            ]}
          />

          <Form.DatePicker
            field="effective_time"
            label={t('queueMessage.table.effectiveTime')}
            type="dateTime"
            rules={[
              { required: true, message: t('queueMessage.requeueModal.effectiveTimeRequired') },
            ]}
            style={{ width: '100%' }}
          />

          <Form.DatePicker
            field="expiry_time"
            label={t('queueMessage.detail.expiryTime')}
            type="dateTime"
            style={{ width: '100%' }}
          />

          <div className="requeue-modal-footer">
            <Form.Slot>
              <div className="requeue-modal-footer-buttons">
                <button type="button" className="semi-button semi-button-tertiary" onClick={onCancel}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="semi-button semi-button-primary" disabled={loading}>
                  {loading ? t('common.confirm') + '...' : t('common.confirm')}
                </button>
              </div>
            </Form.Slot>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default RequeueModal;
