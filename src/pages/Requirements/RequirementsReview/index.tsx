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
import pendingIcon from '@/assets/review-stats/pending.png';
import reviewedIcon from '@/assets/review-stats/reviewed.png';
import approvedIcon from '@/assets/review-stats/approved.png';
import rejectedIcon from '@/assets/review-stats/rejected.png';

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
  const [initialTab, setInitialTab] = useState<string>('overview');

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
    if (departmentFilter.length > 0) {
      data = data.filter((item) => departmentFilter.includes(item.owning_department_name));
    }
    if (statusFilter.length > 0) {
      data = data.filter((item) => statusFilter.includes(item.status));
    }
    return data;
  }, [activeTab, allRequirements, searchValue, departmentFilter, statusFilter]);

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
        render: ((_: any, record: any) => {
          const canApprove = isMyTurn(record);
          const canWithdraw = record.status === 'PENDING_APPROVAL' && record.creatorId === MOCK_CURRENT_USER_ID;
          if (!canApprove && !canWithdraw) return <Text type="tertiary">-</Text>;
          return (
            <Dropdown
              trigger="click"
              position="bottomRight"
              clickToHide
              render={
                <Dropdown.Menu>
                  {canApprove && (
                    <Dropdown.Item
                      icon={<CheckCircle size={16} strokeWidth={2} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecord(record);
                        setInitialTab('approval');
                        setDetailDrawerVisible(true);
                      }}
                    >
                      {t('requirements.review.approveAction', { defaultValue: '需求审批' })}
                    </Dropdown.Item>
                  )}
                  {canWithdraw && (
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
          );
        }),
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
            { label: t('requirements.review.pendingCount'), value: stats.pendingCount, icon: pendingIcon },
            { label: t('requirements.review.reviewedCount'), value: stats.reviewedCount, icon: reviewedIcon },
            { label: t('requirements.review.approvedCount'), value: stats.approvedCount, icon: approvedIcon },
            { label: t('requirements.review.rejectedCount'), value: stats.rejectedCount, icon: rejectedIcon },
          ].map((item, idx, arr) => (
            <div key={idx} className="requirements-review-metric-card">
              <div className="requirements-review-metric-icon" aria-hidden="true">
                <img src={item.icon} alt="" />
              </div>
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
        <Row
          type="flex"
          justify="space-between"
          align="middle"
          className="requirements-review-toolbar"
        >
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('requirements.review.searchPlaceholder')}
                className="requirements-review-search-input"
                value={searchValue}
                onChange={setSearchValue}
                showClear
                maxLength={100}
              />
              <DepartmentSelect
                placeholder={t('common.filterDepartment')}
                value={departmentFilter}
                onChange={(v) => setDepartmentFilter(v as string[])}
                multiple
                showClear
                maxTagCount={1}
                useNameAsValue
                style={{ width: 'auto', minWidth: 150, maxWidth: 600 }}
              />
              <FilterPopover
                visible={filterPopoverVisible}
                onVisibleChange={setFilterPopoverVisible}
                onConfirm={(values) => {
                  setStatusFilter((values.status as string[]) || []);
                }}
                sections={[
                  {
                    key: 'status',
                    label: t('common.status'),
                    type: 'checkbox',
                    options: [
                      { label: t('requirements.status.pendingApproval'), value: 'PENDING_APPROVAL' },
                      { label: t('requirements.status.rejected'), value: 'REJECTED' },
                      { label: t('requirements.status.withdrawn'), value: 'WITHDRAWN' },
                      { label: t('requirements.status.approved'), value: 'APPROVED' },
                    ],
                    value: statusFilter,
                  },
                ]}
              />
            </Space>
          </Col>
        </Row>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as ReviewTab)}
          keepDOM={false}
        >
          <TabPane
            tab={t('requirements.review.pendingMe')}
            itemKey="pending"
          >
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
                      setInitialTab('overview');
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
                      setInitialTab('overview');
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
                      setInitialTab('overview');
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
        onClose={() => {
          setDetailDrawerVisible(false);
          setInitialTab('overview');
        }}
        data={selectedRecord}
        dataList={filteredData}
        onNavigate={(item) => setSelectedRecord(item)}
        onEdit={() => {}}
        onDelete={() => {}}
        onStatusChange={handleStatusChange}
        onRefresh={loadData}
        pagination={pagination}
        onScrollToRow={() => {}}
        context="approval"
        initialTab={initialTab}
      />
    </div>
  );
};

export default RequirementsReview;
