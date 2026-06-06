import { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Input,
  Button,
  
  Table,
  Dropdown,
  Row,
  Col,
  Modal,
  Toast,
  Space,
  
  Tooltip,
  Checkbox,
} from '@douyinfe/semi-ui';
import DepartmentSearchSelect, { expandDepartmentValues } from '@/components/DepartmentSearchSelect';
import FilterPopover from '@/components/FilterPopover';
import { IconSearchStroked, IconDeleteStroked } from '@douyinfe/semi-icons';
import { Ellipsis, Pencil, Plus, Send, Trash2, Undo2, Columns3, GitBranchPlus, Ban, PowerOff, RotateCcw } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';

import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type { RequirementItem, RequirementQueryParams, RequirementStatus } from './types';
import {
  fetchRequirementList,
  deleteRequirement,
  
  
  updateRequirementStatus,
  resubmitRequirement,
  withdrawRequirement,
  useSchemeFlags,
  MOCK_CURRENT_USER_ID,
  
  getRequirementEffortSummary,
} from './mockData';
import { statusConfigV2, legacyStatusMap, statusOptionsV2, isBusinessOnlyEdit } from './statusConfig';

import RequirementDetailDrawer from './components/RequirementDetailDrawer';
import ResubmitDialog from './components/ResubmitDialog';
import StatusDot from './components/StatusDot';
import TitleCell from './components/TitleCell';
import { buildSubmitConfirmContent } from './utils/submitConfirm';

import './index.less';

const { Title, Text } = Typography;

const RequirementsWorkbench = () => {
  const { t } = useTranslation();
  const { hasApproval, hasAssessment, submittedStatus } = useSchemeFlags();
  const location = useLocation();
  const navigate = useNavigate();

  // 搜索
  const [searchValue, setSearchValue] = useState('');

  // 查询参数
  const [queryParams, setQueryParams] = useState<RequirementQueryParams>({
    offset: 0,
    size: 20,
    keyword: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // 筛选
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [includeSubDepts, setIncludeSubDepts] = useState(false);
  const effectiveDepartmentFilter = useMemo(() => expandDepartmentValues(departmentFilter, includeSubDepts, true), [departmentFilter, includeSubDepts]);
  
  const [statusFilter, setStatusFilter] = useState<RequirementStatus[]>([]);
  const [statusFilterVisible, setStatusFilterVisible] = useState(false);

  // 状态
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // createModalVisible 已废弃：新建走 /requirements/list/create 独立页面
  // 新建/编辑均跳转独立页面
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RequirementItem | null>(null);
  const [initialDrawerTab, setInitialDrawerTab] = useState<string | undefined>(undefined);

  // 可选列（持久化到 localStorage）
  const OPTIONAL_COLUMNS_KEY = 'requirements.list.optionalColumns';
  type OptionalColumnKey = 'effort_estimate' | 'effort_actual' | 'completion_rate';
  const [optionalColumns, setOptionalColumns] = useState<OptionalColumnKey[]>(() => {
    try {
      const raw = localStorage.getItem(OPTIONAL_COLUMNS_KEY);
      if (raw) return JSON.parse(raw) as OptionalColumnKey[];
    } catch { /* ignore */ }
    return [];
  });
  const toggleOptionalColumn = (key: OptionalColumnKey) => {
    setOptionalColumns((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try { localStorage.setItem(OPTIONAL_COLUMNS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  // 列表数据
  const [listResponse, setListResponse] = useState<{
    range: { offset: number; size: number; total: number };
    list: RequirementItem[];
  }>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchRequirementList({
        ...queryParams,
        departmentFilter: effectiveDepartmentFilter,
        statusFilter,
      });
      setListResponse(response);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, departmentFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 跨页跳转：来自流程列表「关联需求」Tag 的 navigate(state)
  useEffect(() => {
    const openId = (location.state as { openRequirementId?: string } | null)?.openRequirementId;
    if (!openId) return;
    const hit = listResponse.list.find((r) => r.id === openId);
    if (hit) {
      setSelectedRecord(hit);
      setDetailDrawerVisible(true);
      // 清理 state，避免重复触发
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, listResponse.list, navigate]);

  // URL 直达：?openDevResponse=1&requirementId=xxx[&changeLogId=xxx]
  // 由项目模块的红点跳转过来，自动打开对应需求抽屉，
  // 抽屉内的 effect 会进一步弹出响应面板（已有逻辑）。
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openDevResponse') !== '1') return;
    const reqId = params.get('requirementId');
    if (!reqId) return;
    const hit = listResponse.list.find((r) => r.id === reqId);
    if (hit) {
      setSelectedRecord(hit);
      setDetailDrawerVisible(true);
    }
  }, [location.search, listResponse.list]);

  // URL 直达：?reqNo=REQ-2026-xxxx&tab=xxx（来自通知中心跳转）
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reqNo = params.get('reqNo');
    if (!reqNo) return;
    const hit = listResponse.list.find((r) => r.req_no === reqNo);
    if (hit) {
      setSelectedRecord(hit);
      setInitialDrawerTab(params.get('tab') || undefined);
      setDetailDrawerVisible(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, listResponse.list, navigate]);

  // 搜索防抖
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, offset: 0, keyword: value }));
      }, 500),
    [],
  );

  const handleSearch = (value: string) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  // 排序
  const handleSort = (sortBy: string) => {
    setQueryParams((prev) => ({
      ...prev,
      offset: 0,
      sort_by: sortBy,
      sort_order: prev.sort_by === sortBy && prev.sort_order === 'desc' ? 'asc' : 'desc',
    }));
  };

  // 删除
  const handleDelete = (record: RequirementItem) => {
    Modal.confirm({
      title: t('requirements.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: (
        <>
          <div>{t('requirements.deleteModal.confirmMessage', { name: record.title })}</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {t('requirements.deleteModal.warning')}
          </div>
        </>
      ),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          await deleteRequirement(record.id);
          loadData();
          Toast.success(t('requirements.deleteModal.success'));
        } catch {
          Toast.error(t('requirements.deleteModal.error'));
        }
      },
    });
  };

  // 重新提交（REJECTED / WITHDRAWN）—— 文案与目标状态由当前模版标志驱动
  // 重新提交（REJECTED/WITHDRAWN + 提交人）
  const [resubmitTarget, setResubmitTarget] = useState<RequirementItem | null>(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const handleResubmit = (record: RequirementItem) => {
    setResubmitTarget(record);
  };
  const handleResubmitConfirm = async (changeReason: string) => {
    if (!resubmitTarget) return;
    setResubmitLoading(true);
    try {
      await resubmitRequirement(resubmitTarget.id, changeReason);
      Toast.success(hasApproval ? '已重新提交，进入新一轮审批' : '已重新提交');
      setResubmitTarget(null);
      loadData();
    } catch (err) {
      Toast.error((err as Error).message);
    } finally {
      setResubmitLoading(false);
    }
  };

  // 撤回（PENDING_APPROVAL + 提交人）
  const handleWithdraw = (record: RequirementItem) => {
    Modal.confirm({
      title: t('requirements.detail.withdrawConfirmTitle'),
      content: t('requirements.detail.withdrawConfirmContent'),
      okText: t('requirements.detail.withdraw'),
      okButtonProps: { type: 'danger' },
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await withdrawRequirement(record.id);
          loadData();
          Toast.success(t('requirements.detail.withdrawSuccess'));
        } catch (err) {
          Toast.error((err as Error).message);
        }
      },
    });
  };

  // 取消（PENDING_PROJECT）—— 没有 CANCELED 状态，统一回到 WITHDRAWN
  const handleCancel = (record: RequirementItem) => {
    Modal.confirm({
      title: '取消该需求？',
      content: `取消后需求「${record.title}」将回到"已撤销"状态，可在已撤销列表中重新提交。`,
      okText: '确认取消',
      okButtonProps: { type: 'danger' },
      cancelText: '保留',
      onOk: async () => {
        await updateRequirementStatus(record.id, 'WITHDRAWN', 'Cancelled by owner.');
        loadData();
        Toast.success('已取消需求');
      },
    });
  };

  // 人工下线（LAUNCHED）
  const handleOffline = (record: RequirementItem) => {
    Modal.confirm({
      title: '将需求下线？',
      content: `下线后需求「${record.title}」将进入"已下线"状态，关联流程的执行不受影响。`,
      okText: '确认下线',
      okButtonProps: { type: 'danger' },
      cancelText: t('common.cancel'),
      onOk: async () => {
        await updateRequirementStatus(record.id, 'OFFLINE', 'Manually taken offline.');
        loadData();
        Toast.success('需求已下线');
      },
    });
  };

  // 重新上线（OFFLINE）
  const handleRelaunch = (record: RequirementItem) => {
    Modal.confirm({
      title: '重新上线该需求？',
      content: `需求「${record.title}」将恢复为"已上线"状态。`,
      okText: '确认上线',
      cancelText: t('common.cancel'),
      onOk: async () => {
        await updateRequirementStatus(record.id, 'LAUNCHED', 'Relaunched by owner.');
        loadData();
        Toast.success('需求已重新上线');
      },
    });
  };

  // 创建流程（PENDING_PROJECT / DEVELOPING）—— 跳转到开发中心流程创建入口
  const handleCreateProcess = (record: RequirementItem) => {
    navigate('/process-development', {
      state: { openCreate: true, prefilledRequirementId: record.id, prefilledRequirementTitle: record.title },
    });
  };

  // 分页信息
  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  // 兼容旧状态 → 新 9 状态映射
  const normalizeStatus = (s: string): RequirementStatus =>
    (statusConfigV2[s as RequirementStatus] ? (s as RequirementStatus) : legacyStatusMap[s]) || 'DRAFT';

  // 表格列（参考 PingCode：编号/标题左固定，操作右固定）
  const columns = [
    {
      title: t('requirements.fields.reqNo', '编号'),
      dataIndex: 'req_no',
      key: 'req_no',
      width: 130,
      fixed: 'left' as const,
      render: (v: string | undefined, r: RequirementItem) => (
        <Text type="tertiary" size="small" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {v || `REQ-${r.id.slice(0, 8)}`}
        </Text>
      ),
    },
    {
      title: t('requirements.fields.title'),
      dataIndex: 'title',
      key: 'title',
      width: 280,
      fixed: 'left' as const,
      ellipsis: true,
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('title') }),
      render: (_: string, record: RequirementItem) => <TitleCell record={record} />,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusDot status={normalizeStatus(status)} />,
    },
    {
      title: t('common.owningDepartment'),
      dataIndex: 'owning_department_name',
      key: 'owning_department_name',
      width: 140,
      ellipsis: { showTitle: false },
      render: (v: string) => (
        <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 120 }}>
          {v || '-'}
        </Text>
      ),
    },
    {
      title: t('common.owner', t('common.creator') as string),
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 140,
      ellipsis: true,
      render: (_: string, record: RequirementItem) => (
        <UserNameWithCard
          name={record.owner_name || record.creatorName}
          userId={record.owner_id || record.creatorId}
          department={record.creatorDepartment}
          role={record.creatorRole}
          email={record.creatorEmail}
        />
      ),
    },
    {
      title: t('common.createTime', '创建时间'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: true,
      onHeaderCell: () => ({ onClick: () => handleSort('created_at') }),
      render: (value: string | null) => value ? <span>{value.replace('T', ' ').substring(0, 16)}</span> : <span>--</span>,
    },
    ...(optionalColumns.includes('effort_estimate')
      ? [{
          title: t('requirements.list.columns.effortEstimate'),
          dataIndex: '_effort_estimate',
          key: '_effort_estimate',
          width: 130,
          align: 'right' as const,
          render: (_: unknown, record: RequirementItem) => {
            const s = getRequirementEffortSummary(record);
            return s.total_process_count === 0 ? (
              <Text type="tertiary">-</Text>
            ) : (
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {s.effort_estimate_total.toFixed(1).replace(/\.0$/, '')} {t('requirements.detail.effort.unit')}
              </span>
            );
          },
        }]
      : []),
    ...(optionalColumns.includes('effort_actual')
      ? [{
          title: t('requirements.list.columns.effortActual'),
          dataIndex: '_effort_actual',
          key: '_effort_actual',
          width: 130,
          align: 'right' as const,
          render: (_: unknown, record: RequirementItem) => {
            const s = getRequirementEffortSummary(record);
            if (s.total_process_count === 0) return <Text type="tertiary">-</Text>;
            const over = s.effort_actual_total > s.effort_estimate_total && s.effort_estimate_total > 0;
            return (
              <span style={{ fontVariantNumeric: 'tabular-nums', color: over ? 'var(--semi-color-danger)' : undefined }}>
                {s.effort_actual_total.toFixed(1).replace(/\.0$/, '')} {t('requirements.detail.effort.unit')}
              </span>
            );
          },
        }]
      : []),
    ...(optionalColumns.includes('completion_rate')
      ? [{
          title: t('requirements.list.columns.completionRate'),
          dataIndex: '_completion_rate',
          key: '_completion_rate',
          width: 130,
          align: 'right' as const,
          render: (_: unknown, record: RequirementItem) => {
            const s = getRequirementEffortSummary(record);
            if (s.total_process_count === 0) return <Text type="tertiary">-</Text>;
            return (
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(s.completion_rate * 100)}%
              </span>
            );
          },
        }]
      : []),
    {
      title: t('common.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 60,
      fixed: 'right' as const,
      render: (_: unknown, record: RequirementItem) => {
        const status = normalizeStatus(record.status);
        const cfg = statusConfigV2[status];
        const isCreator = record.creatorId === MOCK_CURRENT_USER_ID;
        const actions = cfg?.actions ?? [];

        // 按矩阵筛选可见操作（部分操作叠加"提交人"权限）
        const visible = actions.filter((a) => {
          if (a === 'submit' || a === 'withdraw' || a === 'resubmit') return isCreator;
          // edit / delete / cancel / createProcess / offline / relaunch：
          // 矩阵未对身份做进一步限制，沿用现状（后续可叠加 owner / dept manager 校验）
          return true;
        });

        if (visible.length === 0) {
          return <span style={{ color: 'var(--semi-color-text-2)' }}>-</span>;
        }

        const submitLabel = t('requirements.detail.submitForApproval');

        const items: Record<typeof visible[number], React.ReactNode> = {
          edit: (
            <Dropdown.Item
              key="edit"
              icon={<Pencil size={16} strokeWidth={2} />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                navigate(`/requirements/list/edit/${record.id}`);
              }}
            >
              {isBusinessOnlyEdit(status) ? '编辑（业务字段）' : t('common.edit')}
            </Dropdown.Item>
          ),
          submit: (
            <Dropdown.Item
              key="submit"
              icon={<Send size={16} strokeWidth={2} />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                Modal.confirm({
                  title: hasApproval
                    ? t('requirements.detail.submitConfirmTitle')
                    : t('requirements.detail.submitDirectConfirmTitle'),
                  content: buildSubmitConfirmContent(record.title, t),
                  okText: t('common.confirm'),
                  cancelText: t('common.cancel'),
                  onOk: async () => {
                    await updateRequirementStatus(record.id, submittedStatus, 'Submitted.');
                    loadData();
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
            </Dropdown.Item>
          ),
          withdraw: (
            <Dropdown.Item
              key="withdraw"
              icon={<Undo2 size={16} strokeWidth={2} />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleWithdraw(record);
              }}
            >
              {t('requirements.detail.withdraw')}
            </Dropdown.Item>
          ),
          resubmit: (
            <Dropdown.Item
              key="resubmit"
              icon={<Send size={16} strokeWidth={2} />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleResubmit(record);
              }}
            >
              {t('requirements.detail.resubmit', '重新提交')}
            </Dropdown.Item>
          ),
          createProcess: (
            <Dropdown.Item
              key="createProcess"
              icon={<GitBranchPlus size={16} strokeWidth={2} />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleCreateProcess(record);
              }}
            >
              创建流程
            </Dropdown.Item>
          ),
          cancel: (
            <Dropdown.Item
              key="cancel"
              icon={<Ban size={16} strokeWidth={2} />}
              type="danger"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleCancel(record);
              }}
            >
              取消需求
            </Dropdown.Item>
          ),
          offline: (
            <Dropdown.Item
              key="offline"
              icon={<PowerOff size={16} strokeWidth={2} />}
              type="danger"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleOffline(record);
              }}
            >
              人工下线
            </Dropdown.Item>
          ),
          relaunch: (
            <Dropdown.Item
              key="relaunch"
              icon={<RotateCcw size={16} strokeWidth={2} />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleRelaunch(record);
              }}
            >
              重新上线
            </Dropdown.Item>
          ),
          delete: (
            <Dropdown.Item
              key="delete"
              icon={<Trash2 size={16} strokeWidth={2} />}
              type="danger"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleDelete(record);
              }}
            >
              {t('common.delete')}
            </Dropdown.Item>
          ),
        } as const;

        return (
          <Dropdown
            trigger="click"
            position="bottomRight"
            clickToHide
            render={<Dropdown.Menu>{visible.map((k) => items[k])}</Dropdown.Menu>}
          >
            <Button icon={<Ellipsis size={16} strokeWidth={2} />} theme="borderless" onClick={(e) => e.stopPropagation()} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="requirements-workbench">
      {/* 标题区域 */}
      <div className="requirements-workbench-header">
        <div className="requirements-workbench-header-title">
          <Title heading={3} className="title">
            {t('requirements.workbench.title')}
          </Title>
          <Text type="tertiary">{t('requirements.workbench.description')}</Text>
        </div>

        {/* 操作栏 */}
        <Row
          type="flex"
          justify="space-between"
          align="middle"
          className="requirements-workbench-header-toolbar"
        >
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('requirements.workbench.searchPlaceholder')}
                className="requirements-workbench-search-input"
                value={searchValue}
                onChange={handleSearch}
                showClear
                maxLength={100}
              />
              <DepartmentSearchSelect
                placeholder={t('common.filterDepartment')}
                value={departmentFilter}
                  includeChildren={includeSubDepts}
                  onIncludeChildrenChange={setIncludeSubDepts}
                onChange={(v) => {
                  setDepartmentFilter(v);
                  setQueryParams((prev) => ({ ...prev, offset: 0 }));
                }}
                multiple
                showClear
                maxTagCount={1}
                useNameAsValue
                style={{ width: 'auto', minWidth: 150, maxWidth: 600 }}
              />
              <FilterPopover
                visible={statusFilterVisible}
                onVisibleChange={setStatusFilterVisible}
                sections={[
                  {
                    key: 'status',
                    label: t('common.status'),
                    type: 'checkbox',
                    options: statusOptionsV2.map((s) => ({
                      label: t(s.i18nKey),
                      value: s.value,
                    })),
                    value: statusFilter,
                  },
                ]}
                onConfirm={(values) => {
                  setStatusFilter((values.status as RequirementStatus[]) || []);
                  setQueryParams((prev) => ({ ...prev, offset: 0 }));
                }}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Dropdown
                trigger="click"
                position="bottomRight"
                clickToHide={false}
                 render={
                   <div className="column-settings-dropdown">
                     <div className="column-settings-dropdown-title">
                       {t('requirements.list.columns.optionalLabel')}
                     </div>
                     {(['effort_estimate', 'effort_actual', 'completion_rate'] as const).map((k) => (
                       <div
                         key={k}
                         className="column-settings-dropdown-item"
                         onClick={(e) => { e.stopPropagation(); toggleOptionalColumn(k); }}
                       >
                         <Checkbox
                           checked={optionalColumns.includes(k)}
                           onChange={() => { /* parent handles toggle */ }}
                         >
                           {t(`requirements.list.columns.${k === 'effort_estimate' ? 'effortEstimate' : k === 'effort_actual' ? 'effortActual' : 'completionRate'}`)}
                         </Checkbox>
                       </div>
                     ))}
                   </div>
                 }
               >
                 <Button
                   icon={<Columns3 size={16} strokeWidth={2} />}
                   theme="borderless"
                   type="tertiary"
                 />
               </Dropdown>
              <Button icon={<Plus size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={() => navigate('/requirements/list/create')}>
                {t('requirements.workbench.newRequirement')}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 内容区域 */}
      <div className="requirements-workbench-table">
        {isInitialLoad ? (
          <TableSkeleton
            rows={10}
            columns={7}
            columnWidths={['22%', '10%', '10%', '8%', '12%', '12%', '14%']}
          />
        ) : (
          <Table
            size="small"
            columns={columns}
            dataSource={list}
            loading={loading}
            rowKey="id"
            empty={
              <EmptyState
                variant={queryParams.keyword ? 'noResult' : 'noData'}
                description={
                  queryParams.keyword
                    ? t('common.noResult')
                    : t('requirements.workbench.noData')
                }
              />
            }
            onRow={(record) => {
              const isSelected = selectedRecord?.id === record?.id && detailDrawerVisible;
              return {
                id: `requirement-row-${record?.id}`,
                style: { cursor: 'pointer' },
                className: isSelected ? 'requirements-workbench-row-selected' : undefined,
                onClick: () => {
                  if (record) {
                    setSelectedRecord(record as RequirementItem);
                    if (!detailDrawerVisible) setDetailDrawerVisible(true);
                  }
                },
              };
            }}
            pagination={{
              total,
              pageSize,
              currentPage,
              onPageChange: (page) => {
                setQueryParams((prev) => ({ ...prev, offset: (page - 1) * pageSize }));
              },
              onPageSizeChange: (newPageSize) =>
                setQueryParams((prev) => ({ ...prev, offset: 0, size: newPageSize })),
              showSizeChanger: true,
              showTotal: true,
            }}
            scroll={{ y: 'calc(100vh - 320px)', x: 1310 }}
          />
        )}
      </div>

      {/* 新建/编辑需求均使用独立页面 /requirements/list/create | /requirements/list/edit/:id */}
      {/* 需求详情抽屉 */}
      <RequirementDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => { setDetailDrawerVisible(false); setInitialDrawerTab(undefined); }}
        data={selectedRecord}
        dataList={list}
        initialTab={initialDrawerTab}
        onNavigate={(item) => setSelectedRecord(item)}
        onEdit={(record) => {
          setDetailDrawerVisible(false);
          navigate(`/requirements/list/edit/${record.id}`);
        }}
        onDelete={(record) => handleDelete(record)}
        onResubmit={(record) => handleResubmit(record)}
        onCreateProcess={(record) => handleCreateProcess(record)}
        onCancel={(record) => handleCancel(record)}
        onOffline={(record) => handleOffline(record)}
        onRelaunch={(record) => handleRelaunch(record)}
        
        onStatusChange={async (id, newStatus, comment) => {
          await updateRequirementStatus(id, newStatus, comment);
          loadData();
          // Refresh the selected record
          const updated = (await fetchRequirementList({ ...queryParams, departmentFilter: effectiveDepartmentFilter })).list.find(r => r.id === id);
          if (updated) setSelectedRecord(updated);
        }}
        onRefresh={async () => {
          loadData();
          if (selectedRecord) {
            const updated = (await fetchRequirementList({ ...queryParams, departmentFilter: effectiveDepartmentFilter })).list.find(r => r.id === selectedRecord.id);
            if (updated) setSelectedRecord(updated);
          }
        }}
        pagination={{
          currentPage,
          totalPages: Math.ceil(total / pageSize),
          pageSize,
          total,
        }}
        onScrollToRow={(id) => {
          const row = document.getElementById(`requirement-row-${id}`);
          row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }}
      />

      {/* v1.0 已取消项目/工作空间概念，原"关联到已有工作空间" Modal 已下线 */}
      <ResubmitDialog
        visible={!!resubmitTarget}
        requirementTitle={resubmitTarget?.title}
        needsApproval={hasApproval}
        loading={resubmitLoading}
        onCancel={() => setResubmitTarget(null)}
        onConfirm={handleResubmitConfirm}
      />
    </div>
  );
};

export default RequirementsWorkbench;
