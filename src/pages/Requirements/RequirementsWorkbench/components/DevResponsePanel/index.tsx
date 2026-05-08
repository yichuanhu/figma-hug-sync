import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, RadioGroup, Radio, TextArea, Toast, Tag, Typography } from '@douyinfe/semi-ui';
import type { DevResponseAction, RequirementChangeLog } from '../../types';
import { respondChange } from '../../mockData';
import './index.less';

const { Text } = Typography;

interface Props {
  visible: boolean;
  log: RequirementChangeLog | null;
  onCancel: () => void;
  onSuccess: (updated: RequirementChangeLog) => void;
}

const DevResponsePanel = ({ visible, log, onCancel, onSuccess }: Props) => {
  const { t } = useTranslation();
  const [action, setAction] = useState<DevResponseAction>('ACK');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setAction('ACK');
      setComment('');
    }
  }, [visible, log?.id]);

  const commentRequired = action === 'REJECTED';
  const commentInvalid = commentRequired && comment.trim().length < 10;

  const successMsg = useMemo(() => {
    if (action === 'ACK') return t('requirements.detail.devResponse.successAck');
    if (action === 'ADJUSTED') return t('requirements.detail.devResponse.successAdjusted');
    return t('requirements.detail.devResponse.successRejected');
  }, [action, t]);

  const handleSubmit = async () => {
    if (!log) return;
    if (commentInvalid) {
      Toast.error(t('requirements.detail.devResponse.errorRejectTooShort'));
      return;
    }
    setSubmitting(true);
    try {
      const updated = await respondChange(log.id, action, comment.trim() || undefined);
      Toast.success(successMsg);
      onSuccess(updated);
    } catch (err) {
      const code = (err as Error).message;
      if (code === 'ALREADY_RESPONDED') {
        Toast.error(t('requirements.detail.devResponse.errorAlreadyResponded'));
      } else if (code === 'REJECT_REASON_TOO_SHORT') {
        Toast.error(t('requirements.detail.devResponse.errorRejectTooShort'));
      } else {
        Toast.error(code);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={t('requirements.detail.devResponse.modalTitle')}
      visible={visible}
      width={520}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={t('requirements.detail.devResponse.submit')}
      cancelText={t('common.cancel')}
      confirmLoading={submitting}
      okButtonProps={{ disabled: commentInvalid }}
      maskClosable={false}
      className="dev-response-panel"
    >
      {log && (
        <div className="dev-response-panel-body">
          <div className="dev-response-panel-summary">
            <Tag color="orange" size="small">
              {t(`requirements.detail.changeLog.type.${log.changeType}`)}
            </Tag>
            <Text type="tertiary" size="small">
              {log.publisherName} · {log.publishedAt.replace('T', ' ').substring(0, 19)}
            </Text>
            <div className="dev-response-panel-reason">{log.reason}</div>
          </div>

          <Form labelPosition="top">
            <Form.Slot label={t('requirements.detail.devResponse.actionLabel')} required>
              <RadioGroup value={action} onChange={(e) => setAction(e.target.value)}>
                <Radio value="ACK">
                  {t('requirements.detail.changeLog.response.ACK')}
                </Radio>
                <Radio value="ADJUSTED">
                  {t('requirements.detail.changeLog.response.ADJUSTED')}
                </Radio>
                <Radio value="REJECTED">
                  {t('requirements.detail.changeLog.response.REJECTED')}
                </Radio>
              </RadioGroup>
            </Form.Slot>

            <Form.TextArea
              field="comment"
              label={t('requirements.detail.devResponse.commentLabel')}
              placeholder={
                commentRequired
                  ? t('requirements.detail.devResponse.commentRejectedPlaceholder')
                  : t('requirements.detail.devResponse.commentPlaceholder')
              }
              maxCount={500}
              maxLength={500}
              rows={4}
              noLabel={false}
              required={commentRequired}
              value={comment}
              onChange={(v) => setComment(String(v ?? ''))}
              validateStatus={commentInvalid ? 'error' : 'default'}
            />
          </Form>
        </div>
      )}
    </Modal>
  );
};

export default DevResponsePanel;
