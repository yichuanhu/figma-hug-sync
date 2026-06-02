import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Typography, Button, Toast, Tooltip, Modal, Tabs, TabPane, Select, Banner } from '@douyinfe/semi-ui';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type { RequirementItem, ActivityRecord, DetailedAssessment, RequirementChangeLog } from '../../types';
import { statusConfig, priorityConfig, fetchActivities, updateRequirementAssessment, withdrawRequirement, MOCK_CURRENT_USER_ID, useSchemeFlags, listChangeLogs } from '../../mockData';
import { PRESET_SCHEMES } from '@/pages/Requirements/RequirementsWorkbench/schemeConfig';
import { findWorkspaceByRequirementId } from '../../../RequirementsProjects/mockData';

import ApprovalSection from './ApprovalSection';
import AssessmentTab from './AssessmentTab';
import CostEstimateTab from './CostEstimateTab';
import EffortTab from './EffortTab';
import ApprovalFlowProgress from '../ApprovalFlowProgress';
import ChangeLogTab from '../ChangeLogTab';
import DevSchemeDocsTab from '../DevSchemeDocsTab';
import ClassificationTagsField from '@/components/ClassificationTagsField';

import ReadonlySchemeFieldsRenderer from '../ReadonlySchemeFieldsRenderer';

import './index.less';
import { Lightbulb, Pencil, RotateCcw, Send, Trash2, Undo2, Link2, FolderPlus, X, Ban, PowerOff, GitBranchPlus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import WorkspacePickerModal from './WorkspacePickerModal';
import { statusConfigV2, isBusinessOnlyEdit, legacyStatusMap } from '../../statusConfig';
import type { RequirementStatus } from '../../types';

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
}: {
  data: RequirementItem;
  t: (key: string, options?: Record<string, unknown>) => string;
  onStatusChange: (id: string, newStatus: string, comment?: string) => Promise<void>;
  onRefresh?: () => void;
  isHistoryMode: boolean;
  onOpenPicker: () => void;
  onCreateProject: () => void;
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
          <Text type="tertiary" size="small">{t('common.createTime')}</Text>
          <Text size="small">{data.createdAt.replace('T', ' ').substring(0, 19)}</Text>
        </div>
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">{t('common.updateTime')}</Text>
          <Text size="small">{data.updatedAt.replace('T', ' ').substring(0, 19)}</Text>
        </div>
      </div>

      <div className="requirement-detail-property-divider" />

      <div className="requirement-detail-property-item">
        <Text type="tertiary" size="small">分类标签</Text>
        <ClassificationTagsField
          entityType="requirement"
          entityId={data.id}
          value={{}}
          onChange={() => {}}
          readonly
        />
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

      {/* 审批操作区已迁移至「审批流程」Tab 内 */}
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
  onCreateProcess?: (record: RequirementItem) => void;
  onCancel?: (record: RequirementItem) => void;
  onOffline?: (record: RequirementItem) => void;
  onRelaunch?: (record: RequirementItem) => void;
  
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
  onCreateProcess,
  onCancel,
  onOffline,
  onRelaunch,
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
  const [, setPendingLogs] = useState<RequirementChangeLog[]>([]);
  const [changeLogRefreshKey, setChangeLogRefreshKey] = useState(0);
  const location = useLocation();
  
  const assessmentReadonly = context !== 'assessment';

  // 根据入口上下文决定可见的 Tab：
  // - assessment（需求评估）：概览 + 需求评估
  // - approval（需求评审）：概览 + 审批流程
  // - list（需求列表，默认）：全部
  const visibleTabs = useMemo<Set<string>>(() => {
    if (context === 'assessment') return new Set(['overview', 'assessment']);
    if (context === 'approval') return new Set(['overview', 'approval']);
    return new Set(['overview', 'approval', 'assessment', 'cost', 'effort', 'devScheme', 'changeLog']);
  }, [context]);
  const showTab = (key: string) => visibleTabs.has(key);

  // 抽屉关闭/打开时按 initialTab 同步当前 Tab
  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    } else {
      setActiveTab(initialTab);
      setViewingVersion('current');
    }
  }, [visible, initialTab]);

  // 切换到不同需求时重置版本视图为最新
  useEffect(() => {
    setViewingVersion('current');
  }, [data?.id]);

  // 切换上一条/下一条时，若当前 tab 在新需求中不可用，则回退到 overview
  useEffect(() => {
    if (!data) return;
    const isHistory = viewingVersion !== 'current';
    const availableTabs: string[] = ['overview', 'approval', 'assessment', 'cost'].filter(showTab);
    if (!isHistory) {
      ['effort', 'devScheme', 'changeLog'].forEach((k) => { if (showTab(k)) availableTabs.push(k); });
    }
    if (!availableTabs.includes(activeTab)) {
      setActiveTab('overview');
    }
  }, [data?.id, viewingVersion, activeTab, data, visibleTabs]);

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

  // 与列表行操作矩阵保持一致：以 statusConfigV2[status].actions 为唯一来源
  const normalizedStatus: RequirementStatus =
    (statusConfigV2[effectiveData.status as RequirementStatus]
      ? (effectiveData.status as RequirementStatus)
      : legacyStatusMap[effectiveData.status]) || 'DRAFT';
  const matrixActions = isHistoryMode ? [] : (statusConfigV2[normalizedStatus]?.actions ?? []);
  const isCreator = effectiveData.creatorId === MOCK_CURRENT_USER_ID;
  const visibleActions = matrixActions.filter((a) => {
    if (a === 'submit' || a === 'withdraw' || a === 'resubmit') return isCreator;
    return true;
  });

  const canDelete = visibleActions.includes('delete');

  const handleSaveAssessment = async (id: string, assessment: DetailedAssessment) => {
    await updateRequirementAssessment(id, assessment);
    onRefresh?.();
  };
  // 成本预估完全由表单基线数据自动计算（STORY-010），无需保存回调

  const submitLabel = hasApproval
    ? t('requirements.detail.submitForApproval')
    : t('requirements.detail.submitRequirement');

  const renderAction = (a: typeof visibleActions[number]) => {
    switch (a) {
      case 'edit':
        return (
          <Tooltip key="edit" content={isBusinessOnlyEdit(normalizedStatus) ? '编辑（业务字段）' : t('common.edit')}>
            <Button icon={<Pencil size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={() => onEdit(data)} />
          </Tooltip>
        );
      case 'submit':
        return (
          <Tooltip key="submit" content={submitLabel}>
            <Button
              icon={<Send size={16} strokeWidth={2} />}
              theme="borderless"
              size="small"
              type="tertiary"
              onClick={() => {
                Modal.confirm({
                  title: hasApproval ? t('requirements.detail.submitConfirmTitle') : t('requirements.detail.submitDirectConfirmTitle'),
                  content: buildSubmitConfirmContent(hasApproval, hasAssessment, t),
                  okText: submitLabel,
                  cancelText: t('common.cancel'),
                  onOk: async () => {
                    await onStatusChange(data.id, submittedStatus, 'Submitted.');
                    Toast.success(hasApproval ? t('requirements.detail.submitSuccess') : t('requirements.detail.submitDirectSuccess'));
                  },
                });
              }}
            />
          </Tooltip>
        );
      case 'withdraw':
        return (
          <Tooltip key="withdraw" content={t('requirements.detail.withdraw')}>
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
        );
      case 'resubmit':
        return onResubmit ? (
          <Tooltip key="resubmit" content={t('requirements.detail.resubmit', '重新提交')}>
            <Button icon={<Send size={16} strokeWidth={2} />} theme="borderless" size="small" type="tertiary" onClick={() => onResubmit(data)} />
          </Tooltip>
        ) : null;
      case 'createProcess':
        return onCreateProcess ? (
          <Tooltip key="createProcess" content="创建流程">
            <Button icon={<GitBranchPlus size={16} strokeWidth={2} />} theme="borderless" size="small" type="tertiary" onClick={() => onCreateProcess(data)} />
          </Tooltip>
        ) : null;
      case 'cancel':
        return onCancel ? (
          <Tooltip key="cancel" content="取消需求">
            <Button icon={<Ban size={16} strokeWidth={2} />} theme="borderless" size="small" type="danger" onClick={() => onCancel(data)} />
          </Tooltip>
        ) : null;
      case 'offline':
        return onOffline ? (
          <Tooltip key="offline" content="人工下线">
            <Button icon={<PowerOff size={16} strokeWidth={2} />} theme="borderless" size="small" type="danger" onClick={() => onOffline(data)} />
          </Tooltip>
        ) : null;
      case 'relaunch':
        return onRelaunch ? (
          <Tooltip key="relaunch" content="重新上线">
            <Button icon={<RotateCcw size={16} strokeWidth={2} />} theme="borderless" size="small" type="tertiary" onClick={() => onRelaunch(data)} />
          </Tooltip>
        ) : null;
      default:
        return null;
    }
  };

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
        context === 'approval' || context === 'assessment' ? null : (
          <>{visibleActions.filter((a) => a !== 'delete').map((a) => renderAction(a))}</>
        )
      }
      deleteAction={
        context !== 'approval' && context !== 'assessment' && canDelete ? (
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
          >
            <TabPane
              tab={t('requirements.detail.tab.overview')}
              itemKey="overview"
            >
              <div className="requirement-detail-tab-content">
                <CustomFieldsSection data={effectiveData} t={t} />
              </div>
            </TabPane>

            {showTab('approval') && (
            <TabPane
              tab={t('requirements.detail.tab.approval')}
              itemKey="approval"
            >
              <div className="requirement-detail-tab-content">
                {effectiveData.approvalFlowConfig ? (
                  <ApprovalFlowProgress config={effectiveData.approvalFlowConfig} />
                ) : (
                  <Text type="tertiary">{t('common.noData', { defaultValue: '暂无审批流配置' })}</Text>
                )}
                {context === 'approval' && (
                  <div style={{ marginTop: 16 }}>
                    <ApprovalSection data={effectiveData} onStatusChange={onStatusChange} onRefresh={onRefresh} />
                  </div>
                )}
              </div>
            </TabPane>
            )}

            {showTab('assessment') && (
            <TabPane
              tab={t('requirements.detail.tab.assessment')}
              itemKey="assessment"
            >
              <div className="requirement-detail-tab-content">
                <AssessmentTab data={effectiveData} onSaveAssessment={handleSaveAssessment} forceReadonly={assessmentReadonly} />
              </div>
            </TabPane>
            )}

            {showTab('cost') && (
            <TabPane
              tab={t('requirements.detail.tab.cost')}
              itemKey="cost"
            >
              <div className="requirement-detail-tab-content">
                <CostEstimateTab data={effectiveData} />
              </div>
            </TabPane>
            )}

            {!isHistoryMode && showTab('effort') && (
              <TabPane
                tab={t('requirements.detail.tab.effort')}
                itemKey="effort"
              >
                <div className="requirement-detail-tab-content">
                  <EffortTab data={effectiveData} />
                </div>
              </TabPane>
            )}

            {!isHistoryMode && showTab('devScheme') && (
              <TabPane
                tab={t('requirements.detail.tab.devScheme')}
                itemKey="devScheme"
              >
                <div className="requirement-detail-tab-content">
                  <DevSchemeDocsTab
                    requirement={effectiveData}
                    onChange={() => setChangeLogRefreshKey((k) => k + 1)}
                  />
                </div>
              </TabPane>
            )}

            {!isHistoryMode && showTab('changeLog') && (
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
