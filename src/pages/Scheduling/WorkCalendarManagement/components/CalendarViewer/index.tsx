import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Descriptions } from '@douyinfe/semi-ui';
import { IconEditStroked } from '@douyinfe/semi-icons';
import { format } from 'date-fns';
import YearCalendarGrid from '../YearCalendarGrid';
import type { LYWorkCalendarResponse } from '@/api/index';
import './index.less';

const { Title, Text } = Typography;

interface CalendarViewerProps {
  calendar: LYWorkCalendarResponse;
  onEdit: () => void;
}

const CalendarViewer: React.FC<CalendarViewerProps> = ({ calendar, onEdit }) => {
  const { t } = useTranslation();

  const templateLabel = useMemo(() => {
    switch (calendar.template) {
      case 'WEEKEND_DOUBLE':
        return t('workCalendar.template.weekendDouble');
      case 'WEEKEND_SINGLE':
        return t('workCalendar.template.weekendSingle');
      case 'BLANK':
        return t('workCalendar.template.blank');
      default:
        return '-';
    }
  }, [calendar.template, t]);

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm:ss');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="calendar-viewer">
      {/* 头部 */}
      <div className="calendar-viewer-header">
        <Title heading={5} className="calendar-viewer-header-title">
          {calendar.name}
        </Title>
        <Button
          icon={<IconEditStroked />}
          onClick={onEdit}
        >
          {t('workCalendar.viewer.edit')}
        </Button>
      </div>

      {/* 内容区 */}
      <div className="calendar-viewer-content">
        {/* 基本信息 */}
        <div className="calendar-viewer-section">
          <Text className="calendar-viewer-section-title">
            {t('workCalendar.viewer.basicInfo')}
          </Text>
          <Descriptions align="left">
            <Descriptions.Item itemKey={t('workCalendar.viewer.name')}>
              {calendar.name}
            </Descriptions.Item>
            <Descriptions.Item itemKey={t('workCalendar.viewer.template')}>
              {templateLabel}
            </Descriptions.Item>
            <Descriptions.Item itemKey={t('workCalendar.viewer.period')}>
              {calendar.start_date} ~ {calendar.end_date}
            </Descriptions.Item>
            <Descriptions.Item itemKey={t('workCalendar.viewer.creator')}>
              {calendar.creator_name || calendar.creator_id}
            </Descriptions.Item>
            <Descriptions.Item itemKey={t('workCalendar.viewer.createTime')}>
              {formatDateTime(calendar.created_at)}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* 日历预览 */}
        <div className="calendar-viewer-section">
          <Text className="calendar-viewer-section-title">
            {t('workCalendar.viewer.calendarPreview')}
          </Text>
          <div className="calendar-viewer-legend">
            <div className="calendar-viewer-legend-item">
              <span className="calendar-viewer-legend-dot calendar-viewer-legend-dot-nonworkday" />
              <Text type="tertiary" size="small">{t('workCalendar.viewer.legendNonWorkday')}</Text>
            </div>
          </div>
          <YearCalendarGrid
            startDate={calendar.start_date}
            endDate={calendar.end_date}
            weekendDays={calendar.weekend_days}
            specialDates={calendar.special_dates}
            readonly
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarViewer;
