import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import {
  Modal,
  Form,
  Button,
  Toast,
  Steps,
} from '@douyinfe/semi-ui';
import OwnerSelect from '@/components/OwnerSelect';
import TriggerRuleConfig from '@/components/TriggerRuleConfig';
import TaskForm, { TaskFormSource } from '@/components/TaskForm';
import type { TaskFormRef } from '@/components/TaskForm';
import type {
  TriggerRuleType,
  BasicFrequencyType,
} from '@/api';
import './index.less';

interface CreateTimeTriggerModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

import { getWorkCalendarOptions } from '@/mocks/workCalendar';

// 已存在的触发器名（模拟）
const existingTriggerNames = ['Daily Order Sync', 'Weekly Report Generation'];

const CreateTimeTriggerModal = ({ visible, onCancel, onSuccess }: CreateTimeTriggerModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState<string>(MOCK_CURRENT_USER.id);
  const [currentStep, setCurrentStep] = useState(0);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const taskRef = useRef<TaskFormRef>(null);

  // 第三步: Trigger Rules
  const [ruleType, setRuleType] = useState<TriggerRuleType>('BASIC');
  const [frequencyType, setFrequencyType] = useState<BasicFrequencyType>('DAILY');
  const [minuteInterval, setMinuteInterval] = useState<number>(5);
  const [hourInterval, setHourInterval] = useState<number>(2);
  const [minuteOfHour, setMinuteOfHour] = useState<number>(0);
  const [triggerHour, setTriggerHour] = useState<number>(9);
  const [triggerMinute, setTriggerMinute] = useState<number>(0);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1]);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number | 'L'>(1);
  const [cronExpression, setCronExpression] = useState('');
  const [timeZone, setTimeZone] = useState('Asia/Shanghai');
  const [startDateTime, setStartDateTime] = useState<Date | null>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);
  const [endTimeType, setEndTimeType] = useState<'never' | 'custom'>('never');
  const [enableWorkCalendar, setEnableWorkCalendar] = useState(false);
  const [workCalendarId, setWorkCalendarId] = useState<string | null>(null);
  const [workCalendarExecutionType, setWorkCalendarExecutionType] = useState<'WORKDAY' | 'NON_WORKDAY'>('WORKDAY');

  // 生成 Cron 表达式
  const generatedCronExpression = useMemo(() => {
    if (ruleType !== 'BASIC') return cronExpression;
    switch (frequencyType) {
      case 'MINUTELY': return `*/${minuteInterval} * * * *`;
      case 'HOURLY': return `${minuteOfHour} */${hourInterval} * * *`;
      case 'DAILY': return `${triggerMinute} ${triggerHour} * * *`;
      case 'WEEKLY': {
        const weekdayStr = selectedWeekdays.length > 0 ? selectedWeekdays.sort().join(',') : '*';
        return `${triggerMinute} ${triggerHour} * * ${weekdayStr}`;
      }
      case 'MONTHLY': {
        const dayStr = selectedMonthDay === 'L' ? 'L' : selectedMonthDay;
        return `${triggerMinute} ${triggerHour} ${dayStr} * *`;
      }
      default: return '';
    }
  }, [ruleType, frequencyType, minuteInterval, hourInterval, minuteOfHour, triggerHour, triggerMinute, selectedWeekdays, selectedMonthDay, cronExpression]);

  // 预览触发时间
  const previewTimes = useMemo(() => {
    if (!startDateTime) return [];
    const times: string[] = [];
    const now = new Date(startDateTime);
    for (let i = 0; i < 10; i++) {
      const triggerTime = new Date(now);
      if (ruleType === 'BASIC') {
        switch (frequencyType) {
          case 'MINUTELY': triggerTime.setMinutes(triggerTime.getMinutes() + i * minuteInterval); break;
          case 'HOURLY': triggerTime.setHours(triggerTime.getHours() + i * hourInterval); break;
          case 'DAILY': triggerTime.setDate(triggerTime.getDate() + i); triggerTime.setHours(triggerHour, triggerMinute, 0, 0); break;
          case 'WEEKLY': triggerTime.setDate(triggerTime.getDate() + i * 7); triggerTime.setHours(triggerHour, triggerMinute, 0, 0); break;
          case 'MONTHLY': triggerTime.setMonth(triggerTime.getMonth() + i); triggerTime.setHours(triggerHour, triggerMinute, 0, 0); break;
        }
      } else {
        triggerTime.setDate(triggerTime.getDate() + i);
      }
      times.push(triggerTime.toLocaleString('zh-CN'));
    }
    return times;
  }, [startDateTime, ruleType, frequencyType, minuteInterval, hourInterval, triggerHour, triggerMinute]);

  // 重置
  useEffect(() => {
    if (!visible) {
      setCurrentStep(0);
      setShowRightPanel(false);
      setRuleType('BASIC');
      setFrequencyType('DAILY');
      setMinuteInterval(5);
      setHourInterval(2);
      setMinuteOfHour(0);
      setTriggerHour(9);
      setTriggerMinute(0);
      setSelectedWeekdays([1]);
      setSelectedMonthDay(1);
      setCronExpression('');
      setTimeZone('Asia/Shanghai');
      setStartDateTime(new Date());
      setEndDateTime(null);
      setEndTimeType('never');
      setEnableWorkCalendar(false);
      setWorkCalendarId(null);
      setWorkCalendarExecutionType('WORKDAY');
    } else if (taskRef.current) {
      taskRef.current.init();
    }
  }, [visible]);

  const validateTriggerName = (value: string) => {
    if (value && existingTriggerNames.includes(value.trim())) {
      return t('timeTrigger.validation.nameExists');
    }
    return '';
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // 验证 TaskForm
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
    if (ruleType === 'CRON' && !cronExpression.trim()) {
      Toast.warning(t('timeTrigger.validation.cronExpressionRequired'));
      return;
    }
    if (!startDateTime) {
      Toast.warning(t('timeTrigger.validation.startDateTimeRequired'));
      return;
    }
    if (enableWorkCalendar && !workCalendarId) {
      Toast.warning(t('timeTrigger.validation.workCalendarRequired'));
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const finalCronExpression = ruleType === 'CRON' ? cronExpression : generatedCronExpression;
      console.log('Creating time trigger:', { cron: finalCronExpression });
      Toast.success(t('timeTrigger.createModal.success'));
      onSuccess();
    } catch (error) {
      console.error('Failed to create time trigger:', error);
      Toast.error(t('timeTrigger.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  // Step0: 基本信息
  const renderStep0Content = () => (
    <div className="create-time-trigger-modal-section">
      <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.basicSection')}</div>
      <Form labelPosition="top">
        <Form.Input
          field="triggerName"
          label={t('timeTrigger.fields.name')}
          placeholder={t('timeTrigger.fields.namePlaceholder')}
          maxLength={255}
          showClear
          rules={[
            { required: true, message: t('timeTrigger.validation.nameRequired') },
            { max: 255, message: t('timeTrigger.validation.nameLengthError') },
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
          label={t('timeTrigger.fields.description')}
          placeholder={t('timeTrigger.fields.descriptionPlaceholder')}
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

  // Step2: 触发规则
  const renderStep2Content = () => (
    <>
      <TriggerRuleConfig
        ruleType={ruleType}
        onRuleTypeChange={setRuleType}
        frequencyType={frequencyType}
        onFrequencyTypeChange={setFrequencyType}
        minuteInterval={minuteInterval}
        onMinuteIntervalChange={setMinuteInterval}
        hourInterval={hourInterval}
        onHourIntervalChange={setHourInterval}
        minuteOfHour={minuteOfHour}
        onMinuteOfHourChange={setMinuteOfHour}
        triggerHour={triggerHour}
        onTriggerHourChange={setTriggerHour}
        triggerMinute={triggerMinute}
        onTriggerMinuteChange={setTriggerMinute}
        selectedWeekdays={selectedWeekdays}
        onSelectedWeekdaysChange={setSelectedWeekdays}
        selectedMonthDay={selectedMonthDay}
        onSelectedMonthDayChange={setSelectedMonthDay}
        cronExpression={cronExpression}
        onCronExpressionChange={setCronExpression}
        timeZone={timeZone}
        onTimeZoneChange={setTimeZone}
        startDateTime={startDateTime}
        onStartDateTimeChange={setStartDateTime}
        endDateTime={endDateTime}
        onEndDateTimeChange={setEndDateTime}
        endTimeType={endTimeType}
        onEndTimeTypeChange={setEndTimeType}
        enableWorkCalendar={enableWorkCalendar}
        onEnableWorkCalendarChange={setEnableWorkCalendar}
        workCalendarId={workCalendarId}
        onWorkCalendarIdChange={setWorkCalendarId}
        workCalendarExecutionType={workCalendarExecutionType}
        onWorkCalendarExecutionTypeChange={setWorkCalendarExecutionType}
        workCalendarOptions={getWorkCalendarOptions()}
        showWorkCalendar={true}
      />
      <div className="create-time-trigger-modal-section" style={{ borderTop: '1px solid var(--semi-color-border)', paddingTop: 20 }}>
        <div className="create-time-trigger-modal-section-title">{t('timeTrigger.createModal.previewSection')}</div>
        <div className="create-time-trigger-modal-preview">
          <div className="create-time-trigger-modal-preview-title">{t('timeTrigger.createModal.previewTitle')}</div>
          {previewTimes.length > 0 ? (
            <ul className="create-time-trigger-modal-preview-list">
              {previewTimes.map((time, index) => (
                <li key={index}><span className="preview-index">{index + 1}.</span>{time}</li>
              ))}
            </ul>
          ) : (
            <div className="create-time-trigger-modal-preview-empty">{t('timeTrigger.createModal.noPreview')}</div>
          )}
        </div>
      </div>
    </>
  );

  const modalWidth = showRightPanel && currentStep === 1 ? 900 : 520;

  return (
    <Modal
      className="create-time-trigger-modal"
      title={t('timeTrigger.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={modalWidth}
      centered
    >
      <div className="create-time-trigger-modal-steps">
        <Steps current={currentStep} type="basic" size="small">
          <Steps.Step title={t('timeTrigger.createModal.steps.basicInfo')} />
          <Steps.Step title={t('timeTrigger.createModal.steps.taskConfig')} />
          <Steps.Step title={t('timeTrigger.createModal.steps.triggerRule')} />
        </Steps>
      </div>

      {currentStep === 0 && (
        <div className="create-time-trigger-modal-content">
          {renderStep0Content()}
        </div>
      )}

      {currentStep === 1 && (
        <TaskForm
          taskRef={taskRef}
          showParamsHandle={setShowRightPanel}
          source={TaskFormSource.TimerTrigger}
          preFormItem={taskPreFormItem}
          showRightPanel={showRightPanel}
        />
      )}

      {currentStep === 2 && (
        <div className="create-time-trigger-modal-content">
          {renderStep2Content()}
        </div>
      )}

      <div className="create-time-trigger-modal-footer">
        <Button theme="light" onClick={onCancel}>{t('common.cancel')}</Button>
        {currentStep > 0 && (
          <Button onClick={handlePrev}>{t('timeTrigger.createModal.prevStep')}</Button>
        )}
        {currentStep < 2 ? (
          <Button theme="solid" type="primary" onClick={handleNext}>{t('timeTrigger.createModal.nextStep')}</Button>
        ) : (
          <Button theme="solid" type="primary" onClick={handleSubmit} loading={loading}>{t('common.create')}</Button>
        )}
      </div>
    </Modal>
  );
};

export default CreateTimeTriggerModal;
