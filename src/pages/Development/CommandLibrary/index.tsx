import { useState, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { Typography, Input, Button, Table, Dropdown, Pagination, Modal, Toast } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Ellipsis, Pencil, Plus, Trash2, Users } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import FilterPopover from '@/components/FilterPopover';
import DepartmentSearchSelect from '@/components/DepartmentSearchSelect';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import StatusDot from '@/components/StatusDot';
import { useCollaboratorAction } from '@/hooks/useCollaboratorAction';
import CommandDetailDrawer from './components/CommandDetailDrawer';
import CommandFormModal, { type CommandFormValues } from './components/CommandFormModal';
import ImportCommandModal, { type ImportCommandPayload } from './components/ImportCommandModal';
import UploadCommandVersionModal from './components/UploadCommandVersionModal';
import {
  mockCommandList,
  COMMAND_STATUS_CONFIG,
  COMMAND_PLATFORM_OPTIONS,
  COMMAND_OWNER_POOL,
  type CommandItem,
  type CommandStatus,
  type CommandVersion,
} from '@/mocks/commandLibrary';
import { departmentTree, type DeptTreeNode } from '@/mocks/departmentData';
import './index.less';

const { Title, Text } = Typography;

const flattenDepts = (nodes: DeptTreeNode[], acc: Record<string, string> = {}): Record<string, string> => {
  nodes.forEach((node) => {
    acc[node.value] = node.label;
    if (node.children?.length) flattenDepts(node.children, acc);
  });
  return acc;
};

const CommandLibrary = () => {
  const [commands, setCommands] = useState<CommandItem[]>(() => mockCommandList.map((c) => ({ ...c })));
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [detailVisible, setDetailVisible] = useState(false);
  const [selected, setSelected] = useState<CommandItem | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<CommandItem | null>(null);
  const [uploadTarget, setUploadTarget] = useState<CommandItem | null>(null);

  const { openCollaborator, renderCollaboratorPanel } = useCollaboratorAction();

  const deptNameMap = useMemo(() => flattenDepts(departmentTree), []);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setKeyword(value);
        setCurrentPage(1);
      }, 500),
    [],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return commands.filter((item) => {
      if (kw && !item.name.toLowerCase().includes(kw) && !(item.description || '').toLowerCase().includes(kw)) return false;
      if (departmentFilter.length > 0 && !departmentFilter.includes(item.owning_department_name)) return false;
      if (statusFilter.length > 0 && !statusFilter.includes(item.status)) return false;
      if (platformFilter.length > 0 && !item.platforms.some((p) => platformFilter.includes(p))) return false;
      if (ownerFilter.length > 0 && !ownerFilter.includes(item.owner_id)) return false;
      return true;
    });
  }, [commands, keyword, departmentFilter, statusFilter, platformFilter, ownerFilter]);

  const total = filtered.length;
  const pageData = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  const hasFilter =
    !!keyword || departmentFilter.length > 0 || statusFilter.length > 0 || platformFilter.length > 0 || ownerFilter.length > 0;

  const openDetail = (record: CommandItem) => {
    setSelected(record);
    setDetailVisible(true);
  };

  const handleDelete = useCallback((record: CommandItem) => {
    Modal.warning({
      title: '删除命令',
      content: `确定要删除命令「${record.name}」吗？删除后不可恢复。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { type: 'danger' },
      centered: true,
      onOk: () => {
        setCommands((prev) => prev.filter((c) => c.id !== record.id));
        setDetailVisible(false);
        setSelected(null);
        Toast.success('命令已删除');
      },
    });
  }, []);

  const handleSubmitForm = (values: CommandFormValues) => {
    const deptName = deptNameMap[values.owning_department_id] || values.owning_department_id;
    const owner = COMMAND_OWNER_POOL.find((o) => o.id === values.owner_id);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (editing) {
      const updated: CommandItem = {
        ...editing,
        name: values.name,
        description: values.description || '',
        platforms: values.platforms,
        owning_department_id: values.owning_department_id,
        owning_department_name: deptName,
        owner_id: values.owner_id || editing.owner_id,
        owner_name: owner?.name || values.owner_id || editing.owner_name,
        updated_at: now,
      };
      setCommands((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelected((prev) => (prev?.id === updated.id ? updated : prev));
    } else {
      const created: CommandItem = {
        id: `command-${Date.now()}`,
        name: values.name,
        description: values.description || '',
        status: 'NOT_SHARED',
        platforms: values.platforms,
        compatible_systems: ['Windows x64', 'Windows x86'],
        install_count: 0,
        current_version: null,
        owning_department_id: values.owning_department_id,
        owning_department_name: deptName,
        owner_id: values.owner_id || 'user-001',
        owner_name: owner?.name || '张伟',
        publisher_id: values.owner_id || 'user-001',
        publisher_name: owner?.name || '张伟',
        created_at: now,
        updated_at: now,
        publish_time: null,
        commands: [],
        versions: [],
      };
      setCommands((prev) => [created, ...prev]);
      setSelected(created);
      setDetailVisible(true);
      setCurrentPage(1);
    }
  };

  const handleUploadSuccess = (payload: { version: string; note: string; fileName: string; fileSize: string }) => {
    if (!uploadTarget) return;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newVersion: CommandVersion = {
      id: `${uploadTarget.id}-v${Date.now()}`,
      command_id: uploadTarget.id,
      version: payload.version,
      is_active: false,
      version_note: payload.note,
      file_name: payload.fileName,
      file_size: payload.fileSize,
      source_file_name: payload.fileName.replace(/\.[^.]+$/, '') + '_source.zip',
      source_file_size: payload.fileSize,
      uploader_id: uploadTarget.owner_id,
      uploader_name: uploadTarget.owner_name,
      created_at: now,
      publish_time: null,
      commands: [],
    };
    setCommands((prev) =>
      prev.map((c) => (c.id === uploadTarget.id ? { ...c, versions: [...c.versions, newVersion], updated_at: now } : c)),
    );
    setSelected((prev) => (prev?.id === uploadTarget.id ? { ...prev, versions: [...prev.versions, newVersion], updated_at: now } : prev));
    Toast.success('版本已上传');
  };

  const handleDeleteVersion = (version: CommandVersion) => {
    setCommands((prev) =>
      prev.map((c) => (c.id === version.command_id ? { ...c, versions: c.versions.filter((v) => v.id !== version.id) } : c)),
    );
    setSelected((prev) => (prev?.id === version.command_id ? { ...prev, versions: prev.versions.filter((v) => v.id !== version.id) } : prev));
  };

  const columns = [
    {
      title: '命令名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: { showTitle: false },
      render: (name: string) => <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 180 }}>{name}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CommandStatus) => (
        <StatusDot color={COMMAND_STATUS_CONFIG[status].color} label={COMMAND_STATUS_CONFIG[status].label} />
      ),
    },
    {
      title: '默认共享版本',
      dataIndex: 'current_version',
      key: 'current_version',
      width: 120,
      render: (v: string | null) => v || '-',
    },
    {
      title: '所属部门',
      dataIndex: 'owning_department_name',
      key: 'owning_department_name',
      width: 140,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '创建者',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 120,
      render: (name: string, record: CommandItem) => (
        <UserNameWithCard name={name} userId={record.owner_id} department={record.owning_department_name} />
      ),
    },
    {
      title: '命令库介绍',
      dataIndex: 'description',
      key: 'description',
      width: 260,
      ellipsis: { showTitle: false },
      render: (v: string) => <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 240 }}>{v || '-'}</Text>,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 60,
      render: (_: unknown, record: CommandItem) => (
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
                  setEditing(record);
                  setFormVisible(true);
                }}
              >
                编辑
              </Dropdown.Item>
              <Dropdown.Item icon={<Users size={16} strokeWidth={2} />} onClick={() => openCollaborator(record.id)}>
                协作者
              </Dropdown.Item>
              <Dropdown.Item icon={<Trash2 size={16} strokeWidth={2} />} type="danger" onClick={() => handleDelete(record)}>
                删除
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button icon={<Ellipsis size={16} strokeWidth={2} />} theme="borderless" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="command-library">
      <div className="command-library-header">
        <div className="command-library-header-title">
          <Title heading={3} className="title">命令库</Title>
          <Text type="tertiary">管理平台可复用的原子命令，支持版本上传与入参/出参定义查看</Text>
        </div>

        <div className="command-library-header-toolbar">
          <div className="command-library-header-toolbar-filters">
            <Input
              prefix={<IconSearchStroked />}
              placeholder="搜索命令名称或描述"
              className="command-library-search-input"
              value={searchInput}
              onChange={(v) => {
                setSearchInput(v);
                debouncedSearch(v);
              }}
              showClear
              maxLength={100}
            />
            <DepartmentSearchSelect
              multiple
              useNameAsValue
              value={departmentFilter}
              onChange={(val) => {
                setDepartmentFilter(val as string[]);
                setCurrentPage(1);
              }}
              placeholder="筛选部门"
              style={{ width: 200 }}
              maxTagCount={1}
              showClear
            />
            <span className="command-library-header-toolbar-divider" />
            <FilterPopover
              visible={filterVisible}
              onVisibleChange={setFilterVisible}
              onConfirm={(values) => {
                setStatusFilter((values.status as string[]) || []);
                setPlatformFilter((values.platform as string[]) || []);
                setOwnerFilter((values.owner as string[]) || []);
                setCurrentPage(1);
              }}
              sections={[
                {
                  key: 'status',
                  label: '状态',
                  type: 'checkbox' as const,
                  options: (Object.keys(COMMAND_STATUS_CONFIG) as CommandStatus[]).map((s) => ({
                    value: s,
                    label: COMMAND_STATUS_CONFIG[s].label,
                  })),
                  value: statusFilter,
                },
                {
                  key: 'platform',
                  label: '适用平台',
                  type: 'checkbox' as const,
                  options: COMMAND_PLATFORM_OPTIONS.map((p) => ({ value: p, label: p })),
                  value: platformFilter,
                },
                {
                  key: 'owner',
                  label: '创建者',
                  type: 'multiSelect' as const,
                  placeholder: '请选择创建者',
                  options: COMMAND_OWNER_POOL.map((o) => ({ value: o.id, label: o.name })),
                  value: ownerFilter,
                },
              ]}
            />
          </div>
          <Button
            icon={<Plus size={16} strokeWidth={2} />}
            theme="solid"
            type="primary"
            onClick={() => {
              setEditing(null);
              setFormVisible(true);
            }}
          >
            导入命令库
          </Button>
        </div>
      </div>

      <div className="command-library-table">
        <Table
          size="small"
          columns={columns}
          dataSource={pageData}
          rowKey="id"
          pagination={false}
          empty={
            <EmptyState
              variant={hasFilter ? 'noResult' : 'noData'}
              description={hasFilter ? '未找到匹配的命令' : '暂无命令'}
            />
          }
          onRow={(record) => ({
            onClick: () => record && openDetail(record as CommandItem),
            className: selected?.id === record?.id && detailVisible ? 'command-library-row-selected' : undefined,
            style: { cursor: 'pointer' },
          })}
        />
        {total > 0 && (
          <div className="list-pagination">
            <Text type="tertiary">
              {`显示第 ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, total)} 条，共 ${total} 条`}
            </Text>
            <div className="list-pagination-right">
              <Text type="tertiary">{`共 ${Math.ceil(total / pageSize)} 页`}</Text>
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                onPageChange={setCurrentPage}
                onPageSizeChange={(size: number) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        )}
      </div>

      <CommandDetailDrawer
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        command={selected}
        dataList={pageData}
        onNavigate={(item) => setSelected(item)}
        pagination={{ currentPage, totalPages: Math.ceil(total / pageSize), pageSize, total }}
        onPageChange={(page) => setCurrentPage(page)}
        onEdit={() => {
          setEditing(selected);
          setFormVisible(true);
        }}
        onDelete={() => selected && handleDelete(selected)}
        onUploadVersion={() => selected && setUploadTarget(selected)}
        onDeleteVersion={handleDeleteVersion}
      />

      <CommandFormModal
        visible={formVisible}
        command={editing}
        onCancel={() => setFormVisible(false)}
        onSubmit={handleSubmitForm}
      />

      <UploadCommandVersionModal
        visible={!!uploadTarget}
        commandName={uploadTarget?.name}
        onCancel={() => setUploadTarget(null)}
        onSuccess={handleUploadSuccess}
      />

      {renderCollaboratorPanel('COMMAND', 'development')}
    </div>
  );
};

export default CommandLibrary;
