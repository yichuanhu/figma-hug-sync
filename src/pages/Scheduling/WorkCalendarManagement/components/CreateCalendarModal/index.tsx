import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, DatePicker, Button, Toast } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import type { WorkCalendarTemplate } from '@/api/index';
import './index.less';

interface CreateCalendarModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    name: string;
    template: WorkCalendarTemplate;
    start_date: string;
    end_date: string;
  }) => void;
}

const CreateCalendarModal: React.FC<CreateCalendarModalProps> = ({
  visible,
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const formApiRef = useRef<FormApi | null>(null);

  const templateOptions = [
    { value: 'WEEKEND_DOUBLE', label: t('workCalendar.template.weekendDouble') },
    { value: 'WEEKEND_SINGLE', label: t('workCalendar.template.weekendSingle') },
    { value: 'BLANK', label: t('workCalendar.template.blank') },
  ];

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    const { name, template, period } = values;
    
    if (!period || !Array.isArray(period) || period.length !== 2) {
      Toast.error(t('workCalendar.validation.periodRequired'));
      return;
    }
    
    const [startDate, endDate] = period as [Date, Date];
    
    if (startDate >= endDate) {
      Toast.error(t('workCalendar.validation.endDateInvalid'));
      return;
    }
    
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API call
      onSubmit({
        name: name as string,
        template: template as WorkCalendarTemplate,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      className="create-calendar-modal"
      title={t('workCalendar.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={520}
      centered
    >
      <Form
        className="create-calendar-modal-form"
        onSubmit={handleSubmit}
        labelPosition="top"
        getFormApi={(api) => {
          formApiRef.current = api;
        }}
      >
        <Form.Input
          field="name"
          label={t('workCalendar.createModal.name')}
          placeholder={t('workCalendar.createModal.namePlaceholder')}
          rules={[
            { required: true, message: t('workCalendar.validation.nameRequired') },
            { max: 50, message: t('workCalendar.validation.nameLengthError') },
          ]}
          maxLength={50}
          showClear
        />
        
        <Form.Select
          field="template"
          label={t('workCalendar.createModal.template')}
          placeholder={t('workCalendar.createModal.templatePlaceholder')}
          optionList={templateOptions}
          rules={[
            { required: true, message: t('workCalendar.validation.templateRequired') },
          ]}
          style={{ width: '100%' }}
        />
        
        <Form.Slot label={t('workCalendar.createModal.period')}>
          <Form.DatePicker
            field="period"
            type="dateRange"
            style={{ width: '100%' }}
            rules={[
              { required: true, message: t('workCalendar.validation.periodRequired') },
            ]}
            noLabel
          />
        </Form.Slot>

        <div className="create-calendar-modal-footer">
          <Button onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            htmlType="submit"
            theme="solid"
            type="primary"
            loading={loading}
          >
            {t('common.confirm')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateCalendarModal;
