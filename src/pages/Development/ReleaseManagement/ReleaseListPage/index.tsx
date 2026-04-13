import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Table,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Space,
  Tooltip,
  Dropdown,
  Toast,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
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
import { Ellipsis, Filter, Plus } from 'lucide-react';

const { Title, Text } = Typography;

// Mock Datageneration器
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
      : `Release description ${index + 1}: Contains multiple process updates and config changes`,
    publisher_id: `user-${(index % 3) + 1}`,
    publisher_name: ['John Smith', 'Jane Doe', 'Mike Wang'][index % 3],
    publisher_department: ['Engineering', 'Product', 'Operations'][index % 3],
    publisher_role: ['Senior Engineer', 'Product Manager', 'Ops Engineer'][index % 3],
    publisher_email: ['zhangsan@example.com', 'lisi@example.com', 'wangwu@example.com'][index % 3],
    publish_time: date.toISOString(),
    publish_status: status,
    process_count: (index % 3) + 1,
    resource_count: (index % 5) + 2,
    error_message: status === 'FAILED' ? 'Missing dependency: PARAM-CONFIG_PATH' : null,
    contents: [
      {
        process_id: `process-${index}-1`,
        process_name: index % 4 === 0 
          ? 'SAP_ERP_Order_Processing_And_Fulfillment_Workflow_With_Inventory_Check_V3' 
          : index % 4 === 1 
            ? 'Customer Info Sync' 
            : index % 4 === 2 
              ? 'Customer_Onboarding_KYC_Verification_And_Account_Provisioning_Enterprise_Workflow_With_Compliance_Check'
              : 'Data Backup',
        version_id: `ver-${index}-1`,
        version_number: `v1.${index}.0`,
        process_description: index % 4 === 0
          ? 'This process handles all customer orders from SAP ERP system, including order validation, inventory check, pricing, discounts, tax calculation, logistics allocation, invoice generation and customer notification. Supports multi-currency, multi-warehouse, and multi-carrier complex scenarios.'
          : index % 4 === 2
            ? 'Full customer onboarding automation covering KYC identity verification, compliance check, risk assessment, account provisioning, permission assignment, welcome email and CRM system sync, supporting multi-country regulatory compliance.'
            : index % 4 === 3 ? '' : 'Sync customer data from ERP to CRM',
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
                ? 'Monthly auto-generation of financial reports distributed to relevant department stakeholders, supporting PDF and Excel dual format output.'
                : 'Process customer orders and validate',
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

  // Details drawer
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedRelease, setSelectedRelease] =
    useState<LYReleaseResponse | null>(null);

  const { range, list } = listResponse;
  const currentPage =
    Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  const filterCount =
    activeFilters.release_type.length + activeFilters.publish_status.length;

  // LoadingData
  const loadData = async () => {
    setLoading(true);
    try {
      // Mock API 调use
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

  // URL Parameterprocessing - openDetails
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

  // Searchdebounced
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
      }, 500),
    []
  );

  // FilterOperation
  const handleFilterConfirm = (values: Record<string, unknown>) => {
    const dateValue = values.publish_date as [Date, Date] | undefined;
    setActiveFilters(prev => ({
      ...prev,
      release_type: (values.release_type as ReleaseType[]) || [],
      publish_status: (values.publish_status as ReleaseStatus[]) || [],
      publish_date: dateValue && dateValue.length === 2 ? dateValue : null,
    }));
    setQueryParams((prev) => ({ ...prev, offset: 0 }));
  };

  // 行点击
  const handleRowClick = (record: LYReleaseResponse) => {
    setSelectedRelease(record);
    setDetailDrawerVisible(true);
  };

  // ReleaseTypeConfig
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

  // StatusConfig
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
        return <Text>{contents.length}Process</Text>;
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
            icon={<Ellipsis size={16} strokeWidth={2} />}
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

  // Release者选项(frommockData提取)
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

          {/* Operation */}
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
                <Select
                  placeholder={t('release.list.columns.publisher')}
                  value={activeFilters.publisher}
                  onChange={(v) => {
                    setActiveFilters(prev => ({ ...prev, publisher: v as string[] }));
                    setQueryParams(prev => ({ ...prev, offset: 0 }));
                  }}
                  multiple
                  showClear
                  maxTagCount={1}
                  style={{ width: 180 }}
                  optionList={publisherOptions}
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
                icon={<Plus size={16} strokeWidth={2} />}
                theme="solid"
                type="primary"
                onClick={() => navigate('/dev-center/release-management/create')}
              >
                {t('release.list.newRelease')}
              </Button>
            </Col>
          </Row>
        </div>

        {/* Table */}
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

        {/* Details drawer */}
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
