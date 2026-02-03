import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Select,
  Input,
  InputNumber,
  RadioGroup,
  Radio,
  Checkbox,
  CheckboxGroup,
  Button,
  Tooltip,
  Popover,
  DatePicker,
  Toast,
  Tag,
  Banner,
} from '@douyinfe/semi-ui';
import { IconHelpCircle, IconTick, IconClose } from '@douyinfe/semi-icons';
import type { TriggerRuleType, BasicFrequencyType } from '@/api';
import './index.less';

const { Text } = Typography;

export interface TriggerRuleConfigProps {
  ruleType: TriggerRuleType;
  onRuleTypeChange: (type: TriggerRuleType) => void;
  frequencyType: BasicFrequencyType;
  onFrequencyTypeChange: (type: BasicFrequencyType) => void;
  // 每N分钟
  minuteInterval: number;
  onMinuteIntervalChange: (value: number) => void;
  // 每M小时的第N分钟
  hourInterval: number;
  onHourIntervalChange: (value: number) => void;
  minuteOfHour: number;
  onMinuteOfHourChange: (value: number) => void;
  // 每日/每周/每月的时间 (时:分)
  triggerHour: number;
  onTriggerHourChange: (value: number) => void;
  triggerMinute: number;
  onTriggerMinuteChange: (value: number) => void;
  // 每周：选择的星期几 (0-6, 0=周日)
  selectedWeekdays: number[];
  onSelectedWeekdaysChange: (days: number[]) => void;
  // 每月：选择的日期 (1-31 或 'L' 表示最后一天)
  selectedMonthDay: number | 'L';
  onSelectedMonthDayChange: (day: number | 'L') => void;
  // Cron表达式
  cronExpression: string;
  onCronExpressionChange: (expression: string) => void;
  // 时区
  timeZone: string;
  onTimeZoneChange: (tz: string) => void;
  // 开始时间
  startDateTime: Date | null;
  onStartDateTimeChange: (date: Date | null) => void;
  // 结束时间
  endDateTime: Date | null;
  onEndDateTimeChange: (date: Date | null) => void;
  // 结束时间类型
  endTimeType: 'never' | 'custom';
  onEndTimeTypeChange: (type: 'never' | 'custom') => void;
  // 组件样式前缀
  classPrefix?: string;
}

// 常用时区列表
const timeZones = [
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)', offset: '+09:00' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (UTC+8)', offset: '+08:00' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+8)', offset: '+08:00' },
  { value: 'UTC', label: 'UTC (UTC+0)', offset: '+00:00' },
  { value: 'Europe/London', label: 'Europe/London (UTC+0)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1)', offset: '+01:00' },
  { value: 'America/New_York', label: 'America/New_York (UTC-5)', offset: '-05:00' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (UTC-8)', offset: '-08:00' },
];

// 星期选项
const weekdayOptions = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' },
];

// 日期选项 (1-31 + 最后一天)
const monthDayOptions = [
  ...Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}日` })),
  { value: 'L' as const, label: '最后一天' },
];

// Cron 示例
const cronExamples = [
  { expression: '0 9 * * *', description: '每天 09:00' },
  { expression: '0 8 * * 1', description: '每周一 08:00' },
  { expression: '0 9 * * 1-5', description: '工作日每天 09:00' },
  { expression: '59 23 L * *', description: '每月最后一天 23:59' },
  { expression: '*/5 * * * *', description: '每5分钟' },
  { expression: '0 9,15 * * *', description: '每天 09:00 和 15:00' },
];

const TriggerRuleConfig = ({
  ruleType,
  onRuleTypeChange,
  frequencyType,
  onFrequencyTypeChange,
  minuteInterval,
  onMinuteIntervalChange,
  hourInterval,
  onHourIntervalChange,
  minuteOfHour,
  onMinuteOfHourChange,
  triggerHour,
  onTriggerHourChange,
  triggerMinute,
  onTriggerMinuteChange,
  selectedWeekdays,
  onSelectedWeekdaysChange,
  selectedMonthDay,
  onSelectedMonthDayChange,
  cronExpression,
  onCronExpressionChange,
  timeZone,
  onTimeZoneChange,
  startDateTime,
  onStartDateTimeChange,
  endDateTime,
  onEndDateTimeChange,
  endTimeType,
  onEndTimeTypeChange,
  classPrefix = 'trigger-rule-config',
}: TriggerRuleConfigProps) => {
  const { t } = useTranslation();
  const [cronValidating, setCronValidating] = useState(false);
  const [cronValidResult, setCronValidResult] = useState<{ valid: boolean; message: string } | null>(null);

  // 根据基本类型配置自动生成 Cron 表达式
  const generatedCronExpression = useMemo(() => {
    if (ruleType !== 'BASIC') return '';

    switch (frequencyType) {
      case 'MINUTELY':
        // 每N分钟: */N * * * *
        return `*/${minuteInterval} * * * *`;
      case 'HOURLY':
        // 每M小时的第N分钟: N */M * * *
        return `${minuteOfHour} */${hourInterval} * * *`;
      case 'DAILY':
        // 每日: 分 时 * * *
        return `${triggerMinute} ${triggerHour} * * *`;
      case 'WEEKLY':
        // 每周: 分 时 * * 星期
        const weekdayStr = selectedWeekdays.length > 0 ? selectedWeekdays.sort().join(',') : '*';
        return `${triggerMinute} ${triggerHour} * * ${weekdayStr}`;
      case 'MONTHLY':
        // 每月: 分 时 日 * *
        const dayStr = selectedMonthDay === 'L' ? 'L' : selectedMonthDay;
        return `${triggerMinute} ${triggerHour} ${dayStr} * *`;
      default:
        return '';
    }
  }, [ruleType, frequencyType, minuteInterval, hourInterval, minuteOfHour, triggerHour, triggerMinute, selectedWeekdays, selectedMonthDay]);

  // 验证 Cron 表达式（模拟）
  const handleValidateCron = useCallback(async () => {
    if (!cronExpression.trim()) {
      Toast.warning(t('triggerRule.validation.cronRequired'));
      return;
    }

    setCronValidating(true);
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 简单的格式验证（5段，用空格分隔）
      const parts = cronExpression.trim().split(/\s+/);
      if (parts.length !== 5) {
        setCronValidResult({ valid: false, message: t('triggerRule.validation.cronFormatError') });
        return;
      }

      // 验证每个部分的基本格式
      const patterns = [
        /^(\*|[0-9]|[1-5][0-9])(\/[0-9]+)?$|^(\*\/[0-9]+)$|^([0-9]|[1-5][0-9])(,[0-9]|,[1-5][0-9])*$|^([0-9]|[1-5][0-9])-([0-9]|[1-5][0-9])$/, // 分钟
        /^(\*|[0-9]|1[0-9]|2[0-3])(\/[0-9]+)?$|^(\*\/[0-9]+)$|^([0-9]|1[0-9]|2[0-3])(,[0-9]|,1[0-9]|,2[0-3])*$|^([0-9]|1[0-9]|2[0-3])-([0-9]|1[0-9]|2[0-3])$/, // 小时
        /^(\*|L|\?|[1-9]|[12][0-9]|3[01])(\/[0-9]+)?$|^(\*\/[0-9]+)$/, // 日期
        /^(\*|[1-9]|1[0-2])(\/[0-9]+)?$|^(\*\/[0-9]+)$/, // 月份
        /^(\*|\?|[0-6])(\/[0-9]+)?$|^(\*\/[0-9]+)$|^[0-6](,[0-6])*$|^[0-6]-[0-6]$/, // 星期
      ];

      // 简化验证 - 实际应该调用后端 API
      const isValid = parts.every((part, index) => {
        // 基本检查：包含有效字符
        return /^[\d\*\/\-\,L\?]+$/.test(part);
      });

      if (isValid) {
        setCronValidResult({ valid: true, message: t('triggerRule.validation.cronValid') });
      } else {
        setCronValidResult({ valid: false, message: t('triggerRule.validation.cronFormatError') });
      }
    } catch (error) {
      setCronValidResult({ valid: false, message: t('triggerRule.validation.cronValidateError') });
    } finally {
      setCronValidating(false);
    }
  }, [cronExpression, t]);

  // Cron 表达式使用说明内容
  const cronHelpContent = (
    <div className={`${classPrefix}-cron-help`}>
      <div className={`${classPrefix}-cron-help-title`}>{t('triggerRule.cronHelp.title')}</div>
      <div className={`${classPrefix}-cron-help-format`}>
        <div className={`${classPrefix}-cron-help-format-row`}>
          <span className={`${classPrefix}-cron-help-format-field`}>{t('triggerRule.cronHelp.minute')}</span>
          <span className={`${classPrefix}-cron-help-format-field`}>{t('triggerRule.cronHelp.hour')}</span>
          <span className={`${classPrefix}-cron-help-format-field`}>{t('triggerRule.cronHelp.day')}</span>
          <span className={`${classPrefix}-cron-help-format-field`}>{t('triggerRule.cronHelp.month')}</span>
          <span className={`${classPrefix}-cron-help-format-field`}>{t('triggerRule.cronHelp.weekday')}</span>
        </div>
        <div className={`${classPrefix}-cron-help-format-row`}>
          <span className={`${classPrefix}-cron-help-format-range`}>0-59</span>
          <span className={`${classPrefix}-cron-help-format-range`}>0-23</span>
          <span className={`${classPrefix}-cron-help-format-range`}>1-31</span>
          <span className={`${classPrefix}-cron-help-format-range`}>1-12</span>
          <span className={`${classPrefix}-cron-help-format-range`}>0-6</span>
        </div>
      </div>
      <div className={`${classPrefix}-cron-help-symbols`}>
        <div className={`${classPrefix}-cron-help-symbols-title`}>{t('triggerRule.cronHelp.symbolsTitle')}</div>
        <ul>
          <li><code>*</code> - {t('triggerRule.cronHelp.symbolAny')}</li>
          <li><code>,</code> - {t('triggerRule.cronHelp.symbolList')}</li>
          <li><code>-</code> - {t('triggerRule.cronHelp.symbolRange')}</li>
          <li><code>/</code> - {t('triggerRule.cronHelp.symbolStep')}</li>
          <li><code>L</code> - {t('triggerRule.cronHelp.symbolLast')}</li>
          <li><code>?</code> - {t('triggerRule.cronHelp.symbolAnyDay')}</li>
        </ul>
      </div>
    </div>
  );

  // Cron 示例内容
  const cronExamplesContent = (
    <div className={`${classPrefix}-cron-examples`}>
      <div className={`${classPrefix}-cron-examples-title`}>{t('triggerRule.cronExamples.title')}</div>
      <ul className={`${classPrefix}-cron-examples-list`}>
        {cronExamples.map((example, index) => (
          <li
            key={index}
            className={`${classPrefix}-cron-examples-item`}
            onClick={() => onCronExpressionChange(example.expression)}
          >
            <code>{example.expression}</code>
            <span>{example.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  // 渲染基本类型的频率配置
  const renderBasicFrequencyConfig = () => {
    switch (frequencyType) {
      case 'MINUTELY':
        return (
          <div className={`${classPrefix}-inline-field`}>
            <span>{t('triggerRule.basic.every')}</span>
            <InputNumber
              value={minuteInterval}
              onChange={(v) => onMinuteIntervalChange(v as number)}
              min={1}
              max={59}
              style={{ width: 80 }}
            />
            <span>{t('triggerRule.basic.minuteExecute')}</span>
          </div>
        );

      case 'HOURLY':
        return (
          <div className={`${classPrefix}-inline-field`}>
            <span>{t('triggerRule.basic.every')}</span>
            <InputNumber
              value={hourInterval}
              onChange={(v) => onHourIntervalChange(v as number)}
              min={1}
              max={23}
              style={{ width: 80 }}
            />
            <span>{t('triggerRule.basic.hourAt')}</span>
            <InputNumber
              value={minuteOfHour}
              onChange={(v) => onMinuteOfHourChange(v as number)}
              min={0}
              max={59}
              style={{ width: 80 }}
            />
            <span>{t('triggerRule.basic.minuteExecute')}</span>
          </div>
        );

      case 'DAILY':
        return (
          <div className={`${classPrefix}-time-picker`}>
            <Text className={`${classPrefix}-field-label`}>{t('triggerRule.basic.triggerTime')}</Text>
            <div className={`${classPrefix}-time-picker-inputs`}>
              <InputNumber
                value={triggerHour}
                onChange={(v) => onTriggerHourChange(v as number)}
                min={0}
                max={23}
                style={{ width: 80 }}
                formatter={(v) => String(v).padStart(2, '0')}
              />
              <span className={`${classPrefix}-time-separator`}>:</span>
              <InputNumber
                value={triggerMinute}
                onChange={(v) => onTriggerMinuteChange(v as number)}
                min={0}
                max={59}
                style={{ width: 80 }}
                formatter={(v) => String(v).padStart(2, '0')}
              />
            </div>
          </div>
        );

      case 'WEEKLY':
        return (
          <>
            <div className={`${classPrefix}-field`}>
              <Text className={`${classPrefix}-field-label`}>{t('triggerRule.basic.selectWeekdays')}</Text>
              <CheckboxGroup
                value={selectedWeekdays}
                onChange={(values) => onSelectedWeekdaysChange(values as number[])}
                direction="horizontal"
              >
                {weekdayOptions.map((option) => (
                  <Checkbox key={option.value} value={option.value}>
                    {option.label}
                  </Checkbox>
                ))}
              </CheckboxGroup>
            </div>
            <div className={`${classPrefix}-time-picker`}>
              <Text className={`${classPrefix}-field-label`}>{t('triggerRule.basic.triggerTime')}</Text>
              <div className={`${classPrefix}-time-picker-inputs`}>
                <InputNumber
                  value={triggerHour}
                  onChange={(v) => onTriggerHourChange(v as number)}
                  min={0}
                  max={23}
                  style={{ width: 80 }}
                  formatter={(v) => String(v).padStart(2, '0')}
                />
                <span className={`${classPrefix}-time-separator`}>:</span>
                <InputNumber
                  value={triggerMinute}
                  onChange={(v) => onTriggerMinuteChange(v as number)}
                  min={0}
                  max={59}
                  style={{ width: 80 }}
                  formatter={(v) => String(v).padStart(2, '0')}
                />
              </div>
            </div>
          </>
        );

      case 'MONTHLY':
        return (
          <>
            <div className={`${classPrefix}-field`}>
              <Text className={`${classPrefix}-field-label`}>{t('triggerRule.basic.selectMonthDay')}</Text>
              <Select
                value={selectedMonthDay}
                onChange={(v) => onSelectedMonthDayChange(v as number | 'L')}
                optionList={monthDayOptions}
                style={{ width: '100%' }}
              />
            </div>
            <div className={`${classPrefix}-time-picker`}>
              <Text className={`${classPrefix}-field-label`}>{t('triggerRule.basic.triggerTime')}</Text>
              <div className={`${classPrefix}-time-picker-inputs`}>
                <InputNumber
                  value={triggerHour}
                  onChange={(v) => onTriggerHourChange(v as number)}
                  min={0}
                  max={23}
                  style={{ width: 80 }}
                  formatter={(v) => String(v).padStart(2, '0')}
                />
                <span className={`${classPrefix}-time-separator`}>:</span>
                <InputNumber
                  value={triggerMinute}
                  onChange={(v) => onTriggerMinuteChange(v as number)}
                  min={0}
                  max={59}
                  style={{ width: 80 }}
                  formatter={(v) => String(v).padStart(2, '0')}
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={classPrefix}>
      {/* 规则类型 */}
      <div className={`${classPrefix}-field`}>
        <Text className={`${classPrefix}-field-label`}>{t('triggerRule.fields.ruleType')} *</Text>
        <RadioGroup
          value={ruleType}
          onChange={(e) => {
            onRuleTypeChange(e.target.value as TriggerRuleType);
            setCronValidResult(null);
          }}
          direction="horizontal"
        >
          <Radio value="BASIC">{t('triggerRule.ruleType.basic')}</Radio>
          <Radio value="CRON">{t('triggerRule.ruleType.cron')}</Radio>
        </RadioGroup>
      </div>

      {ruleType === 'BASIC' ? (
        <>
          {/* 运行频率 */}
          <div className={`${classPrefix}-field`}>
            <Text className={`${classPrefix}-field-label`}>{t('triggerRule.fields.frequencyType')} *</Text>
            <Select
              value={frequencyType}
              onChange={(v) => onFrequencyTypeChange(v as BasicFrequencyType)}
              optionList={[
                { value: 'MINUTELY', label: t('triggerRule.frequency.minutely') },
                { value: 'HOURLY', label: t('triggerRule.frequency.hourly') },
                { value: 'DAILY', label: t('triggerRule.frequency.daily') },
                { value: 'WEEKLY', label: t('triggerRule.frequency.weekly') },
                { value: 'MONTHLY', label: t('triggerRule.frequency.monthly') },
              ]}
              style={{ width: '100%' }}
            />
          </div>

          {/* 频率详细配置 */}
          {renderBasicFrequencyConfig()}

          {/* 生成的 Cron 表达式（只读展示） */}
          {generatedCronExpression && (
            <div className={`${classPrefix}-generated-cron`}>
              <Text className={`${classPrefix}-field-label`}>{t('triggerRule.fields.generatedCron')}</Text>
              <div className={`${classPrefix}-generated-cron-value`}>
                <code>{generatedCronExpression}</code>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Cron 表达式输入 */}
          <div className={`${classPrefix}-field`}>
            <div className={`${classPrefix}-field-label-row`}>
              <Text className={`${classPrefix}-field-label`}>{t('triggerRule.fields.cronExpression')} *</Text>
              <div className={`${classPrefix}-field-actions`}>
                <Popover content={cronHelpContent} position="bottomLeft" trigger="click">
                  <Button size="small" theme="borderless" icon={<IconHelpCircle />}>
                    {t('triggerRule.cronHelp.buttonText')}
                  </Button>
                </Popover>
                <Popover content={cronExamplesContent} position="bottomLeft" trigger="click">
                  <Button size="small" theme="borderless">
                    {t('triggerRule.cronExamples.buttonText')}
                  </Button>
                </Popover>
              </div>
            </div>
            <div className={`${classPrefix}-cron-input-row`}>
              <Input
                placeholder={t('triggerRule.fields.cronPlaceholder')}
                value={cronExpression}
                onChange={onCronExpressionChange}
                style={{ flex: 1 }}
              />
              <Button
                onClick={handleValidateCron}
                loading={cronValidating}
              >
                {t('triggerRule.cronValidate.button')}
              </Button>
            </div>
            <div className={`${classPrefix}-field-hint`}>
              {t('triggerRule.fields.cronHint')}
            </div>
            {cronValidResult && (
              <Banner
                type={cronValidResult.valid ? 'success' : 'danger'}
                description={cronValidResult.message}
                icon={cronValidResult.valid ? <IconTick /> : <IconClose />}
                closeIcon={null}
                className={`${classPrefix}-cron-result`}
              />
            )}
          </div>
        </>
      )}

      {/* 时区 */}
      <div className={`${classPrefix}-field`}>
        <Text className={`${classPrefix}-field-label`}>{t('triggerRule.fields.timeZone')} *</Text>
        <Select
          value={timeZone}
          onChange={(v) => onTimeZoneChange(v as string)}
          optionList={timeZones}
          filter
          style={{ width: '100%' }}
        />
      </div>

      {/* 开始时间 */}
      <div className={`${classPrefix}-field`}>
        <Text className={`${classPrefix}-field-label`}>{t('triggerRule.fields.startDateTime')} *</Text>
        <DatePicker
          type="dateTime"
          value={startDateTime}
          onChange={(v) => onStartDateTimeChange(v as Date)}
          disabledDate={(date) => date && date < new Date(new Date().setHours(0, 0, 0, 0))}
          style={{ width: '100%' }}
        />
      </div>

      {/* 结束时间 */}
      <div className={`${classPrefix}-field`}>
        <Text className={`${classPrefix}-field-label`}>{t('triggerRule.fields.endDateTime')}</Text>
        <RadioGroup
          value={endTimeType}
          onChange={(e) => {
            onEndTimeTypeChange(e.target.value as 'never' | 'custom');
            if (e.target.value === 'never') {
              onEndDateTimeChange(null);
            }
          }}
          direction="horizontal"
          className={`${classPrefix}-end-time-type`}
        >
          <Radio value="never">{t('triggerRule.fields.endTimeNever')}</Radio>
          <Radio value="custom">{t('triggerRule.fields.endTimeCustom')}</Radio>
        </RadioGroup>
        {endTimeType === 'custom' && (
          <DatePicker
            type="dateTime"
            value={endDateTime}
            onChange={(v) => onEndDateTimeChange(v as Date | null)}
            disabledDate={(date) => date && startDateTime && date <= startDateTime}
            placeholder={t('triggerRule.fields.endDateTimePlaceholder')}
            style={{ width: '100%', marginTop: 8 }}
          />
        )}
      </div>
    </div>
  );
};

export default TriggerRuleConfig;
