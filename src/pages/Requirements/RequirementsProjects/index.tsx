import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Input,
  Table,
  Tag,
  Modal,
  Toast,
  Row,
  Col,
  Space,
  Dropdown,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import { Tooltip } from '@douyinfe/semi-ui';
import { Plus, Pencil, Trash2, Ellipsis } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import type { Project, ProjectAggregatedStatus } from './types';
import { fetchProjects, deleteProject } from './mockData';
import ProjectFormModal from './components/ProjectFormModal';
import ProjectDetailDrawer from './components/ProjectDetailDrawer';
import './index.less';

const { Title, Text } = Typography;

const statusTagColor: Record<ProjectAggregatedStatus, TagColor> = {
  EMPTY: 'grey',
  IN_PROGRESS: 'blue',
  DEVELOPING: 'orange',
  COMPLETED: 'green',
};

const STATUS_OPTIONS: ProjectAggregatedStatus[] = ['EMPTY', 'IN_PROGRESS', 'DEVELOPING', 'COMPLETED'];

const RequirementsProjects = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [isInitial, setIsInitial] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } finally {
      setLoading(false);
      setIsInitial(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    let list = projects;
    if (statusFilter.length > 0) {
      list = list.filter((p) => statusFilter.includes(p.aggregatedStatus));
    }
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(k) ||
          (p.description ?? '').toLowerCase().includes(k),
      );
    }
    return list;
  }, [projects, keyword, statusFilter]);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId],
  );

  const handleDelete = (p: Project) => {
    Modal.confirm({
      title: t('requirements.projects.deleteProject'),
      content: t('requirements.projects.deleteProjectConfirm', { name: p.name }),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          await deleteProject(p.id);
          Toast.success(t('common.deleteSuccess'));
          reload();
        } catch (err) {
          if ((err as Error).message === 'PROJECT_HAS_WORKSPACES') {
            Toast.error(t('requirements.projects.validation.projectHasWorkspaces'));
          } else {
            Toast.error(t('common.operationFailed'));
          }
        }
      },
    });
  };

  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((s) => ({
        label: t(`requirements.projects.status.${s}`),
        value: s,
      })),
    [t],
  );

  const columns = [
    {
      title: t('requirements.projects.fields.name'),
      dataIndex: 'name',
      key: 'name',
      width: 240,
      ellipsis: true,
      render: (v: string) => (
        <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 220 }}>
          {v}
        </Text>
      ),
    },
    {
      title: t('requirements.projects.fields.dateRange'),
      key: 'dateRange',
      width: 220,
      render: (_: unknown, r: Project) =>
        r.startDate && r.endDate ? `${r.startDate} ~ ${r.endDate}` : '-',
    },
    {
      title: t('common.status'),
      dataIndex: 'aggregatedStatus',
      key: 'status',
      width: 110,
      render: (s: ProjectAggregatedStatus) => (
        <Tag color={statusTagColor[s]} type="light">
          {t(`requirements.projects.status.${s}`)}
        </Tag>
      ),
    },
    {
      title: t('requirements.projects.fields.workspaceCount'),
      dataIndex: 'workspaceCount',
      key: 'workspaceCount',
      width: 110,
    },
    {
      title: t('requirements.projects.fields.requirementCount'),
      dataIndex: 'requirementCount',
      key: 'requirementCount',
      width: 110,
    },
    {
      title: t('common.createTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => v.replace('T', ' ').substring(0, 19),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 60,
      render: (_: unknown, r: Project) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          stopPropagation
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                icon={<Pencil size={16} strokeWidth={2} />}
                onClick={() => {
                  setEditing(r);
                  setFormVisible(true);
                }}
              >
                {t('common.edit')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<Trash2 size={16} strokeWidth={2} />}
                type="danger"
                onClick={() => handleDelete(r)}
              >
                {t('common.delete')}
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

  return (
    <div className="requirements-projects">
      <div className="requirements-projects-header">
        <div className="requirements-projects-header-title">
          <Title heading={3} className="title">
            {t('requirements.projects.pageTitle')}
          </Title>
          <Text type="tertiary">{t('requirements.projects.pageSubtitle')}</Text>
        </div>
        <Row
          type="flex"
          justify="space-between"
          align="middle"
          className="requirements-projects-header-toolbar"
        >
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('requirements.projects.searchPlaceholder')}
                className="requirements-projects-search-input"
                value={keyword}
                onChange={setKeyword}
                showClear
                maxLength={100}
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
                    options: statusOptions,
                    value: statusFilter,
                  },
                ]}
              />
            </Space>
          </Col>
          <Col>
            <Button
              theme="solid"
              type="primary"
              icon={<Plus size={16} strokeWidth={2} />}
              onClick={() => {
                setEditing(null);
                setFormVisible(true);
              }}
            >
              {t('requirements.projects.createProject')}
            </Button>
          </Col>
        </Row>
      </div>

      <div className="requirements-projects-table">
        {isInitial && loading ? (
          <TableSkeleton
            rows={8}
            columns={columns.length}
            columnWidths={['22%', '20%', '10%', '10%', '10%', '15%', '13%']}
          />
        ) : (
          <Table
            size="small"
            loading={loading}
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            empty={
              <EmptyState
                variant={keyword || statusFilter.length > 0 ? 'noResult' : 'noData'}
                description={
                  keyword || statusFilter.length > 0
                    ? t('common.noSearchResults')
                    : t('requirements.projects.noData')
                }
              />
            }
            onRow={(record) => ({
              style: { cursor: 'pointer' },
              className:
                selectedId === record?.id && drawerVisible
                  ? 'requirements-projects-row-selected'
                  : undefined,
              onClick: () => {
                if (record) {
                  setSelectedId(record.id);
                  if (!drawerVisible) setDrawerVisible(true);
                }
              },
            })}
            pagination={false}
            scroll={{ y: 'calc(100vh - 320px)' }}
          />
        )}
      </div>

      <ProjectFormModal
        visible={formVisible}
        initialData={editing}
        onClose={() => setFormVisible(false)}
        onSuccess={reload}
      />

      <ProjectDetailDrawer
        visible={drawerVisible}
        data={selected}
        dataList={filtered}
        pagination={{
          currentPage: selected ? filtered.findIndex((p) => p.id === selected.id) + 1 : 1,
          totalPages: filtered.length,
          pageSize: 1,
          total: filtered.length,
        }}
        onClose={() => setDrawerVisible(false)}
        onNavigate={(p) => setSelectedId(p.id)}
        onEdit={(p) => {
          setEditing(p);
          setFormVisible(true);
        }}
        onDelete={(p) => {
          setDrawerVisible(false);
          handleDelete(p);
        }}
        onRefresh={reload}
      />
    </div>
  );
};

export default RequirementsProjects;
