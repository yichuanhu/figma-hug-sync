import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Form, DatePicker, Toast } from '@douyinfe/semi-ui';
import YearCalendarGrid from '../YearCalendarGrid';
import type { LYWorkCalendarResponse, LYSpecialDate } from '@/api/index';
import './index.less';

const { Title, Text } = Typography;

interface CalendarEditorProps {
  calendar: LYWorkCalendarResponse;
  onCancel: () => void;
  onSave: (data: {
    name: string;
    start_date: string;
    end_date: string;
    special_dates: LYSpecialDate[];
  }) => void;
}

const CalendarEditor: React.FC<CalendarEditorProps> = ({
  calendar,
  onCancel,
  onSave,
}) => {
  const { t } = useTranslation();
  
  // Local state for editing
  const [name, setName] = useState(calendar.name);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(calendar.start_date),
    new Date(calendar.end_date),
  ]);
  const [specialDates, setSpecialDates] = useState<LYSpecialDate[]>(calendar.special_dates);
  const [saving, setSaving] = useState(false);

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle date toggle in calendar grid
  const handleDateToggle = useCallback((date: string, isNonWorkday: boolean) => {
    setSpecialDates((prev) => {
      if (isNonWorkday) {
        // If it's currently a non-workday, remove from special dates (make it workday)
        // But only if it was added as a special HOLIDAY
        const existing = prev.find((d) => d.date === date && d.type === 'HOLIDAY');
        if (existing) {
          return prev.filter((d) => d.date !== date || d.type !== 'HOLIDAY');
        }
        // If it's a weekend, add as WORKDAY (调休)
        return [...prev, { date, type: 'WORKDAY' as const }];
      } else {
        // If it's currently a workday, check if it was a WORKDAY special date
        const existingWorkday = prev.find((d) => d.date === date && d.type === 'WORKDAY');
        if (existingWorkday) {
          // Remove the WORKDAY special date (revert to weekend)
          return prev.filter((d) => d.date !== date || d.type !== 'WORKDAY');
        }
        // Add as HOLIDAY
        return [...prev, { date, type: 'HOLIDAY' as const }];
      }
    });
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Toast.error(t('workCalendar.validation.nameRequired'));
      return;
    }
    
    if (!dateRange[0] || !dateRange[1]) {
      Toast.error(t('workCalendar.validation.periodRequired'));
      return;
    }
    
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
      onSave({
        name: name.trim(),
        start_date: formatDate(dateRange[0]),
        end_date: formatDate(dateRange[1]),
        special_dates: specialDates,
      });
    } catch (error) {
      Toast.error(t('workCalendar.editor.saveError'));
    } finally {
      setSaving(false);
    }
  }, [name, dateRange, specialDates, onSave, t]);


  const startDate = useMemo(() => formatDate(dateRange[0]), [dateRange]);
  const endDate = useMemo(() => formatDate(dateRange[1]), [dateRange]);

  return (
    <div className="calendar-editor">
      {/* 头部 */}
      <div className="calendar-editor-header">
        <Title heading={5} className="calendar-editor-header-title">
          {t('workCalendar.editor.title')}
        </Title>
      </div>

      {/* 内容区 */}
      <div className="calendar-editor-content">
        {/* 表单区域 */}
        <div className="calendar-editor-form">
          <Form
            labelPosition="left"
            labelWidth={80}
            labelAlign="right"
            initValues={{ name: calendar.name }}
          >
            <Form.Slot label={t('workCalendar.editor.name')}>
              <Form.Input
                field="name"
                noLabel
                placeholder={t('workCalendar.editor.namePlaceholder')}
                initValue={name}
                onChange={(value) => setName(value as string)}
                maxLength={50}
                showClear
              />
            </Form.Slot>
            <Form.Slot label={t('workCalendar.editor.period')}>
              <DatePicker
                type="dateRange"
                value={dateRange}
                onChange={(value) => setDateRange(value as [Date, Date])}
                style={{ width: '100%' }}
              />
            </Form.Slot>
          </Form>
        </div>

        {/* 日历编辑区域 */}
        <div className="calendar-editor-calendar">
          <Text className="calendar-editor-section-title">
            {t('workCalendar.editor.calendarEdit')}
          </Text>
          <Text type="tertiary" size="small" className="calendar-editor-hint">
            {t('workCalendar.editor.clickToToggle')}
          </Text>
          <YearCalendarGrid
            startDate={startDate}
            endDate={endDate}
            weekendDays={calendar.weekend_days}
            specialDates={specialDates}
            readonly={false}
            onDateToggle={handleDateToggle}
          />
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="calendar-editor-footer">
        <Button onClick={onCancel}>
          {t('workCalendar.editor.cancel')}
        </Button>
        <Button
          theme="solid"
          type="primary"
          loading={saving}
          onClick={handleSave}
        >
          {t('workCalendar.editor.save')}
        </Button>
      </div>
    </div>
  );
};

export default CalendarEditor;
