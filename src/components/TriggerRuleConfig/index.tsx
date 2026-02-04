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
  Popover,
  DatePicker,
  Switch,
  Tag,
  TagInput,
  Banner,
} from '@douyinfe/semi-ui';
import { IconHelpCircle, IconTick, IconClose } from '@douyinfe/semi-icons';
import type { TriggerRuleType, BasicFrequencyType } from '@/api';
import './index.less';

const { Text } = Typography;

// 运行规则类型：指定时间 或 重复执行
type ExecutionRuleType = 'FIXED_TIME' | 'REPEAT';

// 月度日期类型：按日 或 当月最后一日
type MonthDayType = 'BY_DAY' | 'LAST_DAY';

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
  // 工作日历
  enableWorkCalendar?: boolean;
  onEnableWorkCalendarChange?: (enabled: boolean) => void;
  workCalendarId?: string | null;
  onWorkCalendarIdChange?: (id: string | null) => void;
  workCalendarExecutionType?: 'WORKDAY' | 'NON_WORKDAY';
  onWorkCalendarExecutionTypeChange?: (type: 'WORKDAY' | 'NON_WORKDAY') => void;
  workCalendarOptions?: { value: string; label: string }[];
  // 组件样式前缀
  classPrefix?: string;
  // 是否显示工作日历配置
  showWorkCalendar?: boolean;
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

// 月份选项
const monthOptions = [
  { value: 1, label: '1月' },
  { value: 2, label: '2月' },
  { value: 3, label: '3月' },
  { value: 4, label: '4月' },
  { value: 5, label: '5月' },
  { value: 6, label: '6月' },
  { value: 7, label: '7月' },
  { value: 8, label: '8月' },
  { value: 9, label: '9月' },
  { value: 10, label: '10月' },
  { value: 11, label: '11月' },
  { value: 12, label: '12月' },
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
  enableWorkCalendar = false,
  onEnableWorkCalendarChange,
  workCalendarId,
  onWorkCalendarIdChange,
  workCalendarExecutionType = 'WORKDAY',
  onWorkCalendarExecutionTypeChange,
  workCalendarOptions = [],
  classPrefix = 'trigger-rule-config',
  showWorkCalendar = true,
}: TriggerRuleConfigProps) => {
  const { t } = useTranslation();
  const [cronValidating, setCronValidating] = useState(false);
  const [cronValidResult, setCronValidResult] = useState<{ valid: boolean; message: string } | null>(null);
  
  // 新增状态：运行规则类型
  const [executionRuleType, setExecutionRuleType] = useState<ExecutionRuleType>('FIXED_TIME');
  // 重复执行的间隔
  const [repeatInterval, setRepeatInterval] = useState<number>(1);
  const [repeatUnit, setRepeatUnit] = useState<'MINUTE' | 'HOUR'>('MINUTE');
  // 月份选择（每月触发时）
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1]);
  // 月度日期类型
  const [monthDayType, setMonthDayType] = useState<MonthDayType>('BY_DAY');
  // 按日选择的日期（多选）
  const [selectedMonthDays, setSelectedMonthDays] = useState<string[]>(['1']);

  // 根据基本类型配置自动生成 Cron 表达式
  const generatedCronExpression = useMemo(() => {
    if (ruleType !== 'BASIC') return '';

    if (executionRuleType === 'REPEAT') {
      // 重复执行模式
      if (repeatUnit === 'MINUTE') {
        return `*/${repeatInterval} * * * *`;
      } else {
        return `0 */${repeatInterval} * * *`;
      }
    }

    // 指定时间模式
    switch (frequencyType) {
      case 'DAILY':
        return `${triggerMinute} ${triggerHour} * * *`;
      case 'WEEKLY':
        const weekdayStr = selectedWeekdays.length > 0 ? selectedWeekdays.sort().join(',') : '*';
        return `${triggerMinute} ${triggerHour} * * ${weekdayStr}`;
      case 'MONTHLY':
        const monthStr = selectedMonths.length > 0 ? selectedMonths.sort((a, b) => a - b).join(',') : '*';
        if (monthDayType === 'LAST_DAY') {
          return `${triggerMinute} ${triggerHour} L ${monthStr} *`;
        }
        const dayStr = selectedMonthDays.length > 0 ? selectedMonthDays.join(',') : '1';
        return `${triggerMinute} ${triggerHour} ${dayStr} ${monthStr} *`;
      default:
        return '';
    }
  }, [ruleType, executionRuleType, frequencyType, triggerHour, triggerMinute, selectedWeekdays, selectedMonths, monthDayType, selectedMonthDays, repeatInterval, repeatUnit]);

  // 验证 Cron 表达式（模拟）
  const handleValidateCron = useCallback(async () => {
    if (!cronExpression.trim()) {
      setCronValidResult({ valid: false, message: t('triggerRule.validation.cronRequired') });
      return;
    }

    setCronValidating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const parts = cronExpression.trim().split(/\s+/);
      if (parts.length !== 5) {
        setCronValidResult({ valid: false, message: t('triggerRule.validation.cronFormatError') });
        return;
      }

      const isValid = parts.every((part) => {
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

  // Cron 帮助和示例合并内容
  const cronHelpAndExamplesContent = (
    <div className={`${classPrefix}-cron-help-combined`}>
      {/* 使用说明 */}
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
          </ul>
        </div>
      </div>

      {/* 分隔线 */}
      <div className={`${classPrefix}-cron-divider`} />

      {/* 常用示例 */}
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
    </div>
  );

  // 处理星期全选
  const handleWeekdaySelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedWeekdaysChange([1, 2, 3, 4, 5, 6, 0]);
    } else {
      onSelectedWeekdaysChange([]);
    }
  };

  // 处理月份全选
  const handleMonthSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    } else {
      setSelectedMonths([]);
    }
  };

  // 渲染基本规则配置
  const renderBasicRuleConfig = () => {
    return (
      <div className={`${classPrefix}-basic-rule`}>
        {/* 运行频率 - RadioGroup 样式 */}
        <div className={`${classPrefix}-field`}>
          <Text className={`${classPrefix}-section-title`}>{t('triggerRule.fields.frequencyType')}</Text>
          <RadioGroup
            value={frequencyType}
            onChange={(e) => {
              onFrequencyTypeChange(e.target.value as BasicFrequencyType);
              // 重置执行规则类型
              setExecutionRuleType('FIXED_TIME');
            }}
            direction="horizontal"
            className={`${classPrefix}-frequency-radio`}
          >
            <Radio value="DAILY">{t('triggerRule.frequency.daily')}</Radio>
            <Radio value="WEEKLY">{t('triggerRule.frequency.weekly')}</Radio>
            <Radio value="MONTHLY">{t('triggerRule.frequency.monthly')}</Radio>
          </RadioGroup>
        </div>

        {/* 运行规则 */}
        <div className={`${classPrefix}-rule-box`}>
          <Text className={`${classPrefix}-section-title`}>{t('triggerRule.executionRule.title')}</Text>
          
          {/* 每周 - 星期选择 */}
          {frequencyType === 'WEEKLY' && (
            <div className={`${classPrefix}-weekday-selection`}>
              <Checkbox
                checked={selectedWeekdays.length === 7}
                indeterminate={selectedWeekdays.length > 0 && selectedWeekdays.length < 7}
                onChange={(e) => handleWeekdaySelectAll(e.target.checked)}
              >
                {t('common.selectAll')}
              </Checkbox>
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
          )}

          {/* 每月 - 月份选择 */}
          {frequencyType === 'MONTHLY' && (
            <>
              <div className={`${classPrefix}-month-selection`}>
                <Checkbox
                  checked={selectedMonths.length === 12}
                  indeterminate={selectedMonths.length > 0 && selectedMonths.length < 12}
                  onChange={(e) => handleMonthSelectAll(e.target.checked)}
                >
                  {t('common.selectAll')}
                </Checkbox>
                <CheckboxGroup
                  value={selectedMonths}
                  onChange={(values) => setSelectedMonths(values as number[])}
                  direction="horizontal"
                  className={`${classPrefix}-month-checkbox-group`}
                >
                  {monthOptions.map((option) => (
                    <Checkbox key={option.value} value={option.value}>
                      {option.label}
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              </div>

              {/* 日期类型选择 */}
              <div className={`${classPrefix}-month-day-type`}>
                <RadioGroup
                  value={monthDayType}
                  onChange={(e) => setMonthDayType(e.target.value as MonthDayType)}
                  direction="horizontal"
                >
                  <Radio value="BY_DAY">{t('triggerRule.monthDayType.byDay')}</Radio>
                  <Radio value="LAST_DAY">{t('triggerRule.monthDayType.lastDay')}</Radio>
                </RadioGroup>
              </div>

              {/* 按日选择 */}
              {monthDayType === 'BY_DAY' && (
                <div className={`${classPrefix}-day-selection`}>
                  <span>{t('triggerRule.daySelection.prefix')}</span>
                  <TagInput
                    value={selectedMonthDays}
                    onChange={(values) => setSelectedMonthDays(values as string[])}
                    placeholder={t('triggerRule.daySelection.placeholder')}
                    style={{ width: 200 }}
                  />
                </div>
              )}
            </>
          )}

          {/* 执行规则类型：指定时间 或 重复执行 */}
          <div className={`${classPrefix}-execution-rule-type`}>
            <RadioGroup
              value={executionRuleType}
              onChange={(e) => setExecutionRuleType(e.target.value as ExecutionRuleType)}
              direction="horizontal"
            >
              <Radio value="FIXED_TIME">{t('triggerRule.executionRule.fixedTime')}</Radio>
              <Radio value="REPEAT">{t('triggerRule.executionRule.repeat')}</Radio>
            </RadioGroup>
          </div>

          {/* 执行时间/间隔配置 */}
          {executionRuleType === 'FIXED_TIME' ? (
            <div className={`${classPrefix}-fixed-time`}>
              <span>{t('triggerRule.executionRule.at')}</span>
              <Select
                value={triggerHour}
                onChange={(v) => onTriggerHourChange(v as number)}
                style={{ width: 80 }}
                optionList={Array.from({ length: 24 }, (_, i) => ({ value: i, label: String(i) }))}
              />
              <span>{t('triggerRule.executionRule.hourSuffix')}</span>
              <Select
                value={triggerMinute}
                onChange={(v) => onTriggerMinuteChange(v as number)}
                style={{ width: 80 }}
                optionList={Array.from({ length: 60 }, (_, i) => ({ value: i, label: String(i) }))}
              />
              <span>{t('triggerRule.executionRule.minuteSuffix')}</span>
            </div>
          ) : (
            <div className={`${classPrefix}-repeat-time`}>
              <span>{t('triggerRule.executionRule.every')}</span>
              <Select
                value={repeatInterval}
                onChange={(v) => setRepeatInterval(v as number)}
                style={{ width: 80 }}
                optionList={Array.from({ length: 60 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
              />
              <Select
                value={repeatUnit}
                onChange={(v) => setRepeatUnit(v as 'MINUTE' | 'HOUR')}
                style={{ width: 100 }}
                optionList={[
                  { value: 'MINUTE', label: t('triggerRule.executionRule.minute') },
                  { value: 'HOUR', label: t('triggerRule.executionRule.hour') },
                ]}
              />
              <span>{t('triggerRule.executionRule.executeOnce')}</span>
            </div>
          )}
        </div>

      </div>
    );
  };

  return (
    <div className={classPrefix}>
      {/* 分类一：触发周期（无标题） */}
      <div className={`${classPrefix}-category`}>
        {/* 触发器时区 */}
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

        {/* 启用工作日历 */}
        {showWorkCalendar && (
          <>
            <div className={`${classPrefix}-field ${classPrefix}-field-inline`}>
              <Text className={`${classPrefix}-field-label`}>{t('triggerRule.fields.enableWorkCalendar')}</Text>
              <Switch 
                checked={enableWorkCalendar} 
                onChange={(v) => onEnableWorkCalendarChange?.(v)} 
              />
            </div>
            {enableWorkCalendar && (
              <>
                <div className={`${classPrefix}-field`}>
                  <Text className={`${classPrefix}-field-label`}>{t('triggerRule.fields.workCalendar')} *</Text>
                  <Select
                    placeholder={t('triggerRule.fields.workCalendarPlaceholder')}
                    value={workCalendarId}
                    onChange={(v) => onWorkCalendarIdChange?.(v as string)}
                    optionList={workCalendarOptions}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className={`${classPrefix}-field`}>
                  <Text className={`${classPrefix}-field-label`}>{t('triggerRule.fields.executionType')}</Text>
                  <RadioGroup
                    value={workCalendarExecutionType}
                    onChange={(e) => onWorkCalendarExecutionTypeChange?.(e.target.value as 'WORKDAY' | 'NON_WORKDAY')}
                    direction="horizontal"
                  >
                    <Radio value="WORKDAY">{t('triggerRule.fields.executionTypeWorkday')}</Radio>
                    <Radio value="NON_WORKDAY">{t('triggerRule.fields.executionTypeNonWorkday')}</Radio>
                  </RadioGroup>
                </div>
              </>
            )}
          </>
        )}

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

      {/* 分类二：触发规则（无标题） */}
      <div className={`${classPrefix}-category`}>
        {/* 触发规则类型选择 */}
        <div className={`${classPrefix}-field`}>
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
          renderBasicRuleConfig()
        ) : (
          <>
            {/* Cron 表达式输入 */}
            <div className={`${classPrefix}-field`}>
              <div className={`${classPrefix}-field-label-row`}>
                <Text className={`${classPrefix}-field-label`}>{t('triggerRule.fields.cronExpression')} *</Text>
                <Popover 
                  content={cronHelpAndExamplesContent} 
                  position="right" 
                  trigger="hover"
                  showArrow
                >
                  <IconHelpCircle 
                    size="small" 
                    className={`${classPrefix}-cron-help-icon`}
                  />
                </Popover>
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
      </div>
    </div>
  );
};

export default TriggerRuleConfig;
