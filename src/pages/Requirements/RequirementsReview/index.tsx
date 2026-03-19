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
} from '@douyinfe/semi-ui';
import {
  IconSearchStroked,
  IconCheckCircleStroked,
  IconCrossCircleStroked,
  IconEyeOpenedStroked,
  IconMoreStroked,
} from '@douyinfe/semi-icons';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type { RequirementItem } from '../RequirementsWorkbench/types';
import {
  statusConfig,
  priorityConfig,
  fetchRequirementList,
  updateRequirementStatus,
  fetchActivities,
  mockCreators,
} from '../RequirementsWorkbench/mockData';
import RequirementDetailDrawer from '../RequirementsWorkbench/components/RequirementDetailDrawer';
import './index.less';

const { Title, Text } = Typography;

// 模拟当前用户为审批人 Robert Xu (user-007)
const CURRENT_REVIEWER_ID = 'user-007';
const CURRENT_REVIEWER = mockCreators[CURRENT_REVIEWER_ID];

// 模拟审批记录
interface ReviewRecord {
  requirementId: string;
  reviewerId: string;
  action: 'approved' | 'rejected';
  comment: string;
  timestamp: string;
}

const mockReviewHistory: ReviewRecord[] = [];

type ReviewTab = 'pending' | 'reviewed' | 'all';

const RequirementsReview = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ReviewTab>('pending');
  const [searchValue, setSearchValue] = useState('');
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

  // 统计数据
  const stats = useMemo(() => {
    const pendingCount = allRequirements.filter((r) => r.status === 'PENDING').length;
    const assessingCount = allRequirements.filter((r) => r.status === 'ASSESSING').length;
    const reviewedCount = mockReviewHistory.length;
    const approvedCount = mockReviewHistory.filter((r) => r.action === 'approved').length;
    const rejectedCount = mockReviewHistory.filter((r) => r.action === 'rejected').length;
    return { pendingCount, assessingCount, reviewedCount, approvedCount, rejectedCount };
  }, [allRequirements]);

  // 按 tab 筛选数据
  const filteredData = useMemo(() => {
    let data: RequirementItem[];
    switch (activeTab) {
      case 'pending':
        // 待我审批：PENDING 和 ASSESSING 状态
        data = allRequirements.filter((r) => r.status === 'PENDING' || r.status === 'ASSESSING');
        break;
      case 'reviewed':
        // 我已审批：通过审批记录匹配
        const reviewedIds = new Set(mockReviewHistory.map((r) => r.requirementId));
        data = allRequirements.filter((r) => reviewedIds.has(r.id));
        break;
      case 'all':
      default:
        // 全部：排除 DRAFT
        data = allRequirements.filter((r) => r.status !== 'DRAFT');
        break;
    }

    // 搜索
    if (searchValue.trim()) {
      const kw = searchValue.toLowerCase().trim();
      data = data.filter(
        (item) =>
          item.title.toLowerCase().includes(kw) ||
          item.description.toLowerCase().includes(kw),
      );
    }

    return data;
  }, [activeTab, allRequirements, searchValue]);

  // 审批操作
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
      const newStatus = approvalAction === 'approve' ? 'APPROVED' : 'REJECTED';
      const comment = approvalReason.trim()
        ? `${approvalAction === 'approve' ? 'Approved' : 'Rejected'}. ${approvalReason.trim()}`
        : `${approvalAction === 'approve' ? 'Approved' : 'Rejected'} by ${CURRENT_REVIEWER.name}.`;

      await updateRequirementStatus(approvalTarget.id, newStatus, comment);

      // 记录审批历史
      mockReviewHistory.push({
        requirementId: approvalTarget.id,
        reviewerId: CURRENT_REVIEWER_ID,
        action: approvalAction === 'approve' ? 'approved' : 'rejected',
        comment: approvalReason.trim(),
        timestamp: new Date().toISOString(),
      });

      Toast.success(
        approvalAction === 'approve'
          ? t('requirements.detail.approveSuccess')
          : t('requirements.detail.rejectSuccess'),
      );
      setApprovalModalVisible(false);
      loadData();
    } catch {
      Toast.error(t('requirements.detail.actionFailed'));
    } finally {
      setApprovalSubmitting(false);
    }
  };

  // 状态变更回调（用于详情抽屉）
  const handleStatusChange = async (id: string, newStatus: string, comment?: string) => {
    await updateRequirementStatus(id, newStatus, comment);

    if (['APPROVED', 'REJECTED'].includes(newStatus)) {
      mockReviewHistory.push({
        requirementId: id,
        reviewerId: CURRENT_REVIEWER_ID,
        action: newStatus === 'APPROVED' ? 'approved' : 'rejected',
        comment: comment || '',
        timestamp: new Date().toISOString(),
      });
    }

    loadData();
    // 刷新选中记录
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
        title: t('requirements.fields.department'),
        dataIndex: 'department',
        key: 'department',
        width: 100,
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
                  icon={<IconEyeOpened />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRecord(record);
                    setDetailDrawerVisible(true);
                  }}
                >
                  {t('common.viewDetail')}
                </Dropdown.Item>
                {record.status === 'PENDING' && (
                  <>
                    <Dropdown.Item
                      icon={<IconTickCircle />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openApprovalModal(record, 'approve');
                      }}
                    >
                      {t('requirements.detail.approve')}
                    </Dropdown.Item>
                    <Dropdown.Item
                      icon={<IconCrossCircleStroked />}
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
                {record.status === 'ASSESSING' && (
                  <Dropdown.Item
                    icon={<IconEyeOpened />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecord(record);
                      setDetailDrawerVisible(true);
                    }}
                  >
                    {t('requirements.review.startAssessment')}
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            }
          >
            <Button icon={<IconMoreStroked />} theme="borderless" onClick={(e) => e.stopPropagation()} />
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

      {/* 统计卡片 */}
      <div className="requirements-review-stats">
        <div className="requirements-review-stat-card requirements-review-stat-pending">
          <Text type="tertiary" size="small">{t('requirements.review.pendingCount')}</Text>
          <Title heading={2} className="requirements-review-stat-value">{stats.pendingCount}</Title>
        </div>
        <div className="requirements-review-stat-card requirements-review-stat-assessing">
          <Text type="tertiary" size="small">{t('requirements.review.assessingCount')}</Text>
          <Title heading={2} className="requirements-review-stat-value">{stats.assessingCount}</Title>
        </div>
        <div className="requirements-review-stat-card requirements-review-stat-approved">
          <Text type="tertiary" size="small">{t('requirements.review.approvedCount')}</Text>
          <Title heading={2} className="requirements-review-stat-value">{stats.approvedCount}</Title>
        </div>
        <div className="requirements-review-stat-card requirements-review-stat-rejected">
          <Text type="tertiary" size="small">{t('requirements.review.rejectedCount')}</Text>
          <Title heading={2} className="requirements-review-stat-value">{stats.rejectedCount}</Title>
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
                {stats.pendingCount + stats.assessingCount > 0 && (
                  <Tag size="small" color="orange" type="solid" style={{ marginLeft: 6 }}>
                    {stats.pendingCount + stats.assessingCount}
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
              <Text type="tertiary" size="small">{t('requirements.fields.department')}</Text>
              <Text>{approvalTarget.department}</Text>
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
