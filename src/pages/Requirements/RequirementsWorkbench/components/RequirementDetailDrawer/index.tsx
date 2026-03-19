import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Typography, Collapsible, Button, Input, Toast, Tooltip, Modal } from '@douyinfe/semi-ui';
import {
  IconChevronDownStroked,
  IconChevronRightStroked,
  IconEditStroked,
  IconDeleteStroked,
  IconSendStroked,
} from '@douyinfe/semi-icons';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type { RequirementItem, ActivityRecord } from '../../types';
import { statusConfig, priorityConfig, fetchActivities } from '../../mockData';
import ApprovalSection from './ApprovalSection';
import TechnicalAssessmentSection from './TechnicalAssessmentSection';
import './index.less';

const { Text, Title, Paragraph } = Typography;

// ============= 活动类型图标/颜色 =============

const activityTypeConfig: Record<string, { color: string; label: string }> = {
  created: { color: 'var(--semi-color-text-2)', label: 'Created' },
  status_change: { color: 'var(--semi-color-primary)', label: 'Status Change' },
  approval: { color: 'var(--semi-color-success)', label: 'Approval' },
  assessment: { color: 'var(--semi-color-warning)', label: 'Assessment' },
  comment: { color: 'var(--semi-color-tertiary)', label: 'Comment' },
};

// ============= 属性面板组件 =============

const PropertyPanel = ({
  data,
  t,
  onStatusChange,
}: {
  data: RequirementItem;
  t: (key: string, options?: Record<string, unknown>) => string;
  onStatusChange: (id: string, newStatus: string, comment?: string) => Promise<void>;
}) => {
  const sCfg = statusConfig[data.status];
  const pCfg = priorityConfig[data.priority];

  return (
    <div className="requirement-detail-property-panel">
      {/* 状态 */}
      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small" className="requirement-detail-property-label">
            {t('common.status')}
          </Text>
          <Tag color={sCfg?.color as TagColor} type="light" size="large">
            {t(sCfg?.i18nKey || '')}
          </Tag>
        </div>

        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small" className="requirement-detail-property-label">
            {t('requirements.fields.priority')}
          </Text>
          <Tag color={pCfg?.color as TagColor} type="light" size="large">
            {t(pCfg?.i18nKey || '')}
          </Tag>
        </div>
      </div>

      <div className="requirement-detail-property-divider" />

      {/* 基本信息 */}
      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small" className="requirement-detail-property-label">
            {t('requirements.fields.department')}
          </Text>
          <Text>{data.department}</Text>
        </div>

        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small" className="requirement-detail-property-label">
            {t('common.creator')}
          </Text>
          <UserNameWithCard
            name={data.creatorName}
            userId={data.creatorId}
            department={data.creatorDepartment}
            role={data.creatorRole}
            email={data.creatorEmail}
          />
        </div>

        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small" className="requirement-detail-property-label">
            {t('requirements.form.contactLabel')}
          </Text>
          <Text>{data.contactInfo || '-'}</Text>
        </div>

        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small" className="requirement-detail-property-label">
            {t('requirements.fields.expectedLaunchDate')}
          </Text>
          <Text>{data.expectedLaunchDate ? data.expectedLaunchDate.substring(0, 10) : '-'}</Text>
        </div>
      </div>

      <div className="requirement-detail-property-divider" />

      {/* 时间信息 */}
      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small" className="requirement-detail-property-label">
            {t('common.createTime')}
          </Text>
          <Text size="small">{data.createdAt.replace('T', ' ').substring(0, 19)}</Text>
        </div>

        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small" className="requirement-detail-property-label">
            {t('common.updateTime')}
          </Text>
          <Text size="small">{data.updatedAt.replace('T', ' ').substring(0, 19)}</Text>
        </div>
      </div>

      {/* 提交审批 - 仅 DRAFT 状态 */}
      {data.status === 'DRAFT' && (
        <>
          <div className="requirement-detail-property-divider" />
          <div className="requirement-detail-property-group">
            <Button
              theme="solid"
              type="primary"
              size="small"
              icon={<IconSendStroked />}
              block
              onClick={() => {
                Modal.confirm({
                  title: t('requirements.detail.submitConfirmTitle'),
                  content: t('requirements.detail.submitConfirmContent'),
                  okText: t('requirements.detail.submitForApproval'),
                  cancelText: t('common.cancel'),
                  onOk: async () => {
                    await onStatusChange(data.id, 'PENDING', 'Submitted for approval.');
                    Toast.success(t('requirements.detail.submitSuccess'));
                  },
                });
              }}
            >
              {t('requirements.detail.submitForApproval')}
            </Button>
          </div>
        </>
      )}

      {/* 审批区域 - 仅 PENDING 状态显示 */}
      <ApprovalSection data={data} onStatusChange={onStatusChange} />

      {/* 技术评估 */}
      <TechnicalAssessmentSection data={data} onStatusChange={onStatusChange} />
    </div>
  );
};

// ============= 活动流组件 =============

const ActivityStream = ({
  activities,
  t,
}: {
  activities: ActivityRecord[];
  t: (key: string) => string;
}) => {
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="requirement-detail-activity-stream">
      <Text strong className="requirement-detail-activity-stream-title">
        {t('requirements.detail.activityStream')}
      </Text>
      <div className="requirement-detail-activity-list">
        {sortedActivities.map((activity) => {
          const cfg = activityTypeConfig[activity.type] || activityTypeConfig.comment;
          return (
            <div key={activity.id} className="requirement-detail-activity-item">
              <div
                className="requirement-detail-activity-dot"
                style={{ backgroundColor: cfg.color }}
              />
              <div className="requirement-detail-activity-content">
                <div className="requirement-detail-activity-header">
                  <Text strong size="small">{activity.actorName}</Text>
                  <Text type="tertiary" size="small">
                    {activity.timestamp.replace('T', ' ').substring(0, 16)}
                  </Text>
                </div>
                <Text size="small" className="requirement-detail-activity-text">
                  {activity.content}
                </Text>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============= 主组件 =============

interface RequirementDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  data: RequirementItem | null;
  dataList: RequirementItem[];
  onNavigate: (item: RequirementItem) => void;
  onEdit: (record: RequirementItem) => void;
  onDelete: (record: RequirementItem) => void;
  onStatusChange: (id: string, newStatus: string, comment?: string) => Promise<void>;
  pagination: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  onScrollToRow?: (id: string) => void;
}

const RequirementDetailDrawer = ({
  visible,
  onClose,
  data,
  dataList,
  onNavigate,
  onEdit,
  onDelete,
  onStatusChange,
  pagination,
  onPageChange,
  onScrollToRow,
}: RequirementDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [commentText, setCommentText] = useState('');
  const [descExpanded, setDescExpanded] = useState(true);

  // 加载活动记录
  useEffect(() => {
    if (visible && data) {
      fetchActivities(data.id).then(setActivities);
    }
  }, [visible, data?.id]);

  if (!data) return null;

  const canEdit = data.status === 'DRAFT';
  const canDelete = data.status === 'DRAFT' || data.status === 'REJECTED';

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newActivity: ActivityRecord = {
      id: `comment-${Date.now()}`,
      type: 'comment',
      actorId: 'user-001',
      actorName: 'John Smith',
      content: commentText.trim(),
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [...prev, newActivity]);
    setCommentText('');
    Toast.success(t('requirements.detail.commentAdded'));
  };

  return (
    <DetailDrawerWrapper<RequirementItem>
      visible={visible}
      onClose={onClose}
      title={data.title}
      dataList={dataList}
      currentId={data.id}
      onNavigate={onNavigate}
      pagination={pagination}
      onPageChange={onPageChange}
      onScrollToRow={onScrollToRow}
      defaultWidth={1000}
      minWidth={800}
      storageKey="requirementDetailDrawerWidth"
      className="requirement-detail-drawer"
      extraActions={
        <>
          {canEdit && (
            <Tooltip content={t('requirements.detail.submitForApproval')}>
              <Button
                icon={<IconSendStroked />}
                theme="borderless"
                size="small"
                type="primary"
                onClick={() => {
                  Modal.confirm({
                    title: t('requirements.detail.submitConfirmTitle'),
                    content: t('requirements.detail.submitConfirmContent'),
                    okText: t('requirements.detail.submitForApproval'),
                    cancelText: t('common.cancel'),
                    onOk: async () => {
                      await onStatusChange(data.id, 'PENDING', 'Submitted for approval.');
                      Toast.success(t('requirements.detail.submitSuccess'));
                    },
                  });
                }}
              />
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip content={t('common.edit')}>
              <Button
                icon={<IconEditStroked />}
                theme="borderless"
                size="small"
                onClick={() => onEdit(data)}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip content={t('common.delete')}>
              <Button
                icon={<IconDeleteStroked />}
                theme="borderless"
                size="small"
                type="danger"
                onClick={() => onDelete(data)}
              />
            </Tooltip>
          )}
        </>
      }
    >
      <div className="requirement-detail-layout">
        {/* 左侧面板 (60%) */}
        <div className="requirement-detail-left">
          {/* 描述区 */}
          <div className="requirement-detail-section">
            <div
              className="requirement-detail-section-header"
              onClick={() => setDescExpanded(!descExpanded)}
            >
              {descExpanded ? <IconChevronDownStroked size="small" /> : <IconChevronRightStroked size="small" />}
              <Text strong>{t('requirements.form.descriptionLabel')}</Text>
            </div>
            <Collapsible isOpen={descExpanded}>
              <Paragraph className="requirement-detail-description">
                {data.description || '-'}
              </Paragraph>
            </Collapsible>
          </div>

          {/* 附件区（placeholder） */}
          {data.attachments && data.attachments.length > 0 && (
            <div className="requirement-detail-section">
              <Text strong>{t('requirements.detail.attachments')}</Text>
              <Text type="tertiary" size="small" style={{ marginTop: 8 }}>
                {data.attachments.length} {t('requirements.detail.files')}
              </Text>
            </div>
          )}

          {/* 活动流 */}
          <ActivityStream activities={activities} t={t} />

          {/* 评论输入 */}
          <div className="requirement-detail-comment-input">
            <Input
              placeholder={t('requirements.detail.addComment')}
              value={commentText}
              onChange={setCommentText}
              onEnterPress={handleAddComment}
              suffix={
                <Button
                  theme="borderless"
                  size="small"
                  disabled={!commentText.trim()}
                  onClick={handleAddComment}
                >
                  {t('requirements.detail.send')}
                </Button>
              }
            />
          </div>
        </div>

        {/* 右侧属性面板 (40%) */}
        <div className="requirement-detail-right">
          <PropertyPanel data={data} t={t} onStatusChange={onStatusChange} />
        </div>
      </div>
    </DetailDrawerWrapper>
  );
};

export default RequirementDetailDrawer;
