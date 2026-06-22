/**
 * 流程发布列表（申请人视角）
 *
 * - 以"发布单"为核心，单一业务状态列（getReleaseStatusDisplay 派生）
 * - 列顺序：发布编号 / 发布类型 / 发布内容摘要 / 流程数量 / 状态 / 发布人 / 部门 / 提交时间 / 操作
 * - 状态四值：PENDING_APPROVAL / SUCCESS / REJECTED / FAILED（含 PROCESS_ARCHIVED_BEFORE_PUBLISH 失效细分）
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Typography, Button, Table, Tag, Input, Row, Col, Space, Dropdown,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import EmptyState from '@/components/EmptyState';
import FilterPopover from '@/components/FilterPopover';
import ReleaseListDetailDrawer from '../components/ReleaseListDetailDrawer';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type {
  LYReleaseResponse,
  LYListResponseLYReleaseResponse,
  ReleaseType,
  ReleaseStatus,
  ReleaseAuditStatus,
  ReleaseFailureCode,
  LYReleaseApprovalRecord,
  GetReleasesParams,
} from '@/api';
import { getReleaseStatusDisplay } from '../shared/releaseStatus';

import './index.less';
import { Ellipsis, Plus } from 'lucide-react';

const { Title, Text } = Typography;

// ============= Mock 数据生成 =============

interface ReleaseSample {
  publish_status: ReleaseStatus;
  audit_status: ReleaseAuditStatus | null;
  failure_code?: ReleaseFailureCode;
  failure_reason?: string;
  reject_reason?: string;
  current_level?: number;
  total_levels?: number;
  current_approver_label?: string;
  approval_records: LYReleaseApprovalRecord[];
  needs_approval: boolean;
}

const buildSample = (index: number, baseTime: Date): ReleaseSample => {
  const t1 = new Date(baseTime.getTime() - 6 * 3600_000).toISOString();
  const t2 = new Date(baseTime.getTime() - 2 * 3600_000).toISOString();
  // 五类典型样本循环铺数据
  const mod = index % 5;
  switch (mod) {
    case 0:
      // 待审批（PENDING）
      return {
        publish_status: 'PENDING_APPROVAL',
        audit_status: 'PENDING',
        current_level: 1, total_levels: 2,
        current_approver_label: 'L1 · 林经理',
        approval_records: [{ level: 1, approver_name: '林经理', action: 'PENDING' }],
        needs_approval: true,
      };
    case 1:
      // 已发布（有审批）
      return {
        publish_status: 'SUCCESS',
        audit_status: 'APPROVED',
        current_level: 2, total_levels: 2,
        approval_records: [
          { level: 1, approver_name: '林经理', action: 'APPROVE', acted_at: t1, comment: '同意。' },
          { level: 2, approver_name: '运维同学', action: 'APPROVE', acted_at: t2, comment: '已上线。' },
        ],
        needs_approval: true,
      };
    case 2:
      // 已发布（无需审批，直发）
      return {
        publish_status: 'SUCCESS',
        audit_status: null,
        approval_records: [],
        needs_approval: false,
      };
    case 3:
      // 已拒绝
      return {
        publish_status: 'REJECTED',
        audit_status: 'REJECTED',
        reject_reason: '部分流程缺少回归测试报告，请补齐后再申请。',
        current_level: 1, total_levels: 2,
        approval_records: [
          { level: 1, approver_name: '林经理', action: 'REJECT', acted_at: t1, comment: '部分流程缺少回归测试报告，请补齐后再申请。' },
        ],
        needs_approval: true,
      };
    case 4:
    default:
      // 失败：奇数为流程归档失效，偶数为执行异常
      if (index % 10 === 4) {
        return {
          publish_status: 'FAILED',
          audit_status: 'APPROVED',
          failure_code: 'PROCESS_ARCHIVED_BEFORE_PUBLISH',
          failure_reason: '审批通过后流程被归档，发布申请已失效。',
          current_level: 2, total_levels: 2,
          approval_records: [
            { level: 1, approver_name: '林经理', action: 'APPROVE', acted_at: t1 },
            { level: 2, approver_name: '运维同学', action: 'APPROVE', acted_at: t2 },
          ],
          needs_approval: true,
        };
      }
      return {
        publish_status: 'FAILED',
        audit_status: 'APPROVED',
        failure_code: 'EXECUTION_ERROR',
        failure_reason: '执行时检测到 PARAM-CONFIG_PATH 缺失，发布未完成。',
        current_level: 2, total_levels: 2,
        approval_records: [
          { level: 1, approver_name: '林经理', action: 'APPROVE', acted_at: t1 },
          { level: 2, approver_name: '运维同学', action: 'APPROVE', acted_at: t2 },
        ],
        needs_approval: true,
      };
  }
};

export const generateMockReleaseResponse = (index: number): LYReleaseResponse => {
  const releaseTypes: ReleaseType[] = [
    'FIRST_RELEASE', 'REQUIREMENT_CHANGE', 'BUG_FIX', 'CONFIG_UPDATE', 'VERSION_ROLLBACK', 'OPTIMIZATION',
  ];
  const releaseType = releaseTypes[index % releaseTypes.length];
  const date = new Date();
  date.setDate(date.getDate() - index);
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const sample = buildSample(index, date);

  const contents = [
    {
      process_id: `process-${index}-1`,
      process_name: index % 4 === 0
        ? 'SAP_ERP 订单处理与履约流程（含库存检查）'
        : index % 4 === 1
          ? '客户信息同步'
          : index % 4 === 2
            ? '客户入网 KYC 验证与账户开通企业流程'
            : '数据备份',
      version_id: `ver-${index}-1`,
      version_number: `v1.${index}.0`,
      process_description: '示例流程描述：覆盖订单校验、库存检查、价格折扣、税费、物流分配、发票生成与客户通知。',
    },
    ...(index % 2 === 0
      ? [{
          process_id: `process-${index}-2`,
          process_name: index % 4 === 0 ? '月度财务报表生成与分发流程' : '订单处理',
          version_id: `ver-${index}-2`,
          version_number: `v2.${index}.0`,
          process_description: '示例流程描述（次要流程）。',
        }]
      : []),
  ];

  return {
    release_id: `RLS-${dateStr}-${String(index + 1).padStart(3, '0')}`,
    release_type: releaseType,
    description: `发布说明 ${index + 1}：包含多个流程更新和配置变更。`,
    publisher_id: `user-${(index % 3) + 1}`,
    publisher_name: ['张三', '李四', '王五'][index % 3],
    publisher_department: ['研发部', '产品部', '运维部'][index % 3],
    publisher_role: ['高级工程师', '产品经理', '运维工程师'][index % 3],
    publisher_email: ['zhangsan@example.com', 'lisi@example.com', 'wangwu@example.com'][index % 3],
    publish_time: date.toISOString(),
    publish_status: sample.publish_status,
    audit_status: sample.audit_status,
    failure_code: sample.failure_code ?? null,
    failure_reason: sample.failure_reason ?? null,
    reject_reason: sample.reject_reason ?? null,
    current_approval_level: sample.current_level,
    total_approval_levels: sample.total_levels,
    current_approver_label: sample.current_approver_label,
    approval_records: sample.approval_records,
    process_count: contents.length,
    resource_count: (index % 5) + 2,
    error_message: sample.failure_reason ?? null,
    contents,
    resources: [],
  };
};

const generateMockListResponse = (params: GetReleasesParams): LYListResponseLYReleaseResponse => {
  const allData = Array.from({ length: 45 }, (_, i) => generateMockReleaseResponse(i));
  let filtered = allData;
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filtered = filtered.filter(
      (item) => item.release_id.toLowerCase().includes(keyword)
        || item.description.toLowerCase().includes(keyword)
        || item.contents.some((c) => c.process_name.toLowerCase().includes(keyword)),
    );
  }
  if (params.release_type) {
    filtered = filtered.filter((item) => item.release_type === params.release_type);
  }
  if (params.publish_status) {
    filtered = filtered.filter((item) => item.publish_status === params.publish_status);
  }
  const offset = params.offset || 0;
  const size = params.size || 20;
  return { range: { offset, size, total: filtered.length }, list: filtered.slice(offset, offset + size) };
};

// ============= 组件 =============

const ReleaseListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { id: routeId } = useParams<{ id?: string }>();

  const [listResponse, setListResponse] = useState<LYListResponseLYReleaseResponse>({
    range: { offset: 0, size: 20, total: 0 }, list: [],
  });
  const [loading, setLoading] = useState(false);
  const [queryParams, setQueryParams] = useState<GetReleasesParams>({ offset: 0, size: 20, keyword: '' });
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    release_type: ReleaseType[]; publish_status: ReleaseStatus[]; publisher: string[];
    publish_date: [Date, Date] | null;
  }>({ release_type: [], publish_status: [], publisher: [], publish_date: null });

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<LYReleaseResponse | null>(null);

  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;
  const filterCount = activeFilters.release_type.length + activeFilters.publish_status.length;

  const loadData = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const response = generateMockListResponse({
        ...queryParams,
        release_type: activeFilters.release_type.length === 1 ? activeFilters.release_type[0] : undefined,
        publish_status: activeFilters.publish_status.length === 1 ? activeFilters.publish_status[0] : undefined,
      });
      setListResponse(response);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [queryParams, activeFilters]);

  useEffect(() => {
    const releaseId = routeId || searchParams.get('releaseId');
    if (releaseId && listResponse.list.length > 0) {
      const release = listResponse.list.find((r) => r.release_id === releaseId);
      if (release) {
        setSelectedRelease(release);
        setDetailDrawerVisible(true);
        if (!routeId) setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, routeId, listResponse]);

  const handleSearch = useMemo(
    () => debounce((value: string) => setQueryParams((p) => ({ ...p, offset: 0, keyword: value })), 500),
    [],
  );

  const handleFilterConfirm = (values: Record<string, unknown>) => {
    const dateValue = values.publish_date as [Date, Date] | undefined;
    setActiveFilters((prev) => ({
      ...prev,
      release_type: (values.release_type as ReleaseType[]) || [],
      publish_status: (values.publish_status as ReleaseStatus[]) || [],
      publish_date: dateValue && dateValue.length === 2 ? dateValue : null,
    }));
    setQueryParams((p) => ({ ...p, offset: 0 }));
  };

  const handleRowClick = (record: LYReleaseResponse) => {
    setSelectedRelease(record);
    setDetailDrawerVisible(true);
  };

  const releaseTypeConfig: Record<ReleaseType, { color: 'blue' | 'cyan' | 'orange' | 'purple' | 'grey' | 'green'; i18nKey: string }> = {
    FIRST_RELEASE: { color: 'blue', i18nKey: 'release.releaseTypes.FIRST_RELEASE' },
    REQUIREMENT_CHANGE: { color: 'cyan', i18nKey: 'release.releaseTypes.REQUIREMENT_CHANGE' },
    BUG_FIX: { color: 'orange', i18nKey: 'release.releaseTypes.BUG_FIX' },
    CONFIG_UPDATE: { color: 'purple', i18nKey: 'release.releaseTypes.CONFIG_UPDATE' },
    VERSION_ROLLBACK: { color: 'grey', i18nKey: 'release.releaseTypes.VERSION_ROLLBACK' },
    OPTIMIZATION: { color: 'green', i18nKey: 'release.releaseTypes.OPTIMIZATION' },
  };

  const statusFilterOptions: { value: ReleaseStatus; label: string }[] = [
    { value: 'PENDING_APPROVAL', label: '待审批' },
    { value: 'SUCCESS', label: '已发布' },
    { value: 'REJECTED', label: '已拒绝' },
    { value: 'FAILED', label: '发布失败 / 已失效' },
  ];

  const columns: ColumnProps<LYReleaseResponse>[] = [
    {
      title: '发布编号', dataIndex: 'release_id', width: 180, ellipsis: true,
      render: (text: string) => <Text strong>{text || '-'}</Text>,
    },
    {
      title: '发布类型', dataIndex: 'release_type', width: 120,
      render: (type: ReleaseType) => {
        const cfg = releaseTypeConfig[type];
        return cfg ? <Tag color={cfg.color} type="light">{t(cfg.i18nKey)}</Tag> : '-';
      },
    },
    {
      title: '发布内容', dataIndex: 'contents', ellipsis: true,
      render: (contents: LYReleaseResponse['contents']) => {
        if (!contents || contents.length === 0) return '-';
        const first = contents[0].process_name;
        return contents.length > 1
          ? <Text ellipsis={{ showTooltip: true }}>{first} 等 {contents.length} 个流程</Text>
          : <Text ellipsis={{ showTooltip: true }}>{first}</Text>;
      },
    },
    {
      title: '流程数', dataIndex: 'process_count', width: 80, align: 'center',
      render: (_: unknown, r: LYReleaseResponse) => r.contents?.length ?? r.process_count ?? 0,
    },
    {
      title: '状态', dataIndex: 'publish_status', width: 120,
      render: (_: unknown, r: LYReleaseResponse) => {
        const d = getReleaseStatusDisplay(r);
        return <Tag color={d.color} type="light">{d.text}</Tag>;
      },
    },
    {
      title: '发布人', dataIndex: 'publisher_name', width: 130, ellipsis: true,
      render: (_text: string, record: LYReleaseResponse) => {
        if (!record.publisher_name) return '-';
        return (
          <UserNameWithCard
            name={record.publisher_name} userId={record.publisher_id}
            department={record.publisher_department || undefined}
            role={record.publisher_role || undefined}
            email={record.publisher_email || undefined}
          />
        );
      },
    },
    { title: '所属部门', dataIndex: 'publisher_department', width: 160, ellipsis: true, render: (v?: string) => v || '-' },
    {
      title: '提交时间', dataIndex: 'publish_time', width: 170,
      render: (time: string) => time
        ? new Date(time).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '-',
    },
    {
      title: t('common.actions'), dataIndex: 'actions', width: 60,
      render: (_: unknown, record: LYReleaseResponse) => (
        <Dropdown
          trigger="click" clickToHide position="bottomRight"
          render={
            <Dropdown.Menu>
              <Dropdown.Item onClick={(e) => { e.stopPropagation(); handleRowClick(record); }}>
                {t('common.viewDetail')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button icon={<Ellipsis size={16} strokeWidth={2} />} theme="borderless" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  const releaseTypeOptions = Object.entries(releaseTypeConfig).map(([value, cfg]) => ({ value, label: t(cfg.i18nKey) }));

  const publisherOptions = useMemo(() => {
    const publishers = ['张三', '李四', '王五'];
    return publishers.map((name) => ({ value: name, label: name }));
  }, []);

  const datePresets = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return [
      { text: '今天', start: today, end: now },
      { text: '最近 7 天', start: new Date(today.getTime() - 6 * 86400000), end: now },
      { text: '本月', start: new Date(now.getFullYear(), now.getMonth(), 1), end: now },
    ];
  }, []);

  return (
    <div className="release-list-page">
      <div className="release-list-page-header">
        <div className="release-list-page-header-title">
          <Title heading={3} className="title">{t('release.list.title')}</Title>
          <Text type="tertiary">{t('release.list.description')}</Text>
        </div>

        <Row type="flex" justify="space-between" align="middle" className="release-list-page-header-toolbar">
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder="搜索发布编号 / 流程名称 / 描述"
                onChange={handleSearch}
                showClear
                className="release-list-page-search-input"
              />
              <FilterPopover
                visible={filterVisible}
                onVisibleChange={setFilterVisible}
                onConfirm={handleFilterConfirm}
                sections={[
                  { key: 'release_type', label: '发布类型', type: 'checkbox', value: activeFilters.release_type, options: releaseTypeOptions },
                  { key: 'publish_status', label: '状态', type: 'checkbox', value: activeFilters.publish_status, options: statusFilterOptions },
                  { key: 'publish_date', label: '提交时间', type: 'dateRange', value: activeFilters.publish_date, datePresets },
                ]}
              />
            </Space>
          </Col>
          <Col>
            <Button
              icon={<Plus size={16} strokeWidth={2} />}
              theme="solid" type="primary"
              onClick={() => navigate('/dev-center/release-management/create')}
            >
              {t('release.list.newRelease')}
            </Button>
          </Col>
        </Row>
      </div>

      <div className="release-list-page-table">
        <Table
          size="small"
          dataSource={list}
          columns={columns}
          rowKey="release_id"
          loading={loading}
          scroll={{ y: 'calc(100vh - 320px)' }}
          empty={
            <EmptyState
              variant={queryParams.keyword || filterCount > 0 ? 'noResult' : 'noData'}
              description={queryParams.keyword || filterCount > 0 ? t('common.noResult') : t('release.list.noData')}
            />
          }
          pagination={{
            total, pageSize, currentPage,
            showSizeChanger: true, showTotal: true,
            pageSizeOpts: [10, 20, 50, 100],
            onPageChange: (page) => setQueryParams((p) => ({ ...p, offset: (page - 1) * pageSize })),
            onPageSizeChange: (size) => setQueryParams((p) => ({ ...p, offset: 0, size })),
          }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
            className: selectedRelease?.release_id === record?.release_id ? 'release-list-page-row-selected' : '',
          })}
        />
      </div>

      <ReleaseListDetailDrawer
        visible={detailDrawerVisible}
        release={selectedRelease}
        releaseList={list}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedRelease(null);
          if (routeId) navigate('/dev-center/release-management', { replace: true });
        }}
        onNavigate={(release) => setSelectedRelease(release)}
      />
    </div>
  );
};

// 兼容旧引用（PublishApprovals 等），导出空别名避免破坏外部 import
export type ReleaseApplicantExtension = never;
export const RELEASE_APPROVAL_STATUS_TAG = {} as Record<string, { color: 'grey'; text: string }>;

export default ReleaseListPage;
