import { useEffect, useRef } from 'react';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { useTranslation } from 'react-i18next';
import { postEntry, EffortError } from '../../../../mocks/effortStore';
import dayjs from 'dayjs';

interface Props {
  visible: boolean;
  processId: string;
  creatorId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const MAX_VALUE = 9999.99;

const EffortEntryModal = ({ visible, processId, creatorId, onCancel, onSuccess }: Props) => {
  const { t } = useTranslation();
  const formApiRef = useRef<FormApi | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTimeout(() => {
      if (!formApiRef.current) return;
      formApiRef.current.reset();
      formApiRef.current.setValues({ work_date: new Date(), delta_days: undefined, note: '' });
    }, 0);
  }, [visible]);

  const submit = async () => {
    if (!formApiRef.current) return;
    try {
      const values = await formApiRef.current.validate();
      const work = values.work_date instanceof Date ? values.work_date : new Date(values.work_date as string);
      const payload = {
        delta_days: Number(values.delta_days),
        work_date: dayjs(work).format('YYYY-MM-DD'),
        note: (values.note as string) || undefined,
      };
      postEntry(processId, creatorId, payload);
      Toast.success(t('development.processDevelopment.detail.effort.modal.successMessage'));
      onSuccess();
      onCancel();
    } catch (e) {
      if (e instanceof EffortError) {
        Toast.error(t(`development.processDevelopment.detail.effort.errors.${e.code}`));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // work_date 限制：[today-90d, today]
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 90);
  minDate.setHours(0, 0, 0, 0);

  return (
    <Modal
      title={t('development.processDevelopment.detail.effort.modal.title')}
      visible={visible}
      onCancel={onCancel}
      onOk={submit}
      okText={t('development.processDevelopment.detail.effort.modal.confirm')}
      cancelText={t('common.cancel')}
      width={520}
      centered
      maskClosable={false}
    >
      <div onKeyDown={handleKeyDown}>
        <Form
          getFormApi={(api) => (formApiRef.current = api)}
          labelPosition="top"
          initValues={{ work_date: new Date(), delta_days: undefined, note: '' }}
        >
          <Form.InputNumber
            field="delta_days"
            label={t('development.processDevelopment.detail.effort.modal.deltaLabel')}
            placeholder={t('development.processDevelopment.detail.effort.modal.deltaPlaceholder')}
            precision={2}
            step={0.5}
            style={{ width: '100%' }}
            suffix={t('development.processDevelopment.detail.effort.unit')}
            extraText={t('development.processDevelopment.detail.effort.modal.deltaHint')}
            rules={[
              {
                validator: (_r, value) => {
                  if (value === undefined || value === null || value === '') return false;
                  const n = Number(value);
                  if (!Number.isFinite(n)) return false;
                  if (n === 0) return false;
                  if (Math.abs(n) > MAX_VALUE) return false;
                  return Math.round(n * 100) === n * 100;
                },
                message: t('development.processDevelopment.detail.effort.errors.invalid_delta'),
              },
            ]}
            trigger={['blur', 'change']}
          />
          <Form.DatePicker
            field="work_date"
            label={t('development.processDevelopment.detail.effort.modal.dateLabel')}
            placeholder={t('development.processDevelopment.detail.effort.modal.datePlaceholder')}
            type="date"
            disabledDate={(date) => !date || date.getTime() > today.getTime() || date.getTime() < minDate.getTime()}
            style={{ width: '100%' }}
            extraText={t('development.processDevelopment.detail.effort.modal.dateHint')}
            rules={[
              { required: true, message: t('development.processDevelopment.detail.effort.errors.invalid_date') },
            ]}
            trigger={['blur', 'change']}
          />
          <Form.TextArea
            field="note"
            label={t('development.processDevelopment.detail.effort.modal.noteLabel')}
            placeholder={t('development.processDevelopment.detail.effort.modal.notePlaceholder')}
            maxCount={200}
            maxLength={200}
            autosize={{ minRows: 3, maxRows: 5 }}
            rules={[
              { max: 200, message: t('development.processDevelopment.detail.effort.errors.invalid_note') },
            ]}
            trigger={['blur', 'change']}
          />
        </Form>
      </div>
    </Modal>
  );
};

export default EffortEntryModal;
