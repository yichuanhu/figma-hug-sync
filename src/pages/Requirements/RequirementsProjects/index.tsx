import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Input,
  Select,
  Table,
  Tag,
  Modal,
  Toast,
} from '@douyinfe/semi-ui';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
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
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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
    if (statusFilter !== 'ALL') {
      list = list.filter((p) => p.aggregatedStatus === statusFilter);
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

  const columns = [
    {
      title: t('requirements.projects.fields.name'),
      dataIndex: 'name',
      width: 240,
      render: (v: string, record: Project) => (
        <Text
          link
          ellipsis={{ showTooltip: true }}
          style={{ maxWidth: 220, cursor: 'pointer' }}
          onClick={() => {
            setSelectedId(record.id);
            setDrawerVisible(true);
          }}
        >
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
      width: 110,
    },
    {
      title: t('requirements.projects.fields.requirementCount'),
      dataIndex: 'requirementCount',
      width: 110,
    },
    {
      title: t('common.createTime'),
      dataIndex: 'createdAt',
      width: 170,
      render: (v: string) => v.replace('T', ' ').substring(0, 19),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 180,
      render: (_: unknown, r: Project) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            size="small"
            theme="borderless"
            icon={<Eye size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(r.id);
              setDrawerVisible(true);
            }}
          />
          <Button
            size="small"
            theme="borderless"
            icon={<Pencil size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              setEditing(r);
              setFormVisible(true);
            }}
          />
          <Button
            size="small"
            theme="borderless"
            type="danger"
            icon={<Trash2 size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(r);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="requirements-projects">
      <div className="requirements-projects-header">
        <div>
          <Title heading={3} className="title">
            {t('requirements.projects.pageTitle')}
          </Title>
          <Text type="tertiary">{t('requirements.projects.pageSubtitle')}</Text>
        </div>
        <Button
          theme="solid"
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            setEditing(null);
            setFormVisible(true);
          }}
        >
          {t('requirements.projects.createProject')}
        </Button>
      </div>

      <div className="requirements-projects-toolbar">
        <Input
          className="requirements-projects-search"
          prefix={<Search size={14} />}
          placeholder={t('requirements.projects.searchPlaceholder')}
          value={keyword}
          onChange={setKeyword}
          showClear
        />
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as string)}
          style={{ width: 180 }}
          placeholder={t('common.status')}
        >
          <Select.Option value="ALL">{t('common.all')}</Select.Option>
          {STATUS_OPTIONS.map((s) => (
            <Select.Option key={s} value={s}>
              {t(`requirements.projects.status.${s}`)}
            </Select.Option>
          ))}
        </Select>
      </div>

      <div className="requirements-projects-content">
        <div className="requirements-projects-table-wrapper">
          {isInitial && loading ? (
            <TableSkeleton columns={columns.length} rows={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              variant={keyword || statusFilter !== 'ALL' ? 'noResult' : 'noData'}
              description={
                keyword || statusFilter !== 'ALL'
                  ? t('common.noSearchResults')
                  : t('requirements.projects.noData')
              }
            />
          ) : (
            <Table
              size="small"
              loading={loading}
              dataSource={filtered}
              columns={columns}
              rowKey="id"
              pagination={false}
            />
          )}
        </div>
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
