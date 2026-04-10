import { useState, useEffect } from 'react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Tooltip,
  Typography,
  Descriptions,
  Tag,
  Tabs,
  TabPane,
  Table,
} from '@douyinfe/semi-ui';
import { ExternalLink, Inbox, Pencil, Trash2 } from 'lucide-react';
import type {
  LYExecutionTemplateResponse,
  TaskPriority,
  ExecutionTargetType,
} from '@/api';
import EmptyState from '@/components/EmptyState';
import ExpandableText from '@/components/ExpandableText';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import './index.less';
import { useCollaboratorPermission } from '@/hooks/useCollaboratorPermission';

const { Text } = Typography;

interface TemplateDetailDrawerProps {
  visible: boolean;
  template: LYExecutionTemplateResponse | null;
  onClose: () => void;
  onUse: (template: LYExecutionTemplateResponse) => void;
  onEdit: (template: LYExecutionTemplateResponse) => void;
  onDelete: (template: LYExecutionTemplateResponse) => void;
  dataSource: LYExecutionTemplateResponse[];
  onSelectTemplate: (template: LYExecutionTemplateResponse) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  onScrollToRow?: (templateId: string) => void;
  initialTab?: string;
}

const priorityConfig: Record<TaskPriority, { color: 'red' | 'orange' | 'grey' | 'blue'; i18nKey: string }> = {
  HIGH: { color: 'red', i18nKey: 'task.priority.high' },
  MEDIUM: { color: 'orange', i18nKey: 'task.priority.medium' },
  LOW: { color: 'grey', i18nKey: 'task.priority.low' },
  MANUAL_QUEUE_BREAKER: { color: 'blue', i18nKey: 'task.priority.manualQueueBreaker' },
};

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
  pagination,
  onPageChange,
  onScrollToRow,
  initialTab = 'basicInfo',
}: TemplateDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);
  

  useEffect(() => {
    if (!visible) setActiveTab(initialTab);
  }, [visible, initialTab]);

  if (!visible || !template) return null;

  const basicInfoData = [
    { key: t('template.fields.name'), value: template.template_name },
    { key: t('common.description'), value: <ExpandableText text={template.description} maxLines={3} /> },
    { key: t('template.fields.process'), value: template.process_name || '-' },
    { key: t('template.fields.targetType'), value: t(targetTypeI18nKeys[template.execution_target_type] || 'template.targetType.botGroup') },
    { key: t('template.fields.target'), value: template.execution_target_name || '-' },
    { key: t('template.fields.priority'), value: <Tag color={priorityConfig[template.priority]?.color || 'grey'} type="light">{t(priorityConfig[template.priority]?.i18nKey || 'task.priority.medium')}</Tag> },
    { key: t('template.fields.maxDuration'), value: `${template.max_execution_duration} ${t('task.detail.seconds')}` },
    { key: t('template.fields.validityDays'), value: `${template.validity_days} ${t('common.days')}` },
    { key: t('template.fields.enableRecording'), value: template.enable_recording ? t('task.detail.enabled') : t('task.detail.disabled') },
    { key: t('common.createTime'), value: (template as any).created_at?.replace('T', ' ').substring(0, 19) || '-' },
    { key: t('common.creator'), value: (template as any).created_by_name ? <UserNameWithCard name={(template as any).created_by_name} userId={(template as any).created_by_id} /> : '-' },
  ];

  const inputParameters = template.input_parameters;
  const hasParameters = inputParameters && Object.keys(inputParameters).length > 0;

  const mockUsageRecords = [
    { id: '1', task_name: `${template.template_name}-Task-001`, created_by_name: 'John Smith', created_at: '2026-01-28 14:30:25', status: 'SUCCESS' },
    { id: '2', task_name: `${template.template_name}-Task-002`, created_by_name: 'Jane Doe', created_at: '2026-01-27 10:15:42', status: 'FAILED' },
    { id: '3', task_name: `${template.template_name}-Task-003`, created_by_name: 'Mike Wang', created_at: '2026-01-25 09:08:33', status: 'SUCCESS' },
  ];

  const usageHistoryColumns = [
    { title: t('template.usageHistory.taskName'), dataIndex: 'task_name', width: 200, ellipsis: true },
    { title: t('common.creator'), dataIndex: 'created_by_name', width: 100, ellipsis: true, render: (text: string) => text ? <UserNameWithCard name={text} /> : '-' },
    { title: t('common.createTime'), dataIndex: 'created_at', width: 160 },
    {
      title: t('template.usageHistory.status'), dataIndex: 'status', width: 100,
      render: (status: string) => <Tag color={status === 'SUCCESS' ? 'green' : 'red'} type="light">{status === 'SUCCESS' ? t('template.usageHistory.statusSuccess') : t('template.usageHistory.statusFailed')}</Tag>,
    },
  ];

  const extraActions = (
    <>
      <Tooltip content={t('template.actions.use')}>
        <Button icon={<ExternalLink size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={() => onUse(template)} />
      </Tooltip>
      <Tooltip content={t('common.edit')}>
        <Button icon={<Pencil size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={() => onEdit(template)} />
      </Tooltip>
    </>
  );

  const deleteAction = (
    <Tooltip content={t('common.delete')}>
      <Button icon={<Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />} theme="borderless" type="tertiary" size="small" onClick={() => onDelete(template)} />
    </Tooltip>
  );

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={t('template.detail.drawerTitle')}
      dataList={dataSource}
      currentId={template.template_id}
      getId={(item) => item.template_id}
      onNavigate={onSelectTemplate}
      pagination={pagination}
      onPageChange={onPageChange}
      onScrollToRow={onScrollToRow}
      extraActions={extraActions}
      deleteAction={deleteAction}
      collaboratorProps={{
        assetType: 'TASK_TEMPLATE',
        assetId: template.template_id,
        context: 'scheduling',
        canManage: true,
      }}
      defaultWidth={900}
      minWidth={576}
      storageKey="templateDetailDrawerWidth"
      className="template-detail-drawer"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="template-detail-drawer-tabs">
        <TabPane tab={t('template.detail.tabs.basicInfo')} itemKey="basicInfo">
          <div className="template-detail-drawer-tab-content">
            <div className="template-detail-drawer-section">
              <Text className="template-detail-drawer-section-title">{t('template.detail.basicInfo')}</Text>
              <Descriptions data={basicInfoData} align="left" />
            </div>
            <div className="template-detail-drawer-section">
              <Text className="template-detail-drawer-section-title">{t('template.detail.inputParameters')}</Text>
              {hasParameters ? (
                <div className="template-detail-drawer-json-content">
                  <pre>{JSON.stringify(inputParameters, null, 2)}</pre>
                </div>
              ) : (
                <div className="template-detail-drawer-empty">
                  <Inbox size={36} strokeWidth={2} style={{ color: 'var(--semi-color-text-2)', marginBottom: 8 }} />
                  <Text type="tertiary">{t('template.detail.noParameters')}</Text>
                </div>
              )}
            </div>
          </div>
        </TabPane>
        <TabPane tab={t('template.detail.tabs.usageHistory')} itemKey="usageHistory">
          <div className="template-detail-drawer-tab-content">
            <Table dataSource={mockUsageRecords} rowKey="id" size="small" pagination={false} columns={usageHistoryColumns} empty={<EmptyState variant="noData" description={t('template.detail.noUsageHistory')} />} />
          </div>
        </TabPane>
      </Tabs>
    </DetailDrawerWrapper>
  );
};

export default TemplateDetailDrawer;
