import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  // Breadcrumb removed
  Typography,
  Button,
  Table,
  Tag,
  Input,
  Row,
  Col,
  Space,
  Tooltip,
  Dropdown,
  Toast,
} from '@douyinfe/semi-ui';
import {
  IconSearchStroked,
  IconFilterStroked,
  IconPlusStroked,
  IconMoreStroked,
} from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
// AppLayout removed
import EmptyState from '@/components/EmptyState';
import FilterPopover from '@/components/FilterPopover';
import ReleaseDetailDrawer from '../components/ReleaseDetailDrawer';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type {
  LYReleaseResponse,
  LYListResponseLYReleaseResponse,
  ReleaseType,
  ReleaseStatus,
  GetReleasesParams,
} from '@/api';

import './index.less';

const { Title, Text } = Typography;

// Mock 数据生成器
const generateMockReleaseResponse = (index: number): LYReleaseResponse => {
  const releaseTypes: ReleaseType[] = [
    'FIRST_RELEASE',
    'REQUIREMENT_CHANGE',
    'BUG_FIX',
    'CONFIG_UPDATE',
    'VERSION_ROLLBACK',
    'OPTIMIZATION',
  ];
  const statuses: ReleaseStatus[] = ['SUCCESS', 'FAILED', 'PUBLISHING'];
  const releaseType = releaseTypes[index % releaseTypes.length];
  const status = index === 2 ? 'FAILED' : index === 0 ? 'PUBLISHING' : 'SUCCESS';

  const date = new Date();
  date.setDate(date.getDate() - index);
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

  return {
    release_id: `RLS-${dateStr}-${String(index + 1).padStart(3, '0')}`,
    release_type: releaseType,
    description: index === 2 
      ? 'Updated order processing logic, fixed inventory check issues' 
      : `Release description ${index + 1}：Contains multiple process updates and config changes`,
    publisher_id: `user-${(index % 3) + 1}`,
    publisher_name: ['John Smith', 'Jane Doe', 'Mike Wang'][index % 3],
    publisher_department: ['技术部', '产品部', '运维部'][index % 3],
    publisher_role: ['高级工程师', '产品经理', '运维工程师'][index % 3],
    publisher_email: ['zhangsan@example.com', 'lisi@example.com', 'wangwu@example.com'][index % 3],
    publish_time: date.toISOString(),
    publish_status: status,
    process_count: (index % 3) + 1,
    resource_count: (index % 5) + 2,
    error_message: status === 'FAILED' ? '缺失依赖: PARAM-CONFIG_PATH' : null,
    contents: [
      {
        process_id: `process-${index}-1`,
        process_name: index % 4 === 0 
          ? 'SAP_ERP_Order_Processing_And_Fulfillment_Workflow_With_Inventory_Check_V3' 
          : index % 4 === 1 
            ? 'Customer Info Sync' 
            : index % 4 === 2 
              ? 'Customer_Onboarding_KYC_Verification_And_Account_Provisioning_Enterprise_Workflow_With_Compliance_Check'
              : '数据备份',
        version_id: `ver-${index}-1`,
        version_number: `v1.${index}.0`,
        process_description: index % 4 === 0
          ? '该Process用于处理来自SAP ERP系统的所有客户订单，包括订单验证、Inventory Check、价格计算、折扣应用、税费计算、物流分配、发票生成以及客户通知等完整的端到端业务Process。支持多币种、多仓库、多物流商的复杂场景处理。'
          : index % 4 === 2
            ? '客户入网全Process自动化，涵盖KYC身份验证、合规检查、风控评估、账户开通、权限分配、欢迎邮件发送及CRM系统同步等环节，支持多国家地区的监管要求适配。'
            : index % 4 === 3 ? '' : '从 ERP 同步客户数据到 CRM',
      },
      ...(index % 2 === 0
        ? [
            {
              process_id: `process-${index}-2`,
              process_name: index % 4 === 0 
                ? 'Monthly_Financial_Report_Generation_And_Distribution_Workflow' 
                : 'Order Processing',
              version_id: `ver-${index}-2`,
              version_number: `v2.${index}.0`,
              process_description: index % 4 === 0 
                ? '每M自动生成财务报表并分发给相关部门负责人，支持PDF和Excel双格式输出。' 
                : '处理客户订单并验证',
            },
          ]
        : []),
    ],
    resources: [],
  };
};

const generateMockListResponse = (
  params: GetReleasesParams
): LYListResponseLYReleaseResponse => {
  const allData = Array.from({ length: 45 }, (_, i) =>
    generateMockReleaseResponse(i)
  );

  let filtered = allData;

  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.release_id.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
    );
  }

  if (params.release_type) {
    filtered = filtered.filter(
      (item) => item.release_type === params.release_type
    );
  }

  if (params.publish_status) {
    filtered = filtered.filter(
      (item) => item.publish_status === params.publish_status
    );
  }

  const offset = params.offset || 0;
  const size = params.size || 20;
  const paginated = filtered.slice(offset, offset + size);

  return {
    range: { offset, size, total: filtered.length },
    list: paginated,
  };
};

const ReleaseListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [listResponse, setListResponse] =
    useState<LYListResponseLYReleaseResponse>({
      range: { offset: 0, size: 20, total: 0 },
      list: [],
    });
  const [loading, setLoading] = useState(false);
  const [queryParams, setQueryParams] = useState<GetReleasesParams>({
    offset: 0,
    size: 20,
    keyword: '',
  });

  // FilterStatus
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    release_type: ReleaseType[];
    publish_status: ReleaseStatus[];
    publisher: string[];
    publish_date: [Date, Date] | null;
  }>({ release_type: [], publish_status: [], publisher: [], publish_date: null });

  // 详情抽屉
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedRelease, setSelectedRelease] =
    useState<LYReleaseResponse | null>(null);

  const { range, list } = listResponse;
  const currentPage =
    Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  const filterCount =
    activeFilters.release_type.length + activeFilters.publish_status.length + activeFilters.publisher.length;

  // Loading数据
  const loadData = async () => {
    setLoading(true);
    try {
      // Mock API 调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      const response = generateMockListResponse({
        ...queryParams,
        release_type:
          activeFilters.release_type.length === 1
            ? activeFilters.release_type[0]
            : undefined,
        publish_status:
          activeFilters.publish_status.length === 1
            ? activeFilters.publish_status[0]
            : undefined,
      });
      setListResponse(response);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [queryParams, activeFilters]);

  // URL Parameter处理 - 打开详情
  useEffect(() => {
    const releaseId = searchParams.get('releaseId');
    if (releaseId && listResponse.list.length > 0) {
      const release = listResponse.list.find((r) => r.release_id === releaseId);
      if (release) {
        setSelectedRelease(release);
        setDetailDrawerVisible(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, listResponse]);

  // Search防抖
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
      }, 500),
    []
  );

  // Filter操作
  const handleFilterConfirm = (values: Record<string, unknown>) => {
    const dateValue = values.publish_date as [Date, Date] | undefined;
    setActiveFilters({
      release_type: (values.release_type as ReleaseType[]) || [],
      publish_status: (values.publish_status as ReleaseStatus[]) || [],
      publisher: (values.publisher as string[]) || [],
      publish_date: dateValue && dateValue.length === 2 ? dateValue : null,
    });
    setQueryParams((prev) => ({ ...prev, offset: 0 }));
  };

  // 行点击
  const handleRowClick = (record: LYReleaseResponse) => {
    setSelectedRelease(record);
    setDetailDrawerVisible(true);
  };

  // ReleaseType配置
  const releaseTypeConfig: Record<
    ReleaseType,
    { color: 'blue' | 'cyan' | 'orange' | 'purple' | 'grey' | 'green'; i18nKey: string }
  > = {
    FIRST_RELEASE: { color: 'blue', i18nKey: 'release.releaseTypes.FIRST_RELEASE' },
    REQUIREMENT_CHANGE: { color: 'cyan', i18nKey: 'release.releaseTypes.REQUIREMENT_CHANGE' },
    BUG_FIX: { color: 'orange', i18nKey: 'release.releaseTypes.BUG_FIX' },
    CONFIG_UPDATE: { color: 'purple', i18nKey: 'release.releaseTypes.CONFIG_UPDATE' },
    VERSION_ROLLBACK: { color: 'grey', i18nKey: 'release.releaseTypes.VERSION_ROLLBACK' },
    OPTIMIZATION: { color: 'green', i18nKey: 'release.releaseTypes.OPTIMIZATION' },
  };

  // Status配置
  const statusConfig: Record<
    ReleaseStatus,
    { color: 'green' | 'red' | 'blue'; i18nKey: string }
  > = {
    SUCCESS: { color: 'green', i18nKey: 'release.publishStatus.SUCCESS' },
    FAILED: { color: 'red', i18nKey: 'release.publishStatus.FAILED' },
    PUBLISHING: { color: 'blue', i18nKey: 'release.publishStatus.PUBLISHING' },
  };

  const columns: ColumnProps<LYReleaseResponse>[] = [
    {
      title: t('release.list.columns.releaseId'),
      dataIndex: 'release_id',
      width: 180,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: t('release.list.columns.releaseType'),
      dataIndex: 'release_type',
      width: 120,
      render: (type: ReleaseType) => {
        const config = releaseTypeConfig[type];
        return config ? (
          <Tag color={config.color}>{t(config.i18nKey)}</Tag>
        ) : (
          '-'
        );
      },
    },
    {
      title: t('release.list.columns.status'),
      dataIndex: 'publish_status',
      width: 100,
      render: (status: ReleaseStatus) => {
        const config = statusConfig[status];
        return config ? (
          <Tag color={config.color}>{t(config.i18nKey)}</Tag>
        ) : (
          '-'
        );
      },
    },
    {
      title: t('release.list.columns.processes'),
      dataIndex: 'contents',
      width: 100,
      render: (contents: LYReleaseResponse['contents']) => {
        if (!contents || contents.length === 0) return '-';
        return <Text>{contents.length}个Process</Text>;
      },
    },
    {
      title: t('release.list.columns.description'),
      dataIndex: 'description',
      width: 200,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: t('release.list.columns.publisher'),
      dataIndex: 'publisher_name',
      width: 120,
      ellipsis: true,
      render: (_text: string, record: LYReleaseResponse) => {
        if (!record.publisher_name) return '-';
        return <UserNameWithCard name={record.publisher_name} userId={record.publisher_id} department={(record as any).publisher_department} role={(record as any).publisher_role} email={(record as any).publisher_email} />;
      },
    },
    {
      title: t('release.list.columns.publishTime'),
      dataIndex: 'publish_time',
      width: 160,
      render: (time: string) => {
        if (!time) return '-';
        const date = new Date(time);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    {
      title: t('common.actions'),
      dataIndex: 'actions',
      width: 60,
      render: (_: unknown, record: LYReleaseResponse) => (
        <Dropdown
          trigger="click"
          clickToHide
          position="bottomRight"
          render={
            <Dropdown.Menu>
              <Dropdown.Item onClick={(e) => {
                e.stopPropagation();
                handleRowClick(record);
              }}>
                {t('common.viewDetail')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button
            icon={<IconMoreStroked />}
            theme="borderless"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  // Filter选项
  const releaseTypeOptions = Object.entries(releaseTypeConfig).map(
    ([value, config]) => ({
      value,
      label: t(config.i18nKey),
    })
  );

  const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
    value,
    label: t(config.i18nKey),
  }));

  // Release者选项（从mock数据中提取）
  const publisherOptions = useMemo(() => {
    const publishers = ['John Smith', 'Jane Doe', 'Mike Wang'];
    return publishers.map((name) => ({ value: name, label: name }));
  }, []);

  // Sun期快捷选项
  const datePresets = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return [
      { text: '今天', start: today, end: now },
      { text: '最近7天', start: new Date(today.getTime() - 6 * 86400000), end: now },
      { text: '本M', start: new Date(now.getFullYear(), now.getMonth(), 1), end: now },
    ];
  }, []);

  return (
      <div className="release-list-page">

        {/* Title area */}
        <div className="release-list-page-header">
          <div className="release-list-page-header-title">
            <Title heading={3} className="title">
              {t('release.list.title')}
            </Title>
            <Text type="tertiary">{t('release.list.description')}</Text>
          </div>

          {/* 操作栏 */}
          <Row
            type="flex"
            justify="space-between"
            align="middle"
            className="release-list-page-header-toolbar"
          >
            <Col>
              <Space>
                <Input
                  prefix={<IconSearchStroked />}
                  placeholder={t('release.list.searchPlaceholder')}
                  onChange={handleSearch}
                  showClear
                  className="release-list-page-search-input"
                />
                <FilterPopover
                  visible={filterVisible}
                  onVisibleChange={setFilterVisible}
                  onConfirm={handleFilterConfirm}
                  sections={[
                    {
                      key: 'release_type',
                      label: t('release.list.columns.releaseType'),
                      type: 'checkbox',
                      value: activeFilters.release_type,
                      options: releaseTypeOptions,
                    },
                    {
                      key: 'publish_status',
                      label: t('release.list.columns.status'),
                      type: 'checkbox',
                      value: activeFilters.publish_status,
                      options: statusOptions,
                    },
                    {
                      key: 'publisher',
                      label: t('release.list.columns.publisher'),
                      type: 'checkbox',
                      value: activeFilters.publisher,
                      options: publisherOptions,
                    },
                    {
                      key: 'publish_date',
                      label: t('release.list.columns.publishTime'),
                      type: 'dateRange',
                      value: activeFilters.publish_date,
                      datePresets,
                    },
                  ]}
                />
              </Space>
            </Col>
            <Col>
              <Button
                icon={<IconPlusStroked />}
                theme="solid"
                type="primary"
                onClick={() => navigate('/dev-center/release-management/create')}
              >
                {t('release.list.newRelease')}
              </Button>
            </Col>
          </Row>
        </div>

        {/* 表格 */}
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
                description={
                  queryParams.keyword || filterCount > 0
                    ? t('common.noResult')
                    : t('release.list.noData')
                }
              />
            }
            pagination={{
              total,
              pageSize,
              currentPage,
              showSizeChanger: true,
              showTotal: true,
              pageSizeOpts: [10, 20, 50, 100],
              onPageChange: (page) => {
                setQueryParams((prev) => ({
                  ...prev,
                  offset: (page - 1) * pageSize,
                }));
              },
              onPageSizeChange: (size) => {
                setQueryParams((prev) => ({ ...prev, offset: 0, size }));
              },
            }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: 'pointer' },
              className:
                selectedRelease?.release_id === record?.release_id
                  ? 'release-list-page-row-selected'
                  : '',
            })}
          />
        </div>

        {/* 详情抽屉 */}
        <ReleaseDetailDrawer
          visible={detailDrawerVisible}
          release={selectedRelease}
          releaseList={list}
          onClose={() => {
            setDetailDrawerVisible(false);
            setSelectedRelease(null);
          }}
          onNavigate={(release) => {
            setSelectedRelease(release);
          }}
        />
      </div>
  );
};

export default ReleaseListPage;
