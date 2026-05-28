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
  Dropdown,
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
  MOCK_CURRENT_USER_ID,
} from '../RequirementsWorkbench/mockData';
import RequirementDetailDrawer from '../RequirementsWorkbench/components/RequirementDetailDrawer';
import { ClipboardCheck, ClipboardList, Ellipsis, Eye } from 'lucide-react';
import iconPending from '@/assets/assessment-stats/pending.png';
import iconAssessed from '@/assets/assessment-stats/assessed.png';
import iconRecommend from '@/assets/assessment-stats/recommend.png';
import iconReject from '@/assets/assessment-stats/reject.png';
import './index.less';

const { Title, Text } = Typography;

type AssessTab = 'pending' | 'assessed' | 'all';

const feasibilityTagColor: Record<string, TagColor> = {
  feasible: 'green',
  not_recommended: 'orange',
  not_feasible: 'red',
};
const feasibilityLabel: Record<string, string> = {
  feasible: '可行',
  not_recommended: '不建议',
  not_feasible: '不通过',
};

const RequirementsAssessment = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AssessTab>('pending');
  const [searchValue, setSearchValue] = useState('');
  const [conclusionFilter, setConclusionFilter] = useState<string>('ALL');
  
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [allRequirements, setAllRequirements] = useState<RequirementItem[]>([]);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RequirementItem | null>(null);
  const [initialTab, setInitialTab] = useState<string>('overview');

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

  const isPendingMine = (r: RequirementItem) =>
    r.status === 'PENDING_ASSESSMENT' && !r.detailedAssessment;
  const isAssessedByMe = (r: RequirementItem) =>
    !!r.detailedAssessment && r.detailedAssessment.assessorId === MOCK_CURRENT_USER_ID;

  const stats = useMemo(() => {
    const pendingCount = allRequirements.filter(isPendingMine).length;
    const assessedCount = allRequirements.filter(isAssessedByMe).length;
    let recommendCount = 0;
    let rejectCount = 0;
    allRequirements.forEach((r) => {
      const a = r.detailedAssessment;
      if (!a || a.assessorId !== MOCK_CURRENT_USER_ID) return;
      if (a.feasibility === 'feasible') recommendCount += 1;
      if (a.feasibility === 'not_feasible') rejectCount += 1;
    });
    return { pendingCount, assessedCount, recommendCount, rejectCount };
  }, [allRequirements]);

  const filteredData = useMemo(() => {
    let data: RequirementItem[];
    switch (activeTab) {
      case 'pending':
        data = allRequirements.filter(isPendingMine);
        break;
      case 'assessed':
        data = allRequirements.filter(isAssessedByMe);
        break;
      case 'all':
      default:
        data = allRequirements.filter(
          (r) => r.status === 'PENDING_ASSESSMENT' || !!r.detailedAssessment,
        );
        break;
    }
    if (searchValue.trim()) {
      const kw = searchValue.toLowerCase().trim();
      data = data.filter(
        (item) => item.title.toLowerCase().includes(kw) || item.description.toLowerCase().includes(kw),
      );
    }
    if (departmentFilter.length > 0) {
      data = data.filter((item) => departmentFilter.includes(item.owning_department_name));
    }
    if (activeTab !== 'pending' && conclusionFilter !== 'ALL') {
      data = data.filter((item) => item.detailedAssessment?.feasibility === conclusionFilter);
    }
    return data;
  }, [activeTab, allRequirements, searchValue, departmentFilter, conclusionFilter]);

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

  const openAssess = (record: RequirementItem, tab: string = 'assessment') => {
    setSelectedRecord(record);
    setInitialTab(tab);
    setDetailDrawerVisible(true);
  };

  const columns = [
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
          <Tag color={(cfg?.color as TagColor) || 'grey'} type="light">
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
          <Tag color={(cfg?.color as TagColor) || 'grey'} type="light">
            {t(cfg?.i18nKey || 'requirements.priority.low')}
          </Tag>
        );
      },
    },
    {
      title: t('requirements.assessment.netScoreCol'),
      dataIndex: 'netScore',
      key: 'netScore',
      width: 120,
      sorter: (a: RequirementItem, b: RequirementItem) => {
        const sa = a.detailedAssessment?.netScore ?? Number.NEGATIVE_INFINITY;
        const sb = b.detailedAssessment?.netScore ?? Number.NEGATIVE_INFINITY;
        return sa - sb;
      },
      render: (_: unknown, record: RequirementItem) => {
        const a = record.detailedAssessment;
        if (!a) return <Text type="tertiary">-</Text>;
        return <Text strong>{a.netScore}</Text>;
      },
    },
    {
      title: t('requirements.assessment.conclusionCol'),
      dataIndex: 'feasibility',
      key: 'feasibility',
      width: 110,
      render: (_: unknown, record: RequirementItem) => {
        const a = record.detailedAssessment;
        if (!a?.feasibility) return <Text type="tertiary">-</Text>;
        return (
          <Tag color={feasibilityTagColor[a.feasibility] || 'grey'} type="light">
            {feasibilityLabel[a.feasibility] || a.feasibility}
          </Tag>
        );
      },
    },
    {
      title: t('requirements.assessment.assessorCol'),
      dataIndex: 'assessor',
      key: 'assessor',
      width: 120,
      ellipsis: true,
      render: (_: unknown, record: RequirementItem) => {
        const a = record.detailedAssessment;
        if (!a) return <Text type="tertiary">-</Text>;
        return <Text>{a.assessorName}</Text>;
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
    {
      title: t('common.actions'),
      dataIndex: 'action' as string,
      key: 'action',
      width: 60,
      ellipsis: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: ((_: any, record: RequirementItem) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              {isPendingMine(record) && (
                <Dropdown.Item
                  icon={<ClipboardCheck size={16} strokeWidth={2} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openAssess(record, 'assessment');
                  }}
                >
                  {t('requirements.assessment.startAssessment')}
                </Dropdown.Item>
              )}
              {!isPendingMine(record) && record.detailedAssessment && (
                <Dropdown.Item
                  icon={<ClipboardList size={16} strokeWidth={2} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openAssess(record, 'assessment');
                  }}
                >
                  {t('requirements.assessment.viewAssessment')}
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          }
        >
          <Button icon={<Ellipsis size={16} strokeWidth={2} />} theme="borderless" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      )) as never,
    },
  ];

  const pagination = useMemo(
    () => ({
      currentPage: 1,
      totalPages: 1,
      pageSize: filteredData.length,
      total: filteredData.length,
    }),
    [filteredData],
  );

  const metricCards = [
    {
      label: t('requirements.assessment.pendingCount'),
      value: stats.pendingCount,
      icon: iconPending,
    },
    {
      label: t('requirements.assessment.assessedCount'),
      value: stats.assessedCount,
      icon: iconAssessed,
    },
    {
      label: t('requirements.assessment.recommendCount'),
      value: stats.recommendCount,
      icon: iconRecommend,
    },
    {
      label: t('requirements.assessment.rejectCount'),
      value: stats.rejectCount,
      icon: iconReject,
    },
  ];

  return (
    <div className="requirements-assessment">
      <div className="requirements-assessment-header">
        <div className="requirements-assessment-header-title">
          <Title heading={3} className="title">
            {t('requirements.assessment.title')}
          </Title>
          <Text type="tertiary">{t('requirements.assessment.description')}</Text>
        </div>
      </div>

      <div className="requirements-assessment-stats-card">
        <div className="requirements-assessment-stats-grid">
          {metricCards.map((item, idx, arr) => (
            <div key={idx} className="requirements-assessment-metric-card">
              <div className="requirements-assessment-metric-icon">
                <img src={item.icon} alt="" />
              </div>
              <div className="requirements-assessment-metric-info">
                <div className="requirements-assessment-metric-label">{item.label}</div>
                <div className="requirements-assessment-metric-value">{item.value}</div>
              </div>
              {idx < arr.length - 1 && <div className="requirements-assessment-metric-divider" />}
            </div>
          ))}
        </div>
      </div>

      <div className="requirements-assessment-content">
        <Row
          type="flex"
          justify="space-between"
          align="middle"
          className="requirements-assessment-toolbar"
        >
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('requirements.assessment.searchPlaceholder')}
                className="requirements-assessment-search-input"
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
              {activeTab !== 'pending' && (
                <FilterPopover
                  visible={filterPopoverVisible}
                  onVisibleChange={setFilterPopoverVisible}
                  onConfirm={(values) => {
                    setConclusionFilter((values.conclusion as string) || 'ALL');
                  }}
                  sections={[
                    {
                      key: 'conclusion',
                      label: t('requirements.assessment.filterConclusion'),
                      type: 'radio',
                      options: [
                        { label: t('requirements.assessment.filterConclusionAll'), value: 'ALL' },
                        { label: '可行', value: 'feasible' },
                        { label: '不建议', value: 'not_recommended' },
                        { label: '不通过', value: 'not_feasible' },
                      ],
                      value: conclusionFilter,
                    },
                  ]}
                />
              )}
            </Space>
          </Col>
        </Row>
        <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as AssessTab)} keepDOM={false}>
          <TabPane
            tab={t('requirements.assessment.pendingMe')}
            itemKey="pending"
          >
            {isInitialLoad ? (
              <TableSkeleton rows={6} columns={9} />
            ) : (
              <Table
                size="small"
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                rowKey="id"
                empty={<EmptyState variant="noData" description={t('requirements.assessment.noPending')} />}
                onRow={(record) => ({
                  style: { cursor: 'pointer' },
                  className:
                    selectedRecord?.id === record?.id && detailDrawerVisible
                      ? 'requirements-assessment-row-selected'
                      : undefined,
                  onClick: () => {
                    if (record) {
                      setSelectedRecord(record as RequirementItem);
                      setInitialTab('overview'); if (!detailDrawerVisible) setDetailDrawerVisible(true);
                    }
                  },
                })}
                pagination={false}
                scroll={{ y: 'calc(100vh - 440px)' }}
              />
            )}
          </TabPane>

          <TabPane tab={t('requirements.assessment.assessedByMe')} itemKey="assessed">
            {isInitialLoad ? (
              <TableSkeleton rows={6} columns={9} />
            ) : (
              <Table
                size="small"
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                rowKey="id"
                empty={<EmptyState variant="noData" description={t('requirements.assessment.noAssessed')} />}
                onRow={(record) => ({
                  style: { cursor: 'pointer' },
                  onClick: () => {
                    if (record) {
                      setSelectedRecord(record as RequirementItem);
                      setInitialTab('overview'); if (!detailDrawerVisible) setDetailDrawerVisible(true);
                    }
                  },
                })}
                pagination={false}
                scroll={{ y: 'calc(100vh - 440px)' }}
              />
            )}
          </TabPane>

          <TabPane tab={t('requirements.assessment.allAssessments')} itemKey="all">
            {isInitialLoad ? (
              <TableSkeleton rows={6} columns={9} />
            ) : (
              <Table
                size="small"
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                rowKey="id"
                empty={<EmptyState variant="noData" description={t('requirements.assessment.noRecords')} />}
                onRow={(record) => ({
                  style: { cursor: 'pointer' },
                  onClick: () => {
                    if (record) {
                      setSelectedRecord(record as RequirementItem);
                      setInitialTab('overview'); if (!detailDrawerVisible) setDetailDrawerVisible(true);
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

      <RequirementDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        data={selectedRecord}
        dataList={filteredData}
        onNavigate={(item) => setSelectedRecord(item)}
        onEdit={() => {}}
        onDelete={() => {}}
        onStatusChange={handleStatusChange}
        onRefresh={async () => {
          const response = await fetchRequirementList({
            offset: 0,
            size: 200,
            keyword: '',
            sort_by: 'created_at',
            sort_order: 'desc',
          });
          setAllRequirements(response.list);
          if (selectedRecord) {
            const updated = response.list.find((r) => r.id === selectedRecord.id);
            if (updated) setSelectedRecord(updated);
          }
          setActiveTab('assessed');
        }}
        pagination={pagination}
        onScrollToRow={() => {}}
        initialTab="assessment"
        context="assessment"
      />

    </div>
  );
};

export default RequirementsAssessment;
