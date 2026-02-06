import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SideSheet,
  Button,
  Tooltip,
  Typography,
  Descriptions,
  Tag,
  Tabs,
  TabPane,
  Divider,
  Row,
  Col,
  Space,
  Table,
} from '@douyinfe/semi-ui';
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalOpenStroked,
  IconEditStroked,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import { X, Maximize2, Minimize2, Inbox } from 'lucide-react';
import type {
  LYExecutionTemplateResponse,
  TaskPriority,
  ExecutionTargetType,
} from '@/api';
import DetailSkeleton from '@/components/DetailSkeleton';
import EmptyState from '@/components/EmptyState';
import ExpandableText from '@/components/ExpandableText';
import './index.less';

const { Text, Title } = Typography;

interface TemplateDetailDrawerProps {
  visible: boolean;
  template: LYExecutionTemplateResponse | null;
  onClose: () => void;
  onUse: (template: LYExecutionTemplateResponse) => void;
  onEdit: (template: LYExecutionTemplateResponse) => void;
  onDelete: (template: LYExecutionTemplateResponse) => void;
  dataSource: LYExecutionTemplateResponse[];
  onSelectTemplate: (template: LYExecutionTemplateResponse) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => Promise<LYExecutionTemplateResponse[]>;
  onScrollToRow?: (templateId: string) => void;
}

// 优先级配置
const priorityConfig: Record<TaskPriority, { color: 'red' | 'orange' | 'grey' | 'blue'; i18nKey: string }> = {
  HIGH: { color: 'red', i18nKey: 'task.priority.high' },
  MEDIUM: { color: 'orange', i18nKey: 'task.priority.medium' },
  LOW: { color: 'grey', i18nKey: 'task.priority.low' },
  MANUAL_QUEUE_BREAKER: { color: 'blue', i18nKey: 'task.priority.manualQueueBreaker' },
};

// 执行目标类型映射
const targetTypeI18nKeys: Record<ExecutionTargetType, string> = {
  BOT_GROUP: 'template.targetType.botGroup',
  BOT_IN_GROUP: 'template.targetType.botInGroup',
  UNGROUPED_BOT: 'template.targetType.ungroupedBot',
};

const TemplateDetailDrawer = ({
  visible,
  template,
  onClose,
  onUse,
  onEdit,
  onDelete,
  dataSource,
  onSelectTemplate,
  currentPage,
  totalPages,
  onPageChange,
  onScrollToRow,
}: TemplateDetailDrawerProps) => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('basicInfo');
  const [isNavigating, setIsNavigating] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('templateDetailDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 900;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

  // 拖拽调整宽度
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = drawerWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const diff = startX.current - e.clientX;
        setDrawerWidth(Math.min(Math.max(startWidth.current + diff, 576), window.innerWidth - 100));
      };
      const handleMouseUp = () => {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [drawerWidth],
  );

  useEffect(() => {
    localStorage.setItem('templateDetailDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  // 当前模板在列表中的索引
  const currentIndex = useMemo(() => {
    if (!template) return -1;
    return dataSource.findIndex((item) => item.template_id === template.template_id);
  }, [template, dataSource]);

  // 判断是否可以导航
  const canGoPrev = useMemo(() => {
    if (currentIndex > 0) return true;
    if (currentPage > 1) return true;
    return false;
  }, [currentIndex, currentPage]);

  const canGoNext = useMemo(() => {
    if (currentIndex < dataSource.length - 1) return true;
    if (currentPage < totalPages) return true;
    return false;
  }, [currentIndex, dataSource.length, currentPage, totalPages]);

  // 上一个
  const handlePrev = useCallback(async () => {
    if (!template || isNavigating) return;
    setIsNavigating(true);
    try {
      if (currentIndex > 0) {
        const prevTemplate = dataSource[currentIndex - 1];
        onSelectTemplate(prevTemplate);
        onScrollToRow?.(prevTemplate.template_id);
      } else if (currentPage > 1) {
        const newData = await onPageChange(currentPage - 1);
        if (newData.length > 0) {
          const lastTemplate = newData[newData.length - 1];
          onSelectTemplate(lastTemplate);
          onScrollToRow?.(lastTemplate.template_id);
        }
      }
    } finally {
      setIsNavigating(false);
    }
  }, [template, currentIndex, currentPage, dataSource, onSelectTemplate, onPageChange, onScrollToRow, isNavigating]);

  // 下一个
  const handleNext = useCallback(async () => {
    if (!template || isNavigating) return;
    setIsNavigating(true);
    try {
      if (currentIndex < dataSource.length - 1) {
        const nextTemplate = dataSource[currentIndex + 1];
        onSelectTemplate(nextTemplate);
        onScrollToRow?.(nextTemplate.template_id);
      } else if (currentPage < totalPages) {
        const newData = await onPageChange(currentPage + 1);
        if (newData.length > 0) {
          const firstTemplate = newData[0];
          onSelectTemplate(firstTemplate);
          onScrollToRow?.(firstTemplate.template_id);
        }
      }
    } finally {
      setIsNavigating(false);
    }
  }, [template, currentIndex, currentPage, totalPages, dataSource, onSelectTemplate, onPageChange, onScrollToRow, isNavigating]);

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 关闭时重置页签
  useEffect(() => {
    if (!visible) {
      setActiveTab('basicInfo');
    }
  }, [visible]);

  if (!visible || !template) return null;

  // 基本信息数据
  const basicInfoData = [
    { key: t('template.fields.name'), value: template.template_name },
    { key: t('common.description'), value: <ExpandableText text={template.description} maxLines={3} /> },
    { key: t('template.fields.process'), value: template.process_name || '-' },
    {
      key: t('template.fields.targetType'),
      value: t(targetTypeI18nKeys[template.execution_target_type] || 'template.targetType.botGroup'),
    },
    { key: t('template.fields.target'), value: template.execution_target_name || '-' },
    {
      key: t('template.fields.priority'),
      value: (
        <Tag color={priorityConfig[template.priority]?.color || 'grey'} type="light">
          {t(priorityConfig[template.priority]?.i18nKey || 'task.priority.medium')}
        </Tag>
      ),
    },
    { key: t('template.fields.maxDuration'), value: `${template.max_execution_duration} ${t('task.detail.seconds')}` },
    { key: t('template.fields.validityDays'), value: `${template.validity_days} ${t('common.days')}` },
    { key: t('template.fields.enableRecording'), value: template.enable_recording ? t('task.detail.enabled') : t('task.detail.disabled') },
    { key: t('common.createTime'), value: (template as any).created_at?.replace('T', ' ').substring(0, 19) || '-' },
    { key: t('common.creator'), value: (template as any).created_by_name || '-' },
  ];

  // 输入参数
  const inputParameters = template.input_parameters;
  const hasParameters = inputParameters && Object.keys(inputParameters).length > 0;

  // Mock 使用记录数据
  const mockUsageRecords = [
    {
      id: '1',
      task_name: `${template.template_name}-任务-001`,
      created_by_name: '张三',
      created_at: '2026-01-28 14:30:25',
      status: 'SUCCESS',
    },
    {
      id: '2',
      task_name: `${template.template_name}-任务-002`,
      created_by_name: '李四',
      created_at: '2026-01-27 10:15:42',
      status: 'FAILED',
    },
    {
      id: '3',
      task_name: `${template.template_name}-任务-003`,
      created_by_name: '王五',
      created_at: '2026-01-25 09:08:33',
      status: 'SUCCESS',
    },
  ];

  // 使用记录表格列定义
  const usageHistoryColumns = [
    {
      title: t('template.usageHistory.taskName'),
      dataIndex: 'task_name',
      width: 200,
    },
    {
      title: t('common.creator'),
      dataIndex: 'created_by_name',
      width: 100,
    },
    {
      title: t('common.createTime'),
      dataIndex: 'created_at',
      width: 160,
    },
    {
      title: t('template.usageHistory.status'),
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'SUCCESS' ? 'green' : 'red'} type="light">
          {status === 'SUCCESS' ? t('template.usageHistory.statusSuccess') : t('template.usageHistory.statusFailed')}
        </Tag>
      ),
    },
  ];

  return (
    <SideSheet
      title={
        <Row type="flex" justify="space-between" align="middle" className="template-detail-drawer-header">
          <Col>
            <Title heading={5} className="template-detail-drawer-header-title">
              {t('template.detail.drawerTitle')}
            </Title>
          </Col>
          <Col>
            <Space spacing={8}>
              <Tooltip content={t('common.previous')}>
                <Button
                  icon={<IconChevronLeft />}
                  theme="borderless"
                  size="small"
                  disabled={!canGoPrev || isNavigating}
                  onClick={handlePrev}
                  loading={isNavigating}
                  className="navigate"
                />
              </Tooltip>
              <Tooltip content={t('common.next')}>
                <Button
                  icon={<IconChevronRight />}
                  theme="borderless"
                  size="small"
                  disabled={!canGoNext || isNavigating}
                  onClick={handleNext}
                  loading={isNavigating}
                  className="navigate"
                />
              </Tooltip>
              <Divider layout="vertical" className="template-detail-drawer-header-divider" />
              <Tooltip content={t('template.actions.use')}>
                <Button
                  icon={<IconExternalOpenStroked />}
                  theme="borderless"
                  size="small"
                  onClick={() => onUse(template)}
                />
              </Tooltip>
              <Tooltip content={t('common.edit')}>
                <Button
                  icon={<IconEditStroked />}
                  theme="borderless"
                  size="small"
                  onClick={() => onEdit(template)}
                />
              </Tooltip>
              <Tooltip content={t('common.delete')}>
                <Button
                  icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />}
                  theme="borderless"
                  size="small"
                  onClick={() => onDelete(template)}
                />
              </Tooltip>
              <Divider layout="vertical" className="template-detail-drawer-header-divider" />
              <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
                <Button
                  icon={isFullscreen ? <Minimize2 size={16} strokeWidth={2} /> : <Maximize2 size={16} strokeWidth={2} />}
                  theme="borderless"
                  size="small"
                  onClick={toggleFullscreen}
                />
              </Tooltip>
              <Tooltip content={t('common.close')}>
                <Button
                  icon={<IconClose />}
                  theme="borderless"
                  size="small"
                  onClick={onClose}
                  className="template-detail-drawer-header-close-btn"
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      }
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      mask={false}
      footer={null}
      closable={false}
      className={`card-sidesheet template-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
    >
      {/* 拖拽把手 */}
      {!isFullscreen && (
        <div className="template-detail-drawer-resize-handle" onMouseDown={handleMouseDown} />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="template-detail-drawer-tabs"
      >
        <TabPane tab={t('template.detail.tabs.basicInfo')} itemKey="basicInfo">
          <div className="template-detail-drawer-tab-content">
            {/* 基本信息 */}
            <div className="template-detail-drawer-section">
              <Text className="template-detail-drawer-section-title">
                {t('template.detail.basicInfo')}
              </Text>
              <Descriptions data={basicInfoData} align="left" />
            </div>

            {/* 输入参数 */}
            <div className="template-detail-drawer-section">
              <Text className="template-detail-drawer-section-title">
                {t('template.detail.inputParameters')}
              </Text>
              {hasParameters ? (
                <div className="template-detail-drawer-json-content">
                  <pre>{JSON.stringify(inputParameters, null, 2)}</pre>
                </div>
              ) : (
                <div className="template-detail-drawer-empty">
                  <IconInbox size="extra-large" style={{ color: 'var(--semi-color-text-2)', marginBottom: 8 }} />
                  <Text type="tertiary">{t('template.detail.noParameters')}</Text>
                </div>
              )}
            </div>
          </div>
        </TabPane>

        <TabPane tab={t('template.detail.tabs.usageHistory')} itemKey="usageHistory">
          <div className="template-detail-drawer-tab-content">
            <Table
              dataSource={mockUsageRecords}
              rowKey="id"
              size="middle"
              pagination={false}
              columns={usageHistoryColumns}
              empty={
                <EmptyState
                  variant="noData"
                  description={t('template.detail.noUsageHistory')}
                />
              }
            />
          </div>
        </TabPane>
      </Tabs>
    </SideSheet>
  );
};

export default TemplateDetailDrawer;
