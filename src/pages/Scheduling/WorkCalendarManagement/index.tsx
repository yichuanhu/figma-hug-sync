import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb, Typography, Toast, Button } from '@douyinfe/semi-ui';
import { IconChevronLeft } from '@douyinfe/semi-icons';
import AppLayout from '@/components/layout/AppLayout';
import CalendarSidebar from './components/CalendarSidebar';
import CalendarViewer from './components/CalendarViewer';
import CalendarEditor from './components/CalendarEditor';
import CreateCalendarModal from './components/CreateCalendarModal';
import type { LYWorkCalendarResponse, LYSpecialDate } from '@/api/index';
import { mockWorkCalendarData } from '@/mocks/workCalendar';
import './index.less';

const { Title } = Typography;

const WorkCalendarManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // State
  const [calendars, setCalendars] = useState<LYWorkCalendarResponse[]>([...mockWorkCalendarData]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(mockWorkCalendarData[0]?.id || null);
  const [isEditing, setIsEditing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  
  // Get selected calendar
  const selectedCalendar = useMemo(() => {
    return calendars.find((c) => c.id === selectedCalendarId) || null;
  }, [calendars, selectedCalendarId]);
  
  // Handlers
  const handleBack = useCallback(() => {
    navigate('/scheduling-center/task-execution/auto-execution-policy');
  }, [navigate]);
  
  const handleSelectCalendar = useCallback((id: string) => {
    setSelectedCalendarId(id);
    setIsEditing(false);
  }, []);
  
  const handleCreateCalendar = useCallback(() => {
    setCreateModalVisible(true);
  }, []);
  
  const handleCreateSubmit = useCallback((values: {
    name: string;
    template: 'WEEKEND_DOUBLE' | 'WEEKEND_SINGLE' | 'BLANK';
    start_date: string;
    end_date: string;
  }) => {
    // Generate weekend_days based on template
    let weekendDays: number[] = [];
    if (values.template === 'WEEKEND_DOUBLE') {
      weekendDays = [0, 6];
    } else if (values.template === 'WEEKEND_SINGLE') {
      weekendDays = [0];
    }
    
    const newCalendar: LYWorkCalendarResponse = {
      id: `cal-${Date.now()}`,
      name: values.name,
      template: values.template,
      start_date: values.start_date,
      end_date: values.end_date,
      weekend_days: weekendDays,
      special_dates: [],
      reference_count: 0,
      creator_id: 'current-user',
      creator_name: '当前用户',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setCalendars((prev) => [...prev, newCalendar]);
    setSelectedCalendarId(newCalendar.id);
    setIsEditing(true); // Auto enter edit mode for new calendar
    setCreateModalVisible(false);
    Toast.success(t('workCalendar.createModal.success'));
  }, [t]);
  
  const handleDeleteCalendar = useCallback((id: string) => {
    const calendar = calendars.find((c) => c.id === id);
    if (calendar && calendar.reference_count > 0) {
      Toast.warning(t('workCalendar.sidebar.cannotDelete'));
      return;
    }
    
    setCalendars((prev) => prev.filter((c) => c.id !== id));
    if (selectedCalendarId === id) {
      const remaining = calendars.filter((c) => c.id !== id);
      setSelectedCalendarId(remaining[0]?.id || null);
    }
    Toast.success(t('workCalendar.sidebar.deleteSuccess'));
  }, [calendars, selectedCalendarId, t]);
  
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);
  
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);
  
  const handleSave = useCallback((data: {
    name: string;
    start_date: string;
    end_date: string;
    special_dates: LYSpecialDate[];
  }) => {
    if (!selectedCalendarId) return;
    
    setCalendars((prev) => prev.map((c) => {
      if (c.id === selectedCalendarId) {
        return {
          ...c,
          name: data.name,
          start_date: data.start_date,
          end_date: data.end_date,
          special_dates: data.special_dates,
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    }));
    
    setIsEditing(false);
    Toast.success(t('workCalendar.editor.saveSuccess'));
  }, [selectedCalendarId, t]);
  
  return (
    <AppLayout>
      <div className="work-calendar-management">
        {/* 面包屑 */}
        <Breadcrumb className="work-calendar-management-breadcrumb">
          <Breadcrumb.Item>{t('workCalendar.breadcrumb.schedulingCenter')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('workCalendar.breadcrumb.taskExecution')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('workCalendar.breadcrumb.autoExecutionPolicy')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('workCalendar.pageTitle')}</Breadcrumb.Item>
        </Breadcrumb>

        {/* 返回按钮和标题 */}
        <div className="work-calendar-management-header">
          <Button 
            icon={<IconChevronLeft />} 
            theme="borderless" 
            onClick={handleBack}
            className="work-calendar-management-back-btn"
          />
          <Title heading={3} className="work-calendar-management-header-title">
            {t('workCalendar.pageTitle')}
          </Title>
        </div>

        {/* 主体内容：左右两栏 */}
        <div className="work-calendar-management-content">
          {/* 左侧边栏 */}
          <CalendarSidebar
            calendars={calendars}
            selectedId={selectedCalendarId}
            onSelect={handleSelectCalendar}
            onCreate={handleCreateCalendar}
            onDelete={handleDeleteCalendar}
          />
          
          {/* 右侧主区域 */}
          <div className="work-calendar-management-main">
            {selectedCalendar ? (
              isEditing ? (
                <CalendarEditor
                  calendar={selectedCalendar}
                  onCancel={handleCancelEdit}
                  onSave={handleSave}
                />
              ) : (
                <CalendarViewer
                  calendar={selectedCalendar}
                  onEdit={handleEdit}
                />
              )
            ) : (
              <div className="work-calendar-management-empty">
                <div className="work-calendar-management-empty-icon">📅</div>
                <div className="work-calendar-management-empty-title">
                  {t('workCalendar.empty.title')}
                </div>
                <div className="work-calendar-management-empty-description">
                  {t('workCalendar.empty.description')}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 新建日历弹窗 */}
        <CreateCalendarModal
          visible={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          onSubmit={handleCreateSubmit}
        />
      </div>
    </AppLayout>
  );
};

export default WorkCalendarManagement;
