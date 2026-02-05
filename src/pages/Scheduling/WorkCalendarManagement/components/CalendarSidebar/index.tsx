import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Typography, Dropdown, Modal } from '@douyinfe/semi-ui';
import { IconPlus, IconMore, IconDeleteStroked } from '@douyinfe/semi-icons';
import type { LYWorkCalendarResponse } from '@/api/index';
import './index.less';

const { Text } = Typography;

interface CalendarSidebarProps {
  calendars: LYWorkCalendarResponse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  calendars,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
}) => {
  const { t } = useTranslation();

  const handleDelete = (calendar: LYWorkCalendarResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (calendar.reference_count > 0) {
      Modal.warning({
        title: t('workCalendar.sidebar.deleteConfirmTitle'),
        content: t('workCalendar.sidebar.cannotDelete'),
      });
      return;
    }
    
    Modal.confirm({
      title: t('workCalendar.sidebar.deleteConfirmTitle'),
      content: t('workCalendar.sidebar.deleteConfirmMessage', { name: calendar.name }),
      okType: 'danger',
      onOk: () => onDelete(calendar.id),
    });
  };

  const renderCalendarItem = (calendar: LYWorkCalendarResponse) => {
    const isSelected = calendar.id === selectedId;
    const canDelete = calendar.reference_count === 0;
    
    return (
      <div
        key={calendar.id}
        className={`calendar-sidebar-item ${isSelected ? 'calendar-sidebar-item-selected' : ''}`}
        onClick={() => onSelect(calendar.id)}
      >
        <div className="calendar-sidebar-item-content">
          <Text 
            className="calendar-sidebar-item-name" 
            ellipsis={{ showTooltip: true }}
          >
            {calendar.name}
          </Text>
          <Text 
            type="tertiary" 
            size="small" 
            className="calendar-sidebar-item-period"
          >
            {calendar.start_date} ~ {calendar.end_date}
          </Text>
        </div>
        
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                icon={<IconDeleteStroked />}
                type={canDelete ? 'danger' : 'tertiary'}
                disabled={!canDelete}
                onClick={(e) => handleDelete(calendar, e as unknown as React.MouseEvent)}
              >
                {t('common.delete')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <div 
            className="calendar-sidebar-item-more"
            onClick={(e) => e.stopPropagation()}
          >
            <IconMore />
          </div>
        </Dropdown>
      </div>
    );
  };

  return (
    <div className="calendar-sidebar">
      {/* 新建按钮 */}
      <div className="calendar-sidebar-header">
        <Button
          icon={<IconPlus />}
          theme="solid"
          block
          onClick={onCreate}
        >
          {t('workCalendar.sidebar.newCalendar')}
        </Button>
      </div>

      {/* 日历列表 */}
      <div className="calendar-sidebar-list">
        {calendars.length > 0 ? (
          calendars.map(renderCalendarItem)
        ) : (
          <div className="calendar-sidebar-empty">
            <Text type="tertiary">{t('workCalendar.sidebar.noCalendars')}</Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarSidebar;
