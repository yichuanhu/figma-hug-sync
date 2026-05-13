import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import dayjs from 'dayjs';
import {
  COST_PROJECT_OPTIONS,
  createCostRecord,
  isCostNameDuplicate,
  updateCostRecord,
  type CostFormPayload,
  type CostRecord,
  type CostType,
  type RecurrencePattern,
} from '../../mockData';
import './index.less';

interface Props {
  visible: boolean;
  costType: CostType;
  editing: CostRecord | null;
  onClose: () => void;
}

interface FormValues {
  costName: string;
  projectId?: string;
  amount: number;
  occurrenceDate: string | Date;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  description?: string;
}

const CostFormModal = ({ visible, costType, editing, onClose }: Props) => {
  const { t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formApi, setFormApi] = useState<any>(null);
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setIsRecurring(editing?.isRecurring ?? false);
  }, [visible, editing]);

  const isProject = costType === 'PROJECT';
  const isEdit = !!editing;

  const initValues: FormValues = {
    costName: editing?.costName ?? '',
    projectId: editing?.projectId,
    amount: editing?.amount ?? 0,
    occurrenceDate: editing?.occurrenceDate ?? dayjs().format('YYYY-MM-DD'),
    isRecurring: editing?.isRecurring ?? false,
    recurrencePattern: editing?.recurrencePattern,
    description: editing?.description ?? '',
  };

  const handleSubmit = async (values: FormValues) => {
    const name = (values.costName ?? '').trim();
    if (!name) return;
    if (isCostNameDuplicate(costType, name, editing?.id)) {
      Toast.error(t('operations.costManagement.validation.nameDuplicate'));
      return;
    }
    const occurrenceDate =
      typeof values.occurrenceDate === 'string'
        ? values.occurrenceDate
        : dayjs(values.occurrenceDate).format('YYYY-MM-DD');

    const payload: CostFormPayload = {
      costType,
      costName: name,
      amount: Number(values.amount) || 0,
      occurrenceDate,
      isRecurring: !!values.isRecurring,
      recurrencePattern: values.isRecurring ? values.recurrencePattern : undefined,
      description: values.description?.trim() || undefined,
      projectId: isProject ? values.projectId : undefined,
    };

    if (isProject && !payload.projectId) {
      Toast.error(t('operations.costManagement.validation.projectRequired'));
      return;
    }
    if (payload.amount <= 0) {
      Toast.error(t('operations.costManagement.validation.amountPositive'));
      return;
    }
    if (dayjs(occurrenceDate).isAfter(dayjs(), 'day')) {
      Toast.error(t('operations.costManagement.validation.dateNotFuture'));
      return;
    }

    if (editing) {
      updateCostRecord(editing.id, payload);
      Toast.success(t('operations.costManagement.toast.updated'));
    } else {
      createCostRecord(payload);
      Toast.success(t('operations.costManagement.toast.created'));
    }
    onClose();
  };

  return (
    <Modal
      title={
        editing
          ? t('operations.costManagement.modal.editTitle')
          : t('operations.costManagement.modal.createTitle')
      }
      visible={visible}
      onCancel={onClose}
      onOk={() => formApi?.submitForm()}
      width={520}
      maskClosable={false}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      className="cost-form-modal"
      centered
    >
      <Form<FormValues>
        initValues={initValues}
        onSubmit={handleSubmit}
        getFormApi={setFormApi}
        labelPosition="top"
      >
        <Form.Input
          field="costName"
          label={t('operations.costManagement.form.costName')}
          placeholder={t('operations.costManagement.form.costNamePlaceholder')}
          maxLength={200}
          showClear
          trigger={['blur', 'change']}
          rules={[
            { required: true, message: t('operations.costManagement.validation.nameRequired') },
            { max: 200, message: t('operations.costManagement.validation.nameMax') },
          ]}
        />

        {isProject && (
          <Form.Select
            field="projectId"
            label={t('operations.costManagement.form.project')}
            placeholder={t('operations.costManagement.form.projectPlaceholder')}
            optionList={COST_PROJECT_OPTIONS.map((p) => ({ label: p.name, value: p.id }))}
            style={{ width: '100%' }}
            disabled={isEdit}
            filter
            showClear
            trigger={['blur', 'change']}
            rules={[{ required: true, message: t('operations.costManagement.validation.projectRequired') }]}
            emptyContent={t('operations.costManagement.empty.noProjects')}
          />
        )}

        <Form.InputNumber
          field="amount"
          label={t('operations.costManagement.form.amount')}
          placeholder={t('operations.costManagement.form.amountPlaceholder')}
          style={{ width: '100%' }}
          min={0.01}
          precision={2}
          suffix="¥"
          trigger={['blur', 'change']}
          rules={[
            { required: true, message: t('operations.costManagement.validation.amountRequired') },
            {
              validator: (_r, v) => typeof v === 'number' && v > 0,
              message: t('operations.costManagement.validation.amountPositive'),
            },
          ]}
        />

        <Form.DatePicker
          field="occurrenceDate"
          label={t('operations.costManagement.form.occurrenceDate')}
          style={{ width: '100%' }}
          disabledDate={(d?: Date) => !!d && dayjs(d).isAfter(dayjs(), 'day')}
          trigger={['blur', 'change']}
          rules={[{ required: true, message: t('operations.costManagement.validation.dateRequired') }]}
        />

        <Form.Switch
          field="isRecurring"
          label={t('operations.costManagement.form.isRecurring')}
          onChange={(v) => setIsRecurring(!!v)}
        />

        {isRecurring && (
          <Form.Select
            field="recurrencePattern"
            label={t('operations.costManagement.form.recurrencePattern')}
            placeholder={t('operations.costManagement.form.recurrencePlaceholder')}
            style={{ width: '100%' }}
            optionList={[
              { label: t('operations.costManagement.recurrence.DAILY'), value: 'DAILY' },
              { label: t('operations.costManagement.recurrence.WEEKLY'), value: 'WEEKLY' },
              { label: t('operations.costManagement.recurrence.MONTHLY'), value: 'MONTHLY' },
              { label: t('operations.costManagement.recurrence.QUARTERLY'), value: 'QUARTERLY' },
              { label: t('operations.costManagement.recurrence.YEARLY'), value: 'YEARLY' },
            ]}
            trigger={['blur', 'change']}
            rules={[{ required: true, message: t('operations.costManagement.validation.recurrenceRequired') }]}
          />
        )}

        <Form.TextArea
          field="description"
          label={t('operations.costManagement.form.description')}
          placeholder={t('operations.costManagement.form.descriptionPlaceholder')}
          maxLength={500}
          maxCount={500}
          autosize={{ minRows: 3, maxRows: 5 }}
        />
      </Form>
    </Modal>
  );
};

export default CostFormModal;
