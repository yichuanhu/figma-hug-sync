import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Form,
  Button,
  Toast,
  Banner,
} from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import {
  createMetric,
  updateMetric,
} from '@/mocks/operationsMetrics/service';
import type {
  CustomMetricWithSnapshot,
  MetricType,
} from '@/mocks/operationsMetrics/types';
import { MetricServiceError } from '@/mocks/operationsMetrics/types';

interface Props {
  visible: boolean;
  editing: CustomMetricWithSnapshot | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  code: string;
  displayName: string;
  metricType: MetricType;
  unit?: string;
  description?: string;
  visible: boolean;
}

const TYPE_OPTIONS: { value: MetricType; labelKey: string }[] = [
  { value: 'COUNTER', labelKey: 'metricsConfig.type.COUNTER' },
  { value: 'ACCUMULATOR', labelKey: 'metricsConfig.type.ACCUMULATOR' },
  { value: 'LATEST', labelKey: 'metricsConfig.type.LATEST' },
];

const MetricFormModal = ({ visible, editing, onClose, onSuccess }: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const formApiRef = useRef<FormApi | null>(null);
  const isEdit = !!editing;
  const lockTypeUnit = !!editing?.hasRecords;

  const initialValues: Partial<FormValues> = editing
    ? {
        code: editing.code,
        displayName: editing.displayName,
        metricType: editing.metricType,
        unit: editing.unit,
        description: editing.description,
        visible: editing.visible,
      }
    : {
        metricType: 'COUNTER',
        visible: true,
      };

  // 切换 visible 时重置表单
  useEffect(() => {
    if (visible && formApiRef.current) {
      formApiRef.current.setValues(initialValues, { isOverride: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editing]);

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (isEdit && editing) {
        await updateMetric(editing.id, {
          displayName: values.displayName,
          metricType: values.metricType,
          unit: values.unit,
          description: values.description,
          visible: values.visible,
        });
        Toast.success(t('metricsConfig.updateSuccess'));
      } else {
        await createMetric({
          code: values.code,
          displayName: values.displayName,
          metricType: values.metricType,
          unit: values.unit,
          description: values.description,
          visible: values.visible ?? true,
        });
        Toast.success(t('metricsConfig.createSuccess'));
      }
      onSuccess();
    } catch (e) {
      const code = e instanceof MetricServiceError ? e.code : 'NETWORK';
      const map: Record<string, string> = {
        DUPLICATE_CODE: t('metricsConfig.err.duplicateCode'),
        DUPLICATE_NAME: t('metricsConfig.err.duplicateName'),
        TYPE_UNIT_LOCKED: t('metricsConfig.err.typeUnitLocked'),
        NETWORK: t('metricsConfig.err.network'),
        NOT_FOUND: t('metricsConfig.err.network'),
        HAS_RECORDS: t('metricsConfig.err.network'),
      };
      Toast.error(map[code] ?? t('metricsConfig.err.network'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? t('metricsConfig.editTitle') : t('metricsConfig.createTitle')}
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      maskClosable={false}
    >
      <Form
        labelPosition="top"
        initValues={initialValues}
        onSubmit={(v) => handleSubmit(v as FormValues)}
        getFormApi={(api) => {
          formApiRef.current = api;
        }}
      >
        {lockTypeUnit && (
          <Banner
            type="info"
            description={t('metricsConfig.lockedHint')}
            fullMode={false}
            closeIcon={null}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form.Input
          field="code"
          label={t('metricsConfig.field.code')}
          placeholder={t('metricsConfig.field.codePlaceholder')}
          disabled={isEdit}
          trigger={['blur', 'change']}
          rules={[
            { required: true, message: t('metricsConfig.field.codeRequired') },
            {
              pattern: /^[A-Z][A-Z0-9_]*$/,
              message: t('metricsConfig.field.codePattern'),
            },
            { min: 2, max: 30, message: t('metricsConfig.field.codeLength') },
          ]}
        />
        <Form.Input
          field="displayName"
          label={t('metricsConfig.field.displayName')}
          placeholder={t('metricsConfig.field.displayNamePlaceholder')}
          maxLength={50}
          trigger={['blur', 'change']}
          rules={[
            { required: true, message: t('metricsConfig.field.displayNameRequired') },
          ]}
        />
        <Form.Select
          field="metricType"
          label={t('metricsConfig.field.metricType')}
          disabled={lockTypeUnit}
          optionList={TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
          rules={[
            { required: true, message: t('metricsConfig.field.metricTypeRequired') },
          ]}
        />
        <Form.Input
          field="unit"
          label={t('metricsConfig.field.unit')}
          placeholder={t('metricsConfig.field.unitPlaceholder')}
          maxLength={20}
          disabled={lockTypeUnit}
        />
        <Form.TextArea
          field="description"
          label={t('metricsConfig.field.description')}
          placeholder={t('metricsConfig.field.descriptionPlaceholder')}
          maxCount={500}
          rows={3}
        />
        <Form.Switch
          field="visible"
          label={t('metricsConfig.field.visible')}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button theme="light" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.confirm')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default MetricFormModal;
