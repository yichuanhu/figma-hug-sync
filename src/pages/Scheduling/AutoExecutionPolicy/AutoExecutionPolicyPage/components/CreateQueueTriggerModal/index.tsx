import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import {
  Modal,
  Form,
  Button,
  Toast,
  Steps,
  Select,
  Banner,
  Tag,
} from '@douyinfe/semi-ui';
import OwnerSelect from '@/components/OwnerSelect';
import TaskForm, { TaskFormSource } from '@/components/TaskForm';
import type { TaskFormRef } from '@/components/TaskForm';
import { TIMEZONE_GROUPS } from '@/constants/timezones';
import { getWorkCalendarOptions } from '@/mocks/workCalendar';
import './index.less';

interface CreateQueueTriggerModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

// Mock QueueList
const mockQueues = [
  { queue_id: 'queue-001', queue_name: 'Pending Orders Queue', monitored: false },
  { queue_id: 'queue-002', queue_name: 'Approval Tasks Queue', monitored: true },
  { queue_id: 'queue-003', queue_name: 'Data Sync Queue', monitored: false },
  { queue_id: 'queue-004', queue_name: 'Report Generation Queue', monitored: false },
];

// 已存在的触发器名（模拟）
const existingTriggerNames = ['Order Queue Trigger', 'Approval Queue Trigger'];

const CreateQueueTriggerModal = ({ visible, onCancel, onSuccess }: CreateQueueTriggerModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState<string>(MOCK_CURRENT_USER.id);
  const [currentStep, setCurrentStep] = useState(0);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const taskRef = useRef<TaskFormRef>(null);

  const [enableWorkCalendar, setEnableWorkCalendar] = useState(false);
  const [minEffectiveMessages, setMinEffectiveMessages] = useState(1);
  const [enablePeriodicCheck, setEnablePeriodicCheck] = useState(false);

  // 重置
  useEffect(() => {
    if (!visible) {
      setCurrentStep(0);
      setShowRightPanel(false);
      setEnableWorkCalendar(false);
      setMinEffectiveMessages(1);
      setEnablePeriodicCheck(false);
    } else if (taskRef.current) {
      taskRef.current.init();
    }
  }, [visible]);

  const validateTriggerName = (value: string) => {
    if (value && existingTriggerNames.includes(value.trim())) {
      return t('queueTrigger.validation.nameExists');
    }
    return '';
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const result = await taskRef.current?.submit();
      if (!result) return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep === 2 && taskRef.current) {
      taskRef.current.pre();
    }
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('Creating queue trigger');
      Toast.success(t('queueTrigger.createModal.success'));
      onSuccess();
    } catch (error) {
      console.error('Failed to create queue trigger:', error);
      Toast.error(t('queueTrigger.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  // Step0: 基本信息
  const renderStep0Content = () => (
    <div className="create-queue-trigger-modal-section">
      <div className="create-queue-trigger-modal-section-title">{t('queueTrigger.createModal.basicSection')}</div>
      <Form labelPosition="top">
        <Form.Input
          field="triggerName"
          label={t('queueTrigger.fields.name')}
          placeholder={t('queueTrigger.fields.namePlaceholder')}
          maxLength={255}
          showClear
          rules={[
            { required: true, message: t('queueTrigger.validation.nameRequired') },
            { max: 255, message: t('queueTrigger.validation.nameLengthError') },
            { validator: (_rule: any, value: string, callback: (msg?: string) => void) => {
              const error = validateTriggerName(value);
              if (error) { callback(error); return false; }
              callback();
              return true;
            }},
          ]}
        />
        <Form.TextArea
          field="description"
          label={t('queueTrigger.fields.description')}
          placeholder={t('queueTrigger.fields.descriptionPlaceholder')}
          maxCount={2000}
          showClear
          rows={3}
        />
        <Form.Slot label={t('common.owner')}>
          <OwnerSelect value={ownerId} onChange={setOwnerId} />
        </Form.Slot>
      </Form>
    </div>
  );

  // Step2: 队列触发配置
  const renderStep2Content = () => (
    <div className="create-queue-trigger-modal-section">
      <div className="create-queue-trigger-modal-section-title">{t('queueTrigger.createModal.queueSection')}</div>
      <Form labelPosition="top">
        <Form.Select
          field="timeZone"
          label={t('queueTrigger.fields.timeZone')}
          placeholder={t('queueTrigger.fields.timeZonePlaceholder')}
          initValue="Asia/Shanghai"
          rules={[{ required: true, message: t('queueTrigger.validation.timeZoneRequired') }]}
          style={{ width: '100%' }}
        >
          {TIMEZONE_GROUPS.map((group) => (
            <Form.Select.OptGroup key={group.groupLabel} label={group.groupLabel}>
              {group.options.map((tz) => (
                <Form.Select.Option key={tz.value} value={tz.value}>
                  {tz.label}
                </Form.Select.Option>
              ))}
            </Form.Select.OptGroup>
          ))}
        </Form.Select>

        <div className="create-queue-trigger-modal-field">
          <div className="semi-form-field-label-text">{t('queueTrigger.fields.enableWorkCalendar')}</div>
          <Form.Switch
            field="enableWorkCalendarSwitch"
            noLabel
            size="small"
            onChange={(value) => setEnableWorkCalendar(value)}
          />
        </div>
        {enableWorkCalendar && (
          <>
            <Form.Select
              field="workCalendarId"
              label={t('queueTrigger.fields.workCalendar')}
              placeholder={t('queueTrigger.fields.workCalendarPlaceholder')}
              optionList={getWorkCalendarOptions()}
              rules={[{ required: true, message: t('queueTrigger.validation.workCalendarRequired') }]}
              style={{ width: '100%' }}
            />
            <Form.RadioGroup
              field="executionType"
              label={t('queueTrigger.fields.executionType')}
              initValue="WORKDAY"
              direction="horizontal"
            >
              <Form.Radio value="WORKDAY">{t('queueTrigger.fields.executionTypeWorkday')}</Form.Radio>
              <Form.Radio value="NON_WORKDAY">{t('queueTrigger.fields.executionTypeNonWorkday')}</Form.Radio>
            </Form.RadioGroup>
          </>
        )}

        <Form.Select
          field="queueId"
          label={t('queueTrigger.fields.monitoredQueue')}
          placeholder={t('queueTrigger.fields.monitoredQueuePlaceholder')}
          optionList={mockQueues.map((q) => ({
            value: q.queue_id,
            label: q.queue_name,
            disabled: q.monitored,
          }))}
          extraText={t('queueTrigger.fields.monitoredQueueHint')}
          rules={[{ required: true, message: t('queueTrigger.validation.queueRequired') }]}
          style={{ width: '100%' }}
          renderOptionItem={(renderProps) => {
            const { disabled, selected, label, value, ...rest } = renderProps;
            return (
              <Select.Option {...rest} value={value} disabled={disabled} selected={selected}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>{label}</span>
                  {disabled && <Tag size="small" color="orange">Already monitored</Tag>}
                </div>
              </Select.Option>
            );
          }}
        />

        <Form.InputNumber
          field="minEffectiveMessages"
          label={t('queueTrigger.fields.minEffectiveMessages')}
          initValue={1}
          min={1}
          max={9999}
          extraText={t('queueTrigger.fields.minEffectiveMessagesHint')}
          onChange={(value) => setMinEffectiveMessages(value as number)}
          rules={[
            { required: true, message: t('queueTrigger.validation.minEffectiveMessagesRange') },
            { type: 'number' as const, min: 1, max: 9999, message: t('queueTrigger.validation.minEffectiveMessagesRange') },
          ]}
          style={{ width: '100%' }}
        />

        {minEffectiveMessages > 1 && (
          <>
            <div className="create-queue-trigger-modal-field">
              <div className="semi-form-field-label-text">{t('queueTrigger.fields.enablePeriodicCheck')}</div>
              <Form.Switch
                field="enablePeriodicCheckSwitch"
                noLabel
                size="small"
                onChange={(value) => setEnablePeriodicCheck(value)}
              />
            </div>
            {enablePeriodicCheck && (
              <Banner
                type="info"
                description={t('queueTrigger.fields.enablePeriodicCheckHint')}
                className="create-queue-trigger-modal-banner"
              />
            )}
            {enablePeriodicCheck && (
              <Form.InputNumber
                field="periodicCheckInterval"
                label={t('queueTrigger.fields.periodicCheckInterval')}
                initValue={30}
                min={1}
                suffix={t('queueTrigger.fields.periodicCheckIntervalUnit')}
                rules={[
                  { required: true, message: t('queueTrigger.validation.periodicCheckIntervalRange') },
                  { type: 'number' as const, min: 1, message: t('queueTrigger.validation.periodicCheckIntervalRange') },
                ]}
                style={{ width: '100%' }}
              />
            )}
          </>
        )}

        <Form.InputNumber
          field="messagesPerTrigger"
          label={t('queueTrigger.fields.messagesPerTrigger')}
          initValue={10}
          min={1}
          extraText={t('queueTrigger.fields.messagesPerTriggerHint')}
          rules={[
            { required: true, message: t('queueTrigger.validation.messagesPerTriggerRange') },
            { type: 'number' as const, min: 1, message: t('queueTrigger.validation.messagesPerTriggerRange') },
          ]}
          style={{ width: '100%' }}
        />
      </Form>
    </div>
  );

  const modalWidth = showRightPanel && currentStep === 1 ? 900 : 520;

  return (
    <Modal
      className="create-queue-trigger-modal"
      title={t('queueTrigger.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={modalWidth}
      centered
    >
      <div className="create-queue-trigger-modal-steps">
        <Steps current={currentStep} type="basic" size="small">
          <Steps.Step title={t('queueTrigger.createModal.steps.basicInfo')} />
          <Steps.Step title={t('queueTrigger.createModal.steps.taskConfig')} />
          <Steps.Step title={t('queueTrigger.createModal.steps.queueConfig')} />
        </Steps>
      </div>

      {currentStep === 0 && (
        <div className="create-queue-trigger-modal-content">
          {renderStep0Content()}
        </div>
      )}

      {currentStep === 1 && (
        <TaskForm
          taskRef={taskRef}
          showParamsHandle={setShowRightPanel}
          source={TaskFormSource.QueueTrigger}
          showRightPanel={showRightPanel}
        />
      )}

      {currentStep === 2 && (
        <div className="create-queue-trigger-modal-content">
          {renderStep2Content()}
        </div>
      )}

      <div className="create-queue-trigger-modal-footer">
        <Button theme="light" onClick={onCancel}>{t('common.cancel')}</Button>
        {currentStep > 0 && (
          <Button onClick={handlePrev}>{t('queueTrigger.createModal.prevStep')}</Button>
        )}
        {currentStep < 2 ? (
          <Button theme="solid" type="primary" onClick={handleNext}>{t('queueTrigger.createModal.nextStep')}</Button>
        ) : (
          <Button theme="solid" type="primary" onClick={handleSubmit} loading={loading}>{t('common.create')}</Button>
        )}
      </div>
    </Modal>
  );
};

export default CreateQueueTriggerModal;
