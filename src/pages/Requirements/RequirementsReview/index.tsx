import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Tabs,
  TabPane,
  Table,
  Tag,
  Button,
  Input,
  Modal,
  Toast,
  Dropdown,
  TextArea,
  Row,
  Col,
  Space,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import DepartmentSelect from '@/components/DepartmentSelect';
import FilterPopover from '@/components/FilterPopover';
import type { RequirementItem } from '../RequirementsWorkbench/types';
import {
  statusConfig,
  priorityConfig,
  fetchRequirementList,
  updateRequirementStatus,
  advanceApprovalFlow,
  withdrawRequirement,
  MOCK_CURRENT_USER_ID,
} from '../RequirementsWorkbench/mockData';
import RequirementDetailDrawer from '../RequirementsWorkbench/components/RequirementDetailDrawer';
import './index.less';
import { CheckCircle, Ellipsis, Eye, Undo2, XCircle } from 'lucide-react';

const { Title, Text } = Typography;

// 判断当前用户是否为该需求当前级的待办审批人
const isMyTurn = (r: RequirementItem): boolean => {
  if (r.status !== 'PENDING_APPROVAL' || !r.approvalFlowConfig) return false;
  const lv = r.approvalFlowConfig.levels.find((l) => l.level === r.approvalFlowConfig!.currentLevel);
  return !!lv?.approvers.some((a) => a.id === MOCK_CURRENT_USER_ID && a.status === 'PENDING');
};

// 判断当前用户是否参与过该需求审批
const reviewedByMe = (r: RequirementItem): boolean =>
  (r.approvalHistory ?? []).some(
    (h) => h.approverId === MOCK_CURRENT_USER_ID && (h.action === 'approve' || h.action === 'reject'),
  );

type ReviewTab = 'pending' | 'reviewed' | 'all';


const RequirementsReview = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ReviewTab>('pending');
  const [searchValue, setSearchValue] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [allRequirements, setAllRequirements] = useState<RequirementItem[]>([]);

  // 详情抽屉
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RequirementItem | null>(null);

  // 内联审批弹窗
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalTarget, setApprovalTarget] = useState<RequirementItem | null>(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);

  // 加载所有需求数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchRequirementList({
        offset: 0,
        size: 200,
        keyword: '',
        sort_by: 'created_at',
        sort_order: 'desc',
      });
      setAllRequirements(response.list);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 统计数据（基于真实数据 + approvalHistory）
  const stats = useMemo(() => {
    const pendingCount = allRequirements.filter(isMyTurn).length;
    const reviewedSet = allRequirements.filter(reviewedByMe);
    const reviewedCount = reviewedSet.length;
    let approvedCount = 0;
    let rejectedCount = 0;
    allRequirements.forEach((r) => {
      (r.approvalHistory ?? []).forEach((h) => {
        if (h.approverId !== MOCK_CURRENT_USER_ID) return;
        if (h.action === 'approve') approvedCount += 1;
        if (h.action === 'reject') rejectedCount += 1;
      });
    });
    return { pendingCount, reviewedCount, approvedCount, rejectedCount };
  }, [allRequirements]);

  // 按 tab 筛选数据
  const filteredData = useMemo(() => {
    let data: RequirementItem[];
    switch (activeTab) {
      case 'pending':
        data = allRequirements.filter(isMyTurn);
        break;
      case 'reviewed':
        data = allRequirements.filter(reviewedByMe);
        break;
      case 'all':
      default:
        // 全部审批相关：仅 PENDING_APPROVAL / REJECTED / WITHDRAWN
        data = allRequirements.filter(
          (r) => r.status === 'PENDING_APPROVAL' || r.status === 'REJECTED' || r.status === 'WITHDRAWN',
        );
        break;
    }

    if (searchValue.trim()) {
      const kw = searchValue.toLowerCase().trim();
      data = data.filter(
        (item) =>
          item.title.toLowerCase().includes(kw) || item.description.toLowerCase().includes(kw),
      );
    }
    return data;
  }, [activeTab, allRequirements, searchValue]);

  // 审批操作（走多级审批引擎）
  const openApprovalModal = (record: RequirementItem, action: 'approve' | 'reject') => {
    setApprovalTarget(record);
    setApprovalAction(action);
    setApprovalReason('');
    setApprovalModalVisible(true);
  };

  const handleApprovalSubmit = async () => {
    if (!approvalTarget) return;
    if (approvalAction === 'reject' && !approvalReason.trim()) {
      Toast.warning(t('requirements.detail.rejectReasonRequired'));
      return;
    }
    setApprovalSubmitting(true);
    try {
      await advanceApprovalFlow(approvalTarget.id, approvalAction, approvalReason.trim() || undefined);
      Toast.success(
        approvalAction === 'approve'
          ? t('requirements.detail.approveSuccess')
          : t('requirements.detail.rejectSuccess'),
      );
      setApprovalModalVisible(false);
      await loadData();
    } catch {
      Toast.error(t('requirements.detail.actionFailed'));
    } finally {
      setApprovalSubmitting(false);
    }
  };

  // 撤回（提交人）
  const handleWithdraw = (record: RequirementItem) => {
    Modal.confirm({
      title: t('requirements.review.withdrawConfirmTitle'),
      content: t('requirements.review.withdrawConfirmContent'),
      okText: t('requirements.review.withdraw'),
      okButtonProps: { type: 'danger' },
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await withdrawRequirement(record.id);
          Toast.success(t('requirements.review.withdrawSuccess'));
          await loadData();
        } catch (e) {
          Toast.error((e as Error).message);
        }
      },
    });
  };

  // 状态变更回调（用于详情抽屉的旧入口，例如从 DRAFT 提交）
  const handleStatusChange = async (id: string, newStatus: string, comment?: string) => {
    await updateRequirementStatus(id, newStatus, comment);
    await loadData();
    const response = await fetchRequirementList({
      offset: 0,
      size: 200,
      keyword: '',
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    const updated = response.list.find((r) => r.id === id);
    if (updated) setSelectedRecord(updated);
  };

  // 通用列定义
  const getColumns = (showActions: boolean) => {
    const cols = [
      {
        title: t('requirements.fields.title'),
        dataIndex: 'title',
        key: 'title',
        width: 260,
        ellipsis: true,
      },
      {
        title: t('common.owningDepartment'),
        dataIndex: 'owning_department_name',
        key: 'owning_department_name',
        width: 140,
        ellipsis: true,
      },
      {
        title: t('common.status'),
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => {
          const cfg = statusConfig[status as keyof typeof statusConfig];
          return (
            <Tag color={cfg?.color || ('grey' as TagColor)} type="light">
              {t(cfg?.i18nKey || 'requirements.status.draft')}
            </Tag>
          );
        },
      },
      {
        title: t('requirements.fields.priority'),
        dataIndex: 'priority',
        key: 'priority',
        width: 80,
        render: (priority: string) => {
          const cfg = priorityConfig[priority as keyof typeof priorityConfig];
          return (
            <Tag color={cfg?.color || ('grey' as TagColor)} type="light">
              {t(cfg?.i18nKey || 'requirements.priority.low')}
            </Tag>
          );
        },
      },
      {
        title: t('common.creator'),
        dataIndex: 'creatorId',
        key: 'creatorId',
        width: 120,
        ellipsis: true,
        render: (_: string, record: RequirementItem) => (
          <UserNameWithCard
            name={record.creatorName}
            userId={record.creatorId}
            department={record.creatorDepartment}
            role={record.creatorRole}
            email={record.creatorEmail}
          />
        ),
      },
      {
        title: t('requirements.review.currentLevelCol'),
        dataIndex: 'currentLevel',
        key: 'currentLevel',
        width: 200,
        ellipsis: true,
        render: (_: unknown, record: RequirementItem) => {
          const cfg = record.approvalFlowConfig;
          if (!cfg || record.status !== 'PENDING_APPROVAL') return <Text type="tertiary">-</Text>;
          const lv = cfg.levels.find((l) => l.level === cfg.currentLevel);
          return (
            <Text size="small">
              {t('requirements.review.currentLevelValue', {
                current: cfg.currentLevel,
                total: cfg.levels.length,
                name: lv?.name ?? '',
              })}
            </Text>
          );
        },
      },
      {
        title: t('common.updateTime'),
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 160,
        ellipsis: true,
        render: (value: string | null) => (value ? value.replace('T', ' ').substring(0, 19) : '-'),
      },
    ];

    if (showActions) {
      cols.push({
        title: t('common.actions'),
        dataIndex: 'action' as string,
        key: 'action',
        width: 60,
        ellipsis: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render: ((_: any, record: any) => (
          <Dropdown
            trigger="click"
            position="bottomRight"
            clickToHide
            render={
              <Dropdown.Menu>
                <Dropdown.Item
                  icon={<Eye size={16} strokeWidth={2} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRecord(record);
                    setDetailDrawerVisible(true);
                  }}
                >
                  {t('common.viewDetail')}
                </Dropdown.Item>
                {isMyTurn(record) && (
                  <>
                    <Dropdown.Item
                      icon={<CheckCircle size={16} strokeWidth={2} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openApprovalModal(record, 'approve');
                      }}
                    >
                      {t('requirements.detail.approve')}
                    </Dropdown.Item>
                    <Dropdown.Item
                      icon={<XCircle size={16} strokeWidth={2} />}
                      type="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        openApprovalModal(record, 'reject');
                      }}
                    >
                      {t('requirements.detail.reject')}
                    </Dropdown.Item>
                  </>
                )}
                {record.status === 'PENDING_APPROVAL' && record.creatorId === MOCK_CURRENT_USER_ID && (
                  <Dropdown.Item
                    icon={<Undo2 size={16} strokeWidth={2} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWithdraw(record);
                    }}
                  >
                    {t('requirements.review.withdraw')}
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            }
          >
            <Button icon={<Ellipsis size={16} strokeWidth={2} />} theme="borderless" onClick={(e) => e.stopPropagation()} />
          </Dropdown>
        )),
      });
    }

    return cols;
  };

  const pagination = useMemo(
    () => ({
      currentPage: 1,
      totalPages: 1,
      pageSize: filteredData.length,
      total: filteredData.length,
    }),
    [filteredData],
  );

  return (
    <div className="requirements-review">
      {/* 标题 */}
      <div className="requirements-review-header">
        <div className="requirements-review-header-title">
          <Title heading={3} className="title">
            {t('requirements.review.title')}
          </Title>
          <Text type="tertiary">{t('requirements.review.description')}</Text>
        </div>
      </div>

      {/* 统计卡片 - 参考首页 MetricsSection 样式 */}
      <div className="requirements-review-stats-card">
        <div className="requirements-review-stats-grid">
          {[
            { label: t('requirements.review.pendingCount'), value: stats.pendingCount, icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="rv_pending_bg_i" x="8.9" y="1.09" width="14" height="15" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="bg"/><feBlend in="SourceGraphic" in2="bg" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="ha"/><feOffset dy="1"/><feGaussianBlur stdDeviation="0.5"/><feComposite in2="ha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend in2="shape" result="r"/></filter>
                  <filter id="rv_pending_fg_i" x="-3" y="-1" width="28" height="28" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="bg"/><feBlend in="SourceGraphic" in2="bg" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="ha"/><feOffset dy="3.667"/><feGaussianBlur stdDeviation="1.833"/><feComposite in2="ha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend in2="shape" result="r"/></filter>
                  <clipPath id="rv_pending_clip" transform="translate(3 1)"><circle cx="11" cy="13" r="10"/></clipPath>
                  <linearGradient id="rv_pending_bg_g" x1="15.9" y1="1.09" x2="15.9" y2="15.09" gradientUnits="userSpaceOnUse"><stop stopColor="#F7AC6E"/><stop offset="1" stopColor="#EE5316"/></linearGradient>
                  <linearGradient id="rv_pending_fg_g" x1="12" y1="7" x2="12" y2="17" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0.3"/></linearGradient>
                </defs>
                <g filter="url(#rv_pending_bg_i)"><circle cx="15.9" cy="8.09" r="7" fill="url(#rv_pending_bg_g)"/></g>
                <foreignObject x="-3" y="-1" width="28" height="28"><div style={{backdropFilter:'blur(1px)',WebkitBackdropFilter:'blur(1px)',clipPath:'url(#rv_pending_clip)',height:'100%',width:'100%',backgroundColor:'rgba(255,255,255,0.16)',border:'1px solid rgba(255,255,255,0.28)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.36)'}}/></foreignObject>
                <g filter="url(#rv_pending_fg_i)"><circle cx="11" cy="13" r="10" fill="#F7AC6E" fillOpacity="0.45"/></g>
                <path d="M9 10a1 1 0 012 0v4h4a1 1 0 010 2h-4.8a1.2 1.2 0 01-1.2-1.2V10z" fill="url(#rv_pending_fg_g)"/>
              </svg>
            )},
            { label: t('requirements.review.reviewedCount'), value: stats.reviewedCount, icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="rv_assess_bg_i" x="8.9" y="1.09" width="14" height="15" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="bg"/><feBlend in="SourceGraphic" in2="bg" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="ha"/><feOffset dy="1"/><feGaussianBlur stdDeviation="0.5"/><feComposite in2="ha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend in2="shape" result="r"/></filter>
                  <filter id="rv_assess_fg_i" x="-3" y="-1" width="28" height="28" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="bg"/><feBlend in="SourceGraphic" in2="bg" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="ha"/><feOffset dy="3.667"/><feGaussianBlur stdDeviation="1.833"/><feComposite in2="ha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend in2="shape" result="r"/></filter>
                  <clipPath id="rv_assess_clip" transform="translate(3 1)"><circle cx="11" cy="13" r="10"/></clipPath>
                  <linearGradient id="rv_assess_bg_g" x1="15.9" y1="1.09" x2="15.9" y2="15.09" gradientUnits="userSpaceOnUse"><stop stopColor="#B18CFF"/><stop offset="1" stopColor="#6226EF"/></linearGradient>
                  <linearGradient id="rv_assess_fg_g" x1="12" y1="7" x2="12" y2="19" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0.3"/></linearGradient>
                </defs>
                <g filter="url(#rv_assess_bg_i)"><circle cx="15.9" cy="8.09" r="7" fill="url(#rv_assess_bg_g)"/></g>
                <foreignObject x="-3" y="-1" width="28" height="28"><div style={{backdropFilter:'blur(1px)',WebkitBackdropFilter:'blur(1px)',clipPath:'url(#rv_assess_clip)',height:'100%',width:'100%',backgroundColor:'rgba(255,255,255,0.16)',border:'1px solid rgba(255,255,255,0.28)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.36)'}}/></foreignObject>
                <g filter="url(#rv_assess_fg_i)"><circle cx="11" cy="13" r="10" fill="#B18CFF" fillOpacity="0.45"/></g>
                <path d="M9 9H7.5A1.5 1.5 0 006 10.5v9A1.5 1.5 0 007.5 21h7a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0014.5 9H13m-4 0v-1a1 1 0 011-1h2a1 1 0 011 1v1m-4 0h4M9 14h4M9 17h2.5" stroke="url(#rv_assess_fg_g)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
            )},
            { label: t('requirements.review.approvedCount'), value: stats.approvedCount, icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="rv_approved_bg_i" x="8.9" y="1.09" width="14" height="15" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="bg"/><feBlend in="SourceGraphic" in2="bg" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="ha"/><feOffset dy="1"/><feGaussianBlur stdDeviation="0.5"/><feComposite in2="ha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend in2="shape" result="r"/></filter>
                  <filter id="rv_approved_fg_i" x="-3" y="0" width="27" height="27" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="bg"/><feBlend in="SourceGraphic" in2="bg" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="ha"/><feOffset dy="3.667"/><feGaussianBlur stdDeviation="1.833"/><feComposite in2="ha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend in2="shape" result="r"/></filter>
                  <clipPath id="rv_approved_clip" transform="translate(3 0)"><circle cx="10.5" cy="13.5" r="9.5"/></clipPath>
                  <linearGradient id="rv_approved_bg_g" x1="15.9" y1="1.09" x2="15.9" y2="15.09" gradientUnits="userSpaceOnUse"><stop stopColor="#69E57E"/><stop offset="1" stopColor="#296733"/></linearGradient>
                  <linearGradient id="rv_approved_fg_g" x1="10" y1="10" x2="10" y2="18.5" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0.3"/></linearGradient>
                </defs>
                <g filter="url(#rv_approved_bg_i)"><circle cx="15.9" cy="8.09" r="7" fill="url(#rv_approved_bg_g)"/></g>
                <foreignObject x="-3" y="0" width="27" height="27"><div style={{backdropFilter:'blur(1px)',WebkitBackdropFilter:'blur(1px)',clipPath:'url(#rv_approved_clip)',height:'100%',width:'100%',backgroundColor:'rgba(255,255,255,0.16)',border:'1px solid rgba(255,255,255,0.28)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.36)'}}/></foreignObject>
                <g filter="url(#rv_approved_fg_i)"><circle cx="10.5" cy="13.5" r="9.5" fill="#46C05B" fillOpacity="0.45"/></g>
                <path d="M13.19 10.42a1 1 0 011.4.23 1 1 0 01-.23 1.4L10.5 17.62a1.5 1.5 0 01-2.34-.13L5.29 14.5a1 1 0 011.41-1.41l2.67 2.67L13.19 10.42z" fill="url(#rv_approved_fg_g)"/>
              </svg>
            )},
            { label: t('requirements.review.rejectedCount'), value: stats.rejectedCount, icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="rv_rejected_bg_i" x="8.9" y="1.09" width="14" height="15" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="bg"/><feBlend in="SourceGraphic" in2="bg" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="ha"/><feOffset dy="1"/><feGaussianBlur stdDeviation="0.5"/><feComposite in2="ha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend in2="shape" result="r"/></filter>
                  <filter id="rv_rejected_fg_i" x="-3" y="-1" width="28" height="28" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="bg"/><feBlend in="SourceGraphic" in2="bg" result="shape"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="ha"/><feOffset dy="3.667"/><feGaussianBlur stdDeviation="1.833"/><feComposite in2="ha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/><feBlend in2="shape" result="r"/></filter>
                  <clipPath id="rv_rejected_clip" transform="translate(3 1)"><circle cx="11" cy="13" r="10"/></clipPath>
                  <linearGradient id="rv_rejected_bg_g" x1="15.9" y1="1.09" x2="15.9" y2="15.09" gradientUnits="userSpaceOnUse"><stop stopColor="#FF8E8E"/><stop offset="1" stopColor="#CC2929"/></linearGradient>
                  <linearGradient id="rv_rejected_fg_g" x1="11" y1="9" x2="11" y2="17" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0.3"/></linearGradient>
                </defs>
                <g filter="url(#rv_rejected_bg_i)"><circle cx="15.9" cy="8.09" r="7" fill="url(#rv_rejected_bg_g)"/></g>
                <foreignObject x="-3" y="-1" width="28" height="28"><div style={{backdropFilter:'blur(1px)',WebkitBackdropFilter:'blur(1px)',clipPath:'url(#rv_rejected_clip)',height:'100%',width:'100%',backgroundColor:'rgba(255,255,255,0.16)',border:'1px solid rgba(255,255,255,0.28)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.36)'}}/></foreignObject>
                <g filter="url(#rv_rejected_fg_i)"><circle cx="11" cy="13" r="10" fill="#FF6B6B" fillOpacity="0.45"/></g>
                <path d="M14.12 10.88a1 1 0 010 1.41L12.41 14l1.71 1.71a1 1 0 01-1.41 1.41L11 15.41l-1.71 1.71a1 1 0 01-1.41-1.41L9.59 14l-1.71-1.71a1 1 0 011.41-1.41L11 12.59l1.71-1.71a1 1 0 011.41 0z" fill="url(#rv_rejected_fg_g)"/>
              </svg>
            )},
          ].map((item, idx, arr) => (
            <div key={idx} className="requirements-review-metric-card">
              <div className="requirements-review-metric-icon">{item.icon}</div>
              <div className="requirements-review-metric-info">
                <div className="requirements-review-metric-label">{item.label}</div>
                <div className="requirements-review-metric-value">{item.value}</div>
              </div>
              {idx < arr.length - 1 && <div className="requirements-review-metric-divider" />}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + 表格 */}
      <div className="requirements-review-content">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as ReviewTab)}
          keepDOM={false}
        >
          <TabPane
            tab={
              <span>
                {t('requirements.review.pendingMe')}
                {stats.pendingCount > 0 && (
                  <Tag size="small" color="orange" type="solid" style={{ marginLeft: 6 }}>
                    {stats.pendingCount}
                  </Tag>
                )}
              </span>
            }
            itemKey="pending"
          >
            <div className="requirements-review-toolbar">
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('requirements.review.searchPlaceholder')}
                className="requirements-review-search"
                value={searchValue}
                onChange={setSearchValue}
                showClear
              />
            </div>
            {isInitialLoad ? (
              <TableSkeleton rows={6} columns={7} columnWidths={['22%', '10%', '10%', '8%', '12%', '14%', '14%']} />
            ) : (
              <Table
                size="small"
                columns={getColumns(true)}
                dataSource={filteredData}
                loading={loading}
                rowKey="id"
                empty={<EmptyState variant="noData" description={t('requirements.review.noPending')} />}
                onRow={(record) => ({
                  style: { cursor: 'pointer' },
                  className: selectedRecord?.id === record?.id && detailDrawerVisible ? 'requirements-review-row-selected' : undefined,
                  onClick: () => {
                    if (record) {
                      setSelectedRecord(record as RequirementItem);
                      if (!detailDrawerVisible) setDetailDrawerVisible(true);
                    }
                  },
                })}
                pagination={false}
                scroll={{ y: 'calc(100vh - 440px)' }}
              />
            )}
          </TabPane>

          <TabPane tab={t('requirements.review.reviewedByMe')} itemKey="reviewed">
            <div className="requirements-review-toolbar">
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('requirements.review.searchPlaceholder')}
                className="requirements-review-search"
                value={searchValue}
                onChange={setSearchValue}
                showClear
              />
            </div>
            {isInitialLoad ? (
              <TableSkeleton rows={6} columns={6} columnWidths={['25%', '12%', '12%', '10%', '15%', '16%']} />
            ) : (
              <Table
                size="small"
                columns={getColumns(false)}
                dataSource={filteredData}
                loading={loading}
                rowKey="id"
                empty={<EmptyState variant="noData" description={t('requirements.review.noReviewed')} />}
                onRow={(record) => ({
                  style: { cursor: 'pointer' },
                  onClick: () => {
                    if (record) {
                      setSelectedRecord(record as RequirementItem);
                      if (!detailDrawerVisible) setDetailDrawerVisible(true);
                    }
                  },
                })}
                pagination={false}
                scroll={{ y: 'calc(100vh - 440px)' }}
              />
            )}
          </TabPane>

          <TabPane tab={t('requirements.review.allReviews')} itemKey="all">
            <div className="requirements-review-toolbar">
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('requirements.review.searchPlaceholder')}
                className="requirements-review-search"
                value={searchValue}
                onChange={setSearchValue}
                showClear
              />
            </div>
            {isInitialLoad ? (
              <TableSkeleton rows={6} columns={7} columnWidths={['22%', '10%', '10%', '8%', '12%', '14%', '14%']} />
            ) : (
              <Table
                size="small"
                columns={getColumns(true)}
                dataSource={filteredData}
                loading={loading}
                rowKey="id"
                empty={<EmptyState variant="noData" description={t('requirements.review.noRecords')} />}
                onRow={(record) => ({
                  style: { cursor: 'pointer' },
                  className: selectedRecord?.id === record?.id && detailDrawerVisible ? 'requirements-review-row-selected' : undefined,
                  onClick: () => {
                    if (record) {
                      setSelectedRecord(record as RequirementItem);
                      if (!detailDrawerVisible) setDetailDrawerVisible(true);
                    }
                  },
                })}
                pagination={false}
                scroll={{ y: 'calc(100vh - 440px)' }}
              />
            )}
          </TabPane>
        </Tabs>
      </div>

      {/* 审批确认弹窗 */}
      <Modal
        visible={approvalModalVisible}
        title={
          approvalAction === 'approve'
            ? t('requirements.review.approveModalTitle')
            : t('requirements.review.rejectModalTitle')
        }
        onCancel={() => setApprovalModalVisible(false)}
        closeOnEsc
        width={480}
        footer={
          <div className="requirements-review-modal-footer">
            <Button theme="light" onClick={() => setApprovalModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              theme="solid"
              type={approvalAction === 'approve' ? 'primary' : 'danger'}
              loading={approvalSubmitting}
              onClick={handleApprovalSubmit}
            >
              {approvalAction === 'approve'
                ? t('requirements.detail.approve')
                : t('requirements.detail.reject')}
            </Button>
          </div>
        }
      >
        {approvalTarget && (
          <div className="requirements-review-modal-content">
            <div className="requirements-review-modal-info">
              <Text type="tertiary" size="small">{t('requirements.fields.title')}</Text>
              <Text strong>{approvalTarget.title}</Text>
            </div>
            <div className="requirements-review-modal-info">
              <Text type="tertiary" size="small">{t('common.owningDepartment')}</Text>
              <Text>{approvalTarget.owning_department_name}</Text>
            </div>
            <TextArea
              placeholder={
                approvalAction === 'approve'
                  ? t('requirements.review.approveReasonPlaceholder')
                  : t('requirements.review.rejectReasonPlaceholder')
              }
              value={approvalReason}
              onChange={setApprovalReason}
              rows={3}
              maxLength={500}
              showClear
              style={{ marginTop: 12 }}
            />
            {approvalAction === 'reject' && (
              <Text type="danger" size="small" style={{ marginTop: 4 }}>
                * {t('requirements.detail.rejectReasonRequired')}
              </Text>
            )}
          </div>
        )}
      </Modal>

      {/* 详情抽屉 */}
      <RequirementDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        data={selectedRecord}
        dataList={filteredData}
        onNavigate={(item) => setSelectedRecord(item)}
        onEdit={() => {}}
        onDelete={() => {}}
        onStatusChange={handleStatusChange}
        pagination={pagination}
        onScrollToRow={() => {}}
      />
    </div>
  );
};

export default RequirementsReview;
