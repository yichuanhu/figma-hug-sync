import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Typography, Button, Toast, Tooltip, Modal, Tabs, TabPane, Select, Banner } from '@douyinfe/semi-ui';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type { RequirementItem, ActivityRecord, DetailedAssessment, RequirementChangeLog } from '../../types';
import { statusConfig, priorityConfig, fetchActivities, updateRequirementAssessment, withdrawRequirement, MOCK_CURRENT_USER_ID, useSchemeFlags, listChangeLogs } from '../../mockData';
import { PRESET_SCHEMES } from '../../schemeConfig';
import { findWorkspaceByRequirementId } from '../../../RequirementsProjects/mockData';
import { isPostProjectStatus } from '../../utils/fieldEditability';
import ApprovalSection from './ApprovalSection';
import AssessmentTab from './AssessmentTab';
import CostEstimateTab from './CostEstimateTab';
import ApprovalFlowProgress from '../ApprovalFlowProgress';
import ChangeLogTab from '../ChangeLogTab';

import ReadonlySchemeFieldsRenderer from '../ReadonlySchemeFieldsRenderer';
import { buildSubmitConfirmContent } from '../../utils/submitConfirm';
import './index.less';
import { Lightbulb, Pencil, PowerOff, RotateCcw, Send, Trash2, Undo2, Link2, FolderPlus, X, AlertTriangle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import WorkspacePickerModal from './WorkspacePickerModal';

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
  isHistoryMode,
  onOpenPicker,
  onCreateProject,
  showApprovalSection,
}: {
  data: RequirementItem;
  t: (key: string, options?: Record<string, unknown>) => string;
  onStatusChange: (id: string, newStatus: string, comment?: string) => Promise<void>;
  onRefresh?: () => void;
  isHistoryMode: boolean;
  onOpenPicker: () => void;
  onCreateProject: () => void;
  showApprovalSection: boolean;
}) => {
  const sCfg = statusConfig[data.status];
  const pCfg = priorityConfig[data.priority];
  const wsBinding = findWorkspaceByRequirementId(data.id);
  const { hasApproval, hasAssessment, submittedStatus } = useSchemeFlags();
  const [guideDismissed, setGuideDismissed] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('requirementPendingGuideDismissed');
      const set = raw ? (JSON.parse(raw) as string[]) : [];
      return set.includes(data.id);
    } catch {
      return false;
    }
  });
  const dismissGuide = () => {
    setGuideDismissed(true);
    try {
      const raw = localStorage.getItem('requirementPendingGuideDismissed');
      const set = raw ? (JSON.parse(raw) as string[]) : [];
      if (!set.includes(data.id)) {
        set.push(data.id);
        localStorage.setItem('requirementPendingGuideDismissed', JSON.stringify(set));
      }
    } catch { /* ignore */ }
  };
  const showPendingGuide =
    !isHistoryMode && data.status === 'PENDING_PROJECT' && !wsBinding && !guideDismissed;

  return (
    <div className="requirement-detail-property-panel">
      {showPendingGuide && (
        <div style={{ marginBottom: 16 }}>
          <Banner
            type="info"
            fullMode={false}
            closeIcon={<X size={14} strokeWidth={2} />}
            onClose={dismissGuide}
            icon={<Lightbulb size={20} strokeWidth={2} style={{ color: 'var(--semi-color-info)' }} />}
            title={
              <span style={{ fontWeight: 600 }}>
                {t('requirements.detail.pendingProject.title')}
              </span>
            }
            description={
              <div>
                <div style={{ marginBottom: 12 }}>
                  {t('requirements.detail.pendingProject.description')}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button theme="solid" type="primary" size="small" icon={<Link2 size={14} strokeWidth={2} />} onClick={onOpenPicker}>
                    {t('requirements.detail.pendingProject.linkExisting')}
                  </Button>
                  <Button theme="light" size="small" icon={<FolderPlus size={14} strokeWidth={2} />} onClick={onCreateProject}>
                    {t('requirements.detail.pendingProject.createProject')}
                  </Button>
                </div>
              </div>
            }
          />
        </div>
      )}
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

      {data.status === 'DRAFT' && (() => {
        const submitLabel = hasApproval
          ? t('requirements.detail.submitForApproval')
          : t('requirements.detail.submitRequirement');
        return (
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
                    title: hasApproval
                      ? t('requirements.detail.submitConfirmTitle')
                      : t('requirements.detail.submitDirectConfirmTitle'),
                    content: buildSubmitConfirmContent(hasApproval, hasAssessment, t),
                    okText: submitLabel,
                    cancelText: t('common.cancel'),
                    onOk: async () => {
                      await onStatusChange(data.id, submittedStatus, 'Submitted.');
                      Toast.success(
                        hasApproval
                          ? t('requirements.detail.submitSuccess')
                          : t('requirements.detail.submitDirectSuccess'),
                      );
                    },
                  });
                }}
              >
                {submitLabel}
              </Button>
            </div>
          </>
        );
      })()}

      {hasApproval && showApprovalSection && (
        <ApprovalSection data={data} onStatusChange={onStatusChange} onRefresh={onRefresh} />
      )}
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
  /**
   * 入口上下文：
   * - 'list'（默认）：需求列表打开，隐藏审批操作区，评估tab只读
   * - 'approval'：需求审批菜单打开，展示审批操作
   * - 'assessment'：需求评估菜单打开，展示评估编辑
   */
  context?: 'list' | 'approval' | 'assessment';
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
  context = 'list',
}: RequirementDetailDrawerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasApproval, hasAssessment, submittedStatus } = useSchemeFlags();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [viewingVersion, setViewingVersion] = useState<'current' | number>('current');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingLogs, setPendingLogs] = useState<RequirementChangeLog[]>([]);
  const [respondingLog, setRespondingLog] = useState<RequirementChangeLog | null>(null);
  const [changeLogRefreshKey, setChangeLogRefreshKey] = useState(0);
  const location = useLocation();
  const showApprovalSection = context === 'approval';
  const assessmentReadonly = context !== 'assessment';

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

  // 当模版不含评估时，自动从已隐藏的 tab 回退到 overview
  useEffect(() => {
    if (!hasAssessment && (activeTab === 'assessment' || activeTab === 'cost')) {
      setActiveTab('overview');
    }
  }, [hasAssessment, activeTab]);

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

  // 加载变更日志（仅用于详情面板，开发响应已下线）
  useEffect(() => {
    if (!visible || !data) return;
    listChangeLogs(data.id).then(() => {
      setPendingLogs([]);
    });
  }, [visible, data?.id, changeLogRefreshKey]);

  // URL ?openDevResponse=1 → 切到「变更记录」Tab 并高亮目标记录（不自动弹处理弹窗）
  const [highlightLogId, setHighlightLogId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!visible || !data) return;
    const params = new URLSearchParams(location.search);
    if (params.get('openDevResponse') !== '1') return;
    setActiveTab('changeLog');
    const targetId = params.get('changeLogId') ?? undefined;
    if (targetId) setHighlightLogId(targetId);
  }, [visible, data?.id, location.search]);

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

  const canEdit = !isHistoryMode && (
    effectiveData.status === 'DRAFT' ||
    effectiveData.status === 'REJECTED' ||
    effectiveData.status === 'WITHDRAWN' ||
    // STORY-014：立项后阶段允许编辑（走草稿 + 发布变更流程）
    effectiveData.status === 'PENDING_PROJECT' ||
    effectiveData.status === 'DEVELOPING' ||
    effectiveData.status === 'LAUNCHED' ||
    effectiveData.status === 'OFFLINE'
  );
  const canDelete = !isHistoryMode && (effectiveData.status === 'DRAFT' || effectiveData.status === 'REJECTED' || effectiveData.status === 'WITHDRAWN');
  const canResubmit = !isHistoryMode && (effectiveData.status === 'REJECTED' || effectiveData.status === 'WITHDRAWN') && effectiveData.creatorId === MOCK_CURRENT_USER_ID;
  const canOffline = !isHistoryMode && effectiveData.status === 'LAUNCHED';
  const canWithdraw =
    !isHistoryMode &&
    (effectiveData.status === 'PENDING_APPROVAL' || effectiveData.status === 'PENDING_ASSESSMENT') &&
    effectiveData.creatorId === MOCK_CURRENT_USER_ID;
  const canLinkProject = !isHistoryMode && effectiveData.status === 'PENDING_PROJECT' && !findWorkspaceByRequirementId(effectiveData.id);

  const handleSaveAssessment = async (id: string, assessment: DetailedAssessment) => {
    await updateRequirementAssessment(id, assessment);
    onRefresh?.();
  };
  // 成本预估完全由表单基线数据自动计算（STORY-010），无需保存回调


  return (
    <>
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
          {!isHistoryMode && effectiveData.status === 'DRAFT' && (() => {
            const submitLabel = hasApproval
              ? t('requirements.detail.submitForApproval')
              : t('requirements.detail.submitRequirement');
            return (
              <Tooltip content={submitLabel}>
                <Button
                  icon={<Send size={16} strokeWidth={2} />}
                  theme="borderless"
                  size="small"
                  type="tertiary"
                  onClick={() => {
                    Modal.confirm({
                      title: hasApproval
                        ? t('requirements.detail.submitConfirmTitle')
                        : t('requirements.detail.submitDirectConfirmTitle'),
                      content: buildSubmitConfirmContent(hasApproval, hasAssessment, t),
                      okText: submitLabel,
                      cancelText: t('common.cancel'),
                      onOk: async () => {
                        await onStatusChange(data.id, submittedStatus, 'Submitted.');
                        Toast.success(
                          hasApproval
                            ? t('requirements.detail.submitSuccess')
                            : t('requirements.detail.submitDirectSuccess'),
                        );
                      },
                    });
                  }}
                />
              </Tooltip>
            );
          })()}
          {canWithdraw && (
            <Tooltip content={t('requirements.detail.withdraw')}>
              <Button
                icon={<Undo2 size={16} strokeWidth={2} />}
                theme="borderless"
                size="small"
                type="tertiary"
                onClick={() => {
                  Modal.confirm({
                    title: t('requirements.detail.withdrawConfirmTitle'),
                    content: t('requirements.detail.withdrawConfirmContent'),
                    okText: t('requirements.detail.withdraw'),
                    okButtonProps: { type: 'danger' },
                    cancelText: t('common.cancel'),
                    onOk: async () => {
                      try {
                        await withdrawRequirement(data.id);
                        Toast.success(t('requirements.detail.withdrawSuccess'));
                        onRefresh?.();
                      } catch (e) {
                        Toast.error((e as Error).message);
                      }
                    },
                  });
                }}
              />
            </Tooltip>
          )}
          {canResubmit && onResubmit && (
            <Tooltip content={t('requirements.detail.resubmit')}>
              <Button
                icon={<Send size={16} strokeWidth={2} />}
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
          {canLinkProject && (
            <>
              <Tooltip content={t('requirements.detail.pendingProject.linkExisting')}>
                <Button
                  icon={<Link2 size={16} strokeWidth={2} />}
                  theme="borderless"
                  size="small"
                  type="tertiary"
                  onClick={() => setPickerVisible(true)}
                />
              </Tooltip>
              <Tooltip content={t('requirements.detail.pendingProject.createProject')}>
                <Button
                  icon={<FolderPlus size={16} strokeWidth={2} />}
                  theme="borderless"
                  size="small"
                  type="tertiary"
                  onClick={() =>
                    navigate('/requirements/projects', {
                      state: { openCreate: true, prefilledRequirementId: data.id },
                    })
                  }
                />
              </Tooltip>
            </>
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
      {!isHistoryMode && pendingLogs.length > 0 && (() => {
        const overdueCount = pendingLogs.filter(
          (p) => Date.now() - new Date(p.publishedAt).getTime() > 7 * 24 * 60 * 60 * 1000,
        ).length;
        const earliest = [...pendingLogs].sort(
          (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
        )[0];
        return (
          <Banner
            type={overdueCount > 0 ? 'danger' : 'warning'}
            fullMode={false}
            closeIcon={null}
            icon={<AlertTriangle size={16} strokeWidth={2} />}
            description={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>
                  {t('requirements.detail.devResponse.bannerTitle', { count: pendingLogs.length })}
                  {overdueCount > 0 &&
                    t('requirements.detail.devResponse.bannerOverdue', { count: overdueCount })}
                </span>
                <Button size="small" theme="solid" type="warning" onClick={() => setRespondingLog(earliest)}>
                  {t('requirements.detail.devResponse.bannerAction')}
                </Button>
              </div>
            }
            style={{ margin: '0 0 12px' }}
          />
        );
      })()}
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
              tab={t('requirements.detail.tab.overview')}
              itemKey="overview"
            >
              <div className="requirement-detail-tab-content">
                <CustomFieldsSection data={effectiveData} t={t} />
              </div>
            </TabPane>

            {hasApproval && effectiveData.approvalFlowConfig && !isHistoryMode && (
              <TabPane
                tab={t('requirements.detail.tab.approval')}
                itemKey="approval"
              >
                <div className="requirement-detail-tab-content">
                  <ApprovalFlowProgress config={effectiveData.approvalFlowConfig} />
                </div>
              </TabPane>
            )}

            {hasAssessment && context !== 'approval' && (
              <TabPane
                tab={t('requirements.detail.tab.assessment')}
                itemKey="assessment"
              >
                <div className="requirement-detail-tab-content">
                  <AssessmentTab data={effectiveData} onSaveAssessment={handleSaveAssessment} forceReadonly={assessmentReadonly} />
                </div>
              </TabPane>
            )}

            {hasAssessment && context !== 'assessment' && (
              <TabPane
                tab={t('requirements.detail.tab.cost')}
                itemKey="cost"
              >
                <div className="requirement-detail-tab-content">
                  <CostEstimateTab data={effectiveData} />
                </div>
              </TabPane>
            )}

            {!isHistoryMode && isPostProjectStatus(effectiveData.status) && (
              <TabPane
                tab={t('requirements.detail.tab.changeLog')}
                itemKey="changeLog"
              >
                <div className="requirement-detail-tab-content">
                  <ChangeLogTab
                    requirementId={effectiveData.id}
                    refreshKey={new Date(effectiveData.updatedAt).getTime() + changeLogRefreshKey}
                    highlightLogId={highlightLogId}
                  />
                </div>
              </TabPane>
            )}
          </Tabs>
        </div>

        {/* 右侧属性面板 */}
        <div className="requirement-detail-right">
          <PropertyPanel
            data={effectiveData}
            t={t}
            onStatusChange={onStatusChange}
            onRefresh={onRefresh}
            isHistoryMode={isHistoryMode}
            onOpenPicker={() => setPickerVisible(true)}
            onCreateProject={() =>
              navigate('/requirements/projects', {
                state: {
                  openCreate: true,
                  prefilledRequirementId: effectiveData.id,
                },
              })
            }
            showApprovalSection={showApprovalSection}
          />
        </div>
      </div>
    </DetailDrawerWrapper>
    <WorkspacePickerModal
      visible={pickerVisible}
      requirementId={data.id}
      departmentId={data.owning_department_id}
      onClose={() => setPickerVisible(false)}
      onSuccess={() => onRefresh?.()}
    />
    </>
  );
};

export default RequirementDetailDrawer;
