import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Typography, Collapsible, Button, Input, Toast, Tooltip, Modal, Tabs, TabPane } from '@douyinfe/semi-ui';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type { RequirementItem, ActivityRecord, DetailedAssessment } from '../../types';
import { statusConfig, priorityConfig, fetchActivities, updateRequirementAssessment } from '../../mockData';
import ApprovalSection from './ApprovalSection';
import ArtifactSection from './ArtifactSection';
import AssessmentTab from './AssessmentTab';
import CostEstimateTab from './CostEstimateTab';
import VersionHistoryTab from './VersionHistoryTab';
import ApprovalFlowProgress from '../ApprovalFlowProgress';
import LinkedProcessesSection from '../LinkedProcessesSection';
import './index.less';
import { ChevronDown, ChevronRight, ClipboardCheck, FileText, History, Pencil, Send, Trash2, Wallet } from 'lucide-react';

const { Text, Paragraph } = Typography;

// ============= 活动类型图标/颜色 =============

const activityTypeConfig: Record<string, { color: string; label: string }> = {
  created: { color: 'var(--semi-color-text-2)', label: 'Created' },
  status_change: { color: 'var(--semi-color-primary)', label: 'Status Change' },
  approval: { color: 'var(--semi-color-success)', label: 'Approval' },
  assessment: { color: 'var(--semi-color-warning)', label: 'Assessment' },
  comment: { color: 'var(--semi-color-tertiary)', label: 'Comment' },
};

// ============= 属性面板 =============

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
      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('common.status')}</Text>
          <Tag color={sCfg?.color as TagColor} type="light" size="large">{t(sCfg?.i18nKey || '')}</Tag>
        </div>
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('requirements.fields.priority')}</Text>
          <Tag color={pCfg?.color as TagColor} type="light" size="large">{t(pCfg?.i18nKey || '')}</Tag>
        </div>
      </div>

      <div className="requirement-detail-property-divider" />

      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('common.owningDepartment')}</Text>
          <Text>{data.owning_department_name}</Text>
        </div>
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('common.creator')}</Text>
          <UserNameWithCard
            name={data.creatorName}
            userId={data.creatorId}
            department={data.creatorDepartment}
            role={data.creatorRole}
            email={data.creatorEmail}
          />
        </div>
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('requirements.form.contactLabel')}</Text>
          <Text>{data.contactInfo || '-'}</Text>
        </div>
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('requirements.fields.expectedLaunchDate')}</Text>
          <Text>{data.expectedLaunchDate ? data.expectedLaunchDate.substring(0, 10) : '-'}</Text>
        </div>
      </div>

      <div className="requirement-detail-property-divider" />

      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('common.createTime')}</Text>
          <Text size="small">{data.createdAt.replace('T', ' ').substring(0, 19)}</Text>
        </div>
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('common.updateTime')}</Text>
          <Text size="small">{data.updatedAt.replace('T', ' ').substring(0, 19)}</Text>
        </div>
      </div>

      {data.status === 'DRAFT' && (
        <>
          <div className="requirement-detail-property-divider" />
          <div className="requirement-detail-property-group">
            <Button
              theme="solid"
              type="primary"
              size="small"
              icon={<Send size={16} strokeWidth={2} />}
              block
              onClick={() => {
                Modal.confirm({
                  title: t('requirements.detail.submitConfirmTitle'),
                  content: t('requirements.detail.submitConfirmContent'),
                  okText: t('requirements.detail.submitForApproval'),
                  cancelText: t('common.cancel'),
                  onOk: async () => {
                    await onStatusChange(data.id, 'PENDING_APPROVAL', 'Submitted for approval.');
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

      <ApprovalSection data={data} onStatusChange={onStatusChange} onRefresh={onRefresh} />
    </div>
  );
};

// ============= 活动流 =============

const ActivityStream = ({ activities, t }: { activities: ActivityRecord[]; t: (k: string) => string }) => {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  return (
    <div className="requirement-detail-activity-stream">
      <Text strong className="requirement-detail-activity-stream-title">
        {t('requirements.detail.activityStream')}
      </Text>
      <div className="requirement-detail-activity-list">
        {sorted.map((a) => {
          const cfg = activityTypeConfig[a.type] || activityTypeConfig.comment;
          return (
            <div key={a.id} className="requirement-detail-activity-item">
              <div className="requirement-detail-activity-dot" style={{ backgroundColor: cfg.color }} />
              <div className="requirement-detail-activity-content">
                <div className="requirement-detail-activity-header">
                  <Text strong size="small">{a.actorName}</Text>
                  <Text type="tertiary" size="small">{a.timestamp.replace('T', ' ').substring(0, 16)}</Text>
                </div>
                <Text size="small" className="requirement-detail-activity-text">{a.content}</Text>
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
  onRefresh?: () => void;
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
  onRefresh,
  pagination,
  onPageChange,
  onScrollToRow,
}: RequirementDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [commentText, setCommentText] = useState('');
  const [descExpanded, setDescExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');

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
    setActivities((prev) => [
      ...prev,
      {
        id: `comment-${Date.now()}`,
        type: 'comment',
        actorId: 'user-001',
        actorName: 'John Smith',
        content: commentText.trim(),
        timestamp: new Date().toISOString(),
      },
    ]);
    setCommentText('');
    Toast.success(t('requirements.detail.commentAdded'));
  };

  const handleSaveAssessment = async (id: string, assessment: DetailedAssessment) => {
    await updateRequirementAssessment(id, assessment);
    onRefresh?.();
  };
  // 成本预估完全由表单基线数据自动计算（STORY-010），无需保存回调


  return (
    <DetailDrawerWrapper<RequirementItem>
      visible={visible}
      onClose={onClose}
      title={data.req_no ? `[${data.req_no}] ${data.title}` : data.title}
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
                icon={<Send size={16} strokeWidth={2} />}
                theme="borderless"
                size="small"
                type="tertiary"
                onClick={() => {
                  Modal.confirm({
                    title: t('requirements.detail.submitConfirmTitle'),
                    content: t('requirements.detail.submitConfirmContent'),
                    okText: t('requirements.detail.submitForApproval'),
                    cancelText: t('common.cancel'),
                    onOk: async () => {
                      await onStatusChange(data.id, 'PENDING_APPROVAL', 'Submitted for approval.');
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
                icon={<Pencil size={16} strokeWidth={2} />}
                theme="borderless"
                type="tertiary"
                size="small"
                onClick={() => onEdit(data)}
              />
            </Tooltip>
          )}
        </>
      }
      deleteAction={
        canDelete ? (
          <Tooltip content={t('common.delete')}>
            <Button
              icon={<Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />}
              theme="borderless"
              type="tertiary"
              size="small"
              onClick={() => onDelete(data)}
            />
          </Tooltip>
        ) : null
      }
    >
      <div className="requirement-detail-layout">
        {/* 左侧 Tab 区域 */}
        <div className="requirement-detail-left">
          <Tabs
            type="line"
            activeKey={activeTab}
            onChange={setActiveTab}
            className="requirement-detail-tabs"
          >
            <TabPane
              tab={
                <span className="requirement-detail-tab-label">
                  <FileText size={14} strokeWidth={2} />
                  {t('requirements.detail.tab.overview')}
                </span>
              }
              itemKey="overview"
            >
              <div className="requirement-detail-tab-content">
                {data.approvalFlowConfig && <ApprovalFlowProgress config={data.approvalFlowConfig} />}
                <div className="requirement-detail-section">
                  <div
                    className="requirement-detail-section-header"
                    onClick={() => setDescExpanded(!descExpanded)}
                  >
                    {descExpanded ? <ChevronDown size={16} strokeWidth={2} /> : <ChevronRight size={16} strokeWidth={2} />}
                    <Text strong>{t('requirements.form.descriptionLabel')}</Text>
                  </div>
                  <Collapsible isOpen={descExpanded}>
                    <Paragraph className="requirement-detail-description">
                      {data.description || '-'}
                    </Paragraph>
                    {data.businessBackground && (
                      <div style={{ marginTop: 12 }}>
                        <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 4 }}>
                          {t('requirements.form.businessBackgroundLabel')}
                        </Text>
                        <Paragraph className="requirement-detail-description">
                          {data.businessBackground}
                        </Paragraph>
                      </div>
                    )}
                  </Collapsible>
                </div>

                {data.attachments && data.attachments.length > 0 && (
                  <div className="requirement-detail-section">
                    <Text strong>{t('requirements.detail.attachments')}</Text>
                    <Text type="tertiary" size="small" style={{ marginTop: 8 }}>
                      {data.attachments.length} {t('requirements.detail.files')}
                    </Text>
                  </div>
                )}

                <LinkedProcessesSection processes={data.linkedProcesses} />

                <ArtifactSection data={data} />

                <ActivityStream activities={activities} t={t} />

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
            </TabPane>

            <TabPane
              tab={
                <span className="requirement-detail-tab-label">
                  <ClipboardCheck size={14} strokeWidth={2} />
                  {t('requirements.detail.tab.assessment')}
                </span>
              }
              itemKey="assessment"
            >
              <div className="requirement-detail-tab-content">
                <AssessmentTab data={data} onSaveAssessment={handleSaveAssessment} />
              </div>
            </TabPane>

            <TabPane
              tab={
                <span className="requirement-detail-tab-label">
                  <Wallet size={14} strokeWidth={2} />
                  {t('requirements.detail.tab.cost')}
                </span>
              }
              itemKey="cost"
            >
              <div className="requirement-detail-tab-content">
                <CostEstimateTab data={data} />
              </div>
            </TabPane>

            <TabPane
              tab={
                <span className="requirement-detail-tab-label">
                  <History size={14} strokeWidth={2} />
                  {t('requirements.detail.tab.versions')}
                </span>
              }
              itemKey="versions"
            >
              <div className="requirement-detail-tab-content">
                <VersionHistoryTab data={data} />
              </div>
            </TabPane>
          </Tabs>
        </div>

        {/* 右侧属性面板 */}
        <div className="requirement-detail-right">
          <PropertyPanel data={data} t={t} onStatusChange={onStatusChange} />
        </div>
      </div>
    </DetailDrawerWrapper>
  );
};

export default RequirementDetailDrawer;
