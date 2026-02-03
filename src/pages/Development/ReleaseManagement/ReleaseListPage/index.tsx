import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
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
  IconSearch,
  IconFilter,
  IconPlus,
  IconMore,
  IconRefresh,
} from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import AppLayout from '@/components/layout/AppLayout';
import EmptyState from '@/components/EmptyState';
import FilterPopover from '@/components/FilterPopover';
import ReleaseDetailDrawer from '../components/ReleaseDetailDrawer';
import RollbackConfirmModal from '../components/RollbackConfirmModal';
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
      ? '更新订单处理逻辑，修复库存检查问题' 
      : `发布描述 ${index + 1}：包含多个流程的更新和配置变更`,
    publisher_id: `user-${(index % 3) + 1}`,
    publisher_name: ['张三', '李四', '王五'][index % 3],
    publish_time: date.toISOString(),
    publish_status: status,
    process_count: (index % 3) + 1,
    resource_count: (index % 5) + 2,
    error_message: status === 'FAILED' ? '缺失依赖: PARAM-CONFIG_PATH' : null,
    contents: [
      {
        process_id: `process-${index}-1`,
        process_name: '客户信息同步',
        version_id: `ver-${index}-1`,
        version_number: `v1.${index}.0`,
        process_description: '从 ERP 同步客户数据到 CRM',
      },
      ...(index % 2 === 0
        ? [
            {
              process_id: `process-${index}-2`,
              process_name: '订单处理',
              version_id: `ver-${index}-2`,
              version_number: `v2.${index}.0`,
              process_description: '处理客户订单并验证',
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

  // 筛选状态
  const [filterVisible, setFilterVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState<{
    release_type: ReleaseType[];
    publish_status: ReleaseStatus[];
  }>({ release_type: [], publish_status: [] });
  const [activeFilters, setActiveFilters] = useState<{
    release_type: ReleaseType[];
    publish_status: ReleaseStatus[];
  }>({ release_type: [], publish_status: [] });

  // 详情抽屉
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedRelease, setSelectedRelease] =
    useState<LYReleaseResponse | null>(null);

  // 回退弹窗
  const [rollbackModalVisible, setRollbackModalVisible] = useState(false);
  const [rollbackRelease, setRollbackRelease] =
    useState<LYReleaseResponse | null>(null);

  const { range, list } = listResponse;
  const currentPage =
    Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  const filterCount =
    activeFilters.release_type.length + activeFilters.publish_status.length;

  // 加载数据
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

  // URL 参数处理 - 打开详情
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

  // 搜索防抖
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
      }, 500),
    []
  );

  // 筛选操作
  const handleFilterConfirm = () => {
    setActiveFilters(tempFilters);
    setFilterVisible(false);
    setQueryParams((prev) => ({ ...prev, offset: 0 }));
  };

  const handleFilterReset = () => {
    setTempFilters({ release_type: [], publish_status: [] });
  };

  // 行点击
  const handleRowClick = (record: LYReleaseResponse) => {
    setSelectedRelease(record);
    setDetailDrawerVisible(true);
  };

  // 回退操作
  const handleRollback = (record: LYReleaseResponse) => {
    setRollbackRelease(record);
    setRollbackModalVisible(true);
  };

  const handleRollbackConfirm = async () => {
    // Mock API 调用
    await new Promise((resolve) => setTimeout(resolve, 1000));
    Toast.success(t('release.rollback.success'));
    setRollbackModalVisible(false);
    setRollbackRelease(null);
    loadData();
  };

  // 发布类型配置
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

  // 状态配置
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
      render: (text: string) => (
        <Text className="release-list-id">{text}</Text>
      ),
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
      width: 240,
      render: (contents: LYReleaseResponse['contents']) => {
        if (!contents || contents.length === 0) return '-';
        const displayNames = contents.slice(0, 2).map((c) => c.process_name);
        const remaining = contents.length - 2;
        return (
          <Tooltip
            content={contents.map((c) => `${c.process_name} (${c.version_number})`).join(', ')}
            position="topLeft"
          >
            <span className="release-list-processes">
              {displayNames.join(', ')}
              {remaining > 0 && ` +${remaining}`}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: t('release.list.columns.description'),
      dataIndex: 'description',
      width: 200,
      render: (text: string) => (
        <span className="release-list-description">{text || '-'}</span>
      ),
    },
    {
      title: t('release.list.columns.publisher'),
      dataIndex: 'publisher_name',
      width: 100,
      render: (text: string) => text || '-',
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
      width: 80,
      fixed: 'right',
      render: (_: unknown, record: LYReleaseResponse) => (
        <Dropdown
          trigger="click"
          clickToHide
          position="bottomRight"
          render={
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleRowClick(record)}>
                {t('common.viewDetail')}
              </Dropdown.Item>
              {record.publish_status === 'SUCCESS' &&
                record.release_type !== 'VERSION_ROLLBACK' && (
                  <Dropdown.Item onClick={() => handleRollback(record)}>
                    {t('release.actions.rollback')}
                  </Dropdown.Item>
                )}
            </Dropdown.Menu>
          }
        >
          <Button
            icon={<IconMore />}
            theme="borderless"
            type="tertiary"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  // 筛选选项
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

  return (
    <AppLayout>
      <div className="release-list-page">
        {/* 面包屑 */}
        <div className="release-list-page-breadcrumb">
          <Text type="tertiary">
            {t('release.breadcrumb.developmentCenter')} /{' '}
            {t('sidebar.publishManagement')} / {t('release.list.title')}
          </Text>
        </div>

        {/* 标题区域 */}
        <div className="release-list-page-header">
          <div className="release-list-page-header-title">
            <Title heading={4} className="title">
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
                  prefix={<IconSearch />}
                  placeholder={t('release.list.searchPlaceholder')}
                  onChange={handleSearch}
                  showClear
                  className="release-list-page-search-input"
                />
                <FilterPopover
                  visible={filterVisible}
                  onVisibleChange={setFilterVisible}
                  onConfirm={handleFilterConfirm}
                  onReset={handleFilterReset}
                  sections={[
                    {
                      key: 'release_type',
                      label: t('release.list.columns.releaseType'),
                      type: 'checkbox',
                      value: tempFilters.release_type,
                      onChange: (value) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          release_type: value as ReleaseType[],
                        })),
                      options: releaseTypeOptions,
                    },
                    {
                      key: 'publish_status',
                      label: t('release.list.columns.status'),
                      type: 'checkbox',
                      value: tempFilters.publish_status,
                      onChange: (value) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          publish_status: value as ReleaseStatus[],
                        })),
                      options: statusOptions,
                    },
                  ]}
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<IconRefresh />}
                  theme="borderless"
                  type="tertiary"
                  onClick={loadData}
                />
                <Button
                  icon={<IconPlus />}
                  theme="solid"
                  type="primary"
                  onClick={() => navigate('/dev-center/release-management/create')}
                >
                  {t('release.list.newRelease')}
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* 表格 */}
        <div className="release-list-page-table">
          <Table
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
          onClose={() => {
            setDetailDrawerVisible(false);
            setSelectedRelease(null);
          }}
          onRollback={handleRollback}
        />

        {/* 回退确认弹窗 */}
        <RollbackConfirmModal
          visible={rollbackModalVisible}
          release={rollbackRelease}
          onCancel={() => {
            setRollbackModalVisible(false);
            setRollbackRelease(null);
          }}
          onConfirm={handleRollbackConfirm}
        />
      </div>
    </AppLayout>
  );
};

export default ReleaseListPage;
