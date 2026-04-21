import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Typography, Button, Toast, Tooltip, Modal, Tabs, TabPane, Select, Banner } from '@douyinfe/semi-ui';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type { RequirementItem, ActivityRecord, DetailedAssessment } from '../../types';
import { statusConfig, priorityConfig, fetchActivities, updateRequirementAssessment, MOCK_CURRENT_USER_ID } from '../../mockData';
import { PRESET_SCHEMES } from '../../schemeConfig';
import { findWorkspaceByRequirementId } from '../../../RequirementsProjects/mockData';
import ApprovalSection from './ApprovalSection';
import AssessmentTab from './AssessmentTab';
import CostEstimateTab from './CostEstimateTab';
import ApprovalFlowProgress from '../ApprovalFlowProgress';
import ReadonlySchemeFieldsRenderer from '../ReadonlySchemeFieldsRenderer';
import './index.less';
import { ClipboardCheck, FileText, Pencil, PowerOff, RotateCcw, Send, Trash2, Wallet } from 'lucide-react';

const { Text } = Typography;

// ============= 活动类型图标/颜色 =============

const activityTypeConfig: Record<string, { color: string; label: string }> = {
  created: { color: 'var(--semi-color-text-2)', label: 'Created' },
  status_change: { color: 'var(--semi-color-primary)', label: 'Status Change' },
  approval: { color: 'var(--semi-color-success)', label: 'Approval' },
  assessment: { color: 'var(--semi-color-warning)', label: 'Assessment' },
};

// ============= 属性面板 =============

const PropertyPanel = ({
  data,
  t,
  onStatusChange,
  onRefresh,
}: {
  data: RequirementItem;
  t: (key: string, options?: Record<string, unknown>) => string;
  onStatusChange: (id: string, newStatus: string, comment?: string) => Promise<void>;
  onRefresh?: () => void;
}) => {
  const sCfg = statusConfig[data.status];
  const pCfg = priorityConfig[data.priority];
  const wsBinding = findWorkspaceByRequirementId(data.id);

  return (
    <div className="requirement-detail-property-panel">
      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('common.status')}</Text>
          <div>
            <Tag color={sCfg?.color as TagColor} type="light">{t(sCfg?.i18nKey || '')}</Tag>
          </div>
        </div>
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('requirements.fields.priority')}</Text>
          <div>
            <Tag color={pCfg?.color as TagColor} type="light">{t(pCfg?.i18nKey || '')}</Tag>
          </div>
        </div>
      </div>

      <div className="requirement-detail-property-divider" />

      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('common.owningDepartment')}</Text>
          <Text>{data.owning_department_name}</Text>
        </div>
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('requirements.fields.projectOwner')}</Text>
          {data.owner_name ? (
            <UserNameWithCard name={data.owner_name} userId={data.owner_id} />
          ) : (
            <Text type="tertiary">{t('requirements.detail.ownerUnassigned')}</Text>
          )}
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
      </div>

      <div className="requirement-detail-property-divider" />

      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('requirements.projects.belongsToWorkspace')}</Text>
          {wsBinding ? (
            <Text>{wsBinding.workspace.name}</Text>
          ) : (
            <Text type="tertiary">{t('requirements.projects.unlinked')}</Text>
          )}
        </div>
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('requirements.projects.belongsToProject')}</Text>
          {wsBinding ? (
            <Text type="tertiary">{wsBinding.project.name}</Text>
          ) : (
            <Text type="tertiary">{t('requirements.projects.unlinked')}</Text>
          )}
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
              icon={<Send size={16} strokeWidth={2} />}
              block
              style={{ height: 32 }}
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

// ============= 自定义字段区（Schema 驱动只读展示） =============

const CustomFieldsSection = ({
  data,
  t,
}: {
  data: RequirementItem;
  t: (k: string) => string;
}) => {
  const scheme = useMemo(() => {
    if (!data.scheme_id) return undefined;
    return PRESET_SCHEMES.find((s) => s.id === data.scheme_id || s.code === data.scheme_id);
  }, [data.scheme_id]);

  const fields = scheme?.custom_fields ?? [];
  const formData = data.form_data ?? {};

  return (
    <div className="requirement-detail-section">
      <Text strong style={{ display: 'block', marginBottom: 12 }}>
        {t('requirements.detail.customFieldsTitle')}
      </Text>
      {fields.length > 0 ? (
        <ReadonlySchemeFieldsRenderer fields={fields} formData={formData} showEmpty />
      ) : (
        <Text type="tertiary">{t('requirements.detail.customFieldsEmpty')}</Text>
      )}
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
          const cfg = activityTypeConfig[a.type] || activityTypeConfig.status_change;
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
  onResubmit?: (record: RequirementItem) => void;
  onOffline?: (record: RequirementItem) => void;
  onRefresh?: () => void;
  pagination: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  onScrollToRow?: (id: string) => void;
  initialTab?: string;
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
  onResubmit,
  onOffline,
  onRefresh,
  pagination,
  onPageChange,
  onScrollToRow,
  initialTab = 'overview',
}: RequirementDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [viewingVersion, setViewingVersion] = useState<'current' | number>('current');

  // 抽屉关闭后重置 tab/版本视图；打开新数据时不重置 tab
  useEffect(() => {
    if (!visible) {
      setActiveTab(initialTab);
      setViewingVersion('current');
    }
  }, [visible, initialTab]);

  // 切换到不同需求时重置版本视图为最新
  useEffect(() => {
    setViewingVersion('current');
  }, [data?.id]);

  useEffect(() => {
    if (visible && data) {
      fetchActivities(data.id).then((acts) => {
        // 合并审批历史留痕
        const historyEntries: ActivityRecord[] = (data.approvalHistory ?? []).map((h) => {
          const actionLabel: Record<string, string> = {
            approve: t('requirements.detail.history.approved'),
            reject: t('requirements.detail.history.rejected'),
            withdraw: t('requirements.detail.history.withdrew'),
            resubmit: t('requirements.detail.history.resubmitted'),
          };
          const levelTag = h.levelName ? `[L${h.level} · ${h.levelName}] ` : '';
          const cmt = h.comment ? `: ${h.comment}` : '';
          return {
            id: h.id,
            type: h.action === 'approve' ? 'approval' : h.action === 'reject' ? 'approval' : 'status_change',
            actorId: h.approverId,
            actorName: h.approverName,
            content: `${levelTag}${actionLabel[h.action]}${cmt}`,
            timestamp: h.timestamp,
          };
        });
        setActivities([...acts, ...historyEntries]);
      });
    }
  }, [visible, data?.id, data?.approvalHistory, t]);

  if (!data) return null;

  const sortedHistory = [...(data.historyVersions ?? [])].sort((a, b) => b.version - a.version);
  const hasHistory = sortedHistory.length > 0;
  const isHistoryMode = viewingVersion !== 'current';
  const currentSnapshot = isHistoryMode
    ? sortedHistory.find((v) => v.version === viewingVersion)
    : undefined;

  // 历史版本视图：将快照字段覆盖到 data 上，构造只读的 effectiveData
  const effectiveData: RequirementItem = currentSnapshot
    ? {
        ...data,
        title: currentSnapshot.snapshot.title ?? data.title,
        description: currentSnapshot.snapshot.description ?? data.description,
        priority: currentSnapshot.snapshot.priority ?? data.priority,
        status: currentSnapshot.snapshot.status ?? data.status,
        detailedAssessment: currentSnapshot.snapshot.detailedAssessment ?? data.detailedAssessment,
        costEstimate: currentSnapshot.snapshot.costEstimate ?? data.costEstimate,
      }
    : data;

  const canEdit = !isHistoryMode && effectiveData.status === 'DRAFT';
  const canDelete = !isHistoryMode && (effectiveData.status === 'DRAFT' || effectiveData.status === 'REJECTED' || effectiveData.status === 'WITHDRAWN');
  const canResubmit = !isHistoryMode && (effectiveData.status === 'REJECTED' || effectiveData.status === 'WITHDRAWN') && effectiveData.creatorId === MOCK_CURRENT_USER_ID;
  const canOffline = !isHistoryMode && effectiveData.status === 'LAUNCHED';

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
          {canResubmit && onResubmit && (
            <Tooltip content={t('requirements.detail.resubmit')}>
              <Button
                icon={<RotateCcw size={16} strokeWidth={2} />}
                theme="borderless"
                size="small"
                type="tertiary"
                onClick={() => onResubmit(data)}
              />
            </Tooltip>
          )}
          {canOffline && onOffline && (
            <Tooltip content={t('requirements.detail.offline', '下线')}>
              <Button
                icon={<PowerOff size={16} strokeWidth={2} />}
                theme="borderless"
                size="small"
                type="tertiary"
                onClick={() => onOffline(data)}
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
      {isHistoryMode && currentSnapshot && (
        <Banner
          type="warning"
          fullMode={false}
          closeIcon={null}
          description={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>{t('requirements.detail.viewingHistoryBanner', { version: currentSnapshot.version })}</span>
              <Button size="small" theme="borderless" onClick={() => setViewingVersion('current')}>
                {t('requirements.detail.backToLatest')}
              </Button>
            </div>
          }
          style={{ margin: '0 0 12px' }}
        />
      )}
      <div className="requirement-detail-layout">
        {/* 左侧 Tab 区域 */}
        <div className="requirement-detail-left">
          <Tabs
            type="line"
            activeKey={activeTab}
            onChange={setActiveTab}
            className="requirement-detail-tabs"
            tabBarExtraContent={
              (hasHistory || isHistoryMode) ? (
                <div className="requirement-detail-version-bar">
                  <Text type="tertiary" size="small" style={{ marginRight: 8 }}>
                    {t('requirements.detail.versionLabel')}:
                  </Text>
                  <Select
                    size="small"
                    value={viewingVersion}
                    style={{ width: 180 }}
                    onChange={(v) => setViewingVersion(v as 'current' | number)}
                  >
                    <Select.Option value="current">
                      {t('requirements.detail.versionLatest')}
                      {data.version ? ` (v${data.version})` : ''}
                    </Select.Option>
                    {sortedHistory.map((v) => (
                      <Select.Option key={v.version} value={v.version}>
                        {`v${v.version} · ${v.createdAt.replace('T', ' ').substring(0, 16)}`}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              ) : null
            }
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
                <CustomFieldsSection data={effectiveData} t={t} />

                {effectiveData.approvalFlowConfig && !isHistoryMode && (
                  <ApprovalFlowProgress config={effectiveData.approvalFlowConfig} />
                )}

                {!isHistoryMode && <ActivityStream activities={activities} t={t} />}
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
                <AssessmentTab data={effectiveData} onSaveAssessment={handleSaveAssessment} />
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
                <CostEstimateTab data={effectiveData} />
              </div>
            </TabPane>
          </Tabs>
        </div>

        {/* 右侧属性面板 */}
        <div className="requirement-detail-right">
          <PropertyPanel data={effectiveData} t={t} onStatusChange={onStatusChange} onRefresh={onRefresh} />
        </div>
      </div>
    </DetailDrawerWrapper>
  );
};

export default RequirementDetailDrawer;
