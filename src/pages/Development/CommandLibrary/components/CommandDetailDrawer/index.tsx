import { useState, useMemo, useEffect } from 'react';
import { Typography, Tabs, TabPane, Descriptions, Tag, Button, Table, Tooltip, Modal, Toast, Select } from '@douyinfe/semi-ui';
import { Trash2, Upload, Pencil, Download } from 'lucide-react';
import DetailDrawerWrapper, { type PaginationInfo } from '@/components/DetailDrawerWrapper';
import ExpandableText from '@/components/ExpandableText';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import EmptyState from '@/components/EmptyState';
import StatusDot from '@/components/StatusDot';
import { COMMAND_STATUS_CONFIG, type CommandItem, type CommandParam, type CommandVersion } from '@/mocks/commandLibrary';
import './index.less';

const { Text, Title } = Typography;

interface CommandDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  command: CommandItem | null;
  dataList: CommandItem[];
  onNavigate: (item: CommandItem) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onUploadVersion?: () => void;
  onDeleteVersion?: (version: CommandVersion) => void;
}

const paramColumns = [
  { title: '参数名', dataIndex: 'name', key: 'name', width: 160 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  {
    title: '必填',
    dataIndex: 'required',
    key: 'required',
    width: 80,
    render: (v: boolean) => (v ? <Tag size="small" color="red" type="light">是</Tag> : <Tag size="small" color="grey" type="light">否</Tag>),
  },
  {
    title: '默认值',
    dataIndex: 'default_value',
    key: 'default_value',
    width: 120,
    render: (v: string | null) => v || '-',
  },
  {
    title: '说明',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
    render: (v: string) => v || '-',
  },
];

const ParamTable = ({ title, data }: { title: string; data: CommandParam[] }) => (
  <div className="command-detail-drawer-card">
    <Text className="command-detail-drawer-card-title">{title}</Text>
    {data.length === 0 ? (
      <Text type="tertiary">暂无定义</Text>
    ) : (
      <Table size="small" columns={paramColumns} dataSource={data} rowKey="name" pagination={false} />
    )}
  </div>
);

const CommandDetailDrawer = ({
  visible,
  onClose,
  command,
  dataList,
  onNavigate,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  onUploadVersion,
  onDeleteVersion,
}: CommandDetailDrawerProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const sortedVersions = useMemo(() => {
    const list = [...(command?.versions || [])];
    list.sort((a, b) => {
      const va = a.version.split('.').map(Number);
      const vb = b.version.split('.').map(Number);
      for (let i = 0; i < Math.max(va.length, vb.length); i++) {
        const diff = (vb[i] || 0) - (va[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    });
    return list;
  }, [command]);

  useEffect(() => {
    setSelectedVersionId(sortedVersions[0]?.id || null);
  }, [sortedVersions]);

  useEffect(() => {
    if (visible) setActiveTab('basic');
  }, [visible, command?.id]);

  const selectedVersion = sortedVersions.find((v) => v.id === selectedVersionId) || null;

  if (!command) return null;

  const statusCfg = COMMAND_STATUS_CONFIG[command.status];

  const latestVersion = command.current_version || sortedVersions[0]?.version || '-';

  const basicData = [
    {
      key: '发布者',
      value: <UserNameWithCard name={command.publisher_name} userId={command.publisher_id} department={command.owning_department_name} />,
    },
    {
      key: '创建者',
      value: <UserNameWithCard name={command.owner_name} userId={command.owner_id} department={command.owning_department_name} />,
    },
    { key: '所属部门', value: command.owning_department_name || '-' },
    { key: '状态', value: <StatusDot color={statusCfg.color} label={statusCfg.label} /> },
    { key: '安装次数', value: command.install_count ?? 0 },
    { key: '最新版本', value: latestVersion },
    {
      key: '选择命令库版本',
      value: (
        <div className="command-detail-drawer-version-picker">
          <Select
            value={selectedVersionId || undefined}
            onChange={(v) => setSelectedVersionId(v as string)}
            placeholder="请选择版本"
            style={{ width: 180 }}
            optionList={sortedVersions.map((v) => ({ value: v.id, label: v.version }))}
            disabled={sortedVersions.length === 0}
          />
          <Button
            theme="solid"
            icon={<Download size={16} strokeWidth={2} />}
            disabled={sortedVersions.length === 0}
            onClick={() => Toast.info('原型演示，暂不支持下载')}
          >
            下载离线版本
          </Button>
        </div>
      ),
    },
    { key: '命令库介绍', value: <ExpandableText text={command.description || '-'} /> },
    { key: '更新说明', value: <ExpandableText text={selectedVersion?.version_note || '-'} /> },
    {
      key: '兼容系统',
      value: (command.compatible_systems || []).length ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {command.compatible_systems.map((s) => (
            <Tag key={s} size="small" color="blue" type="light">{s}</Tag>
          ))}
        </div>
      ) : (
        '-'
      ),
    },
  ];

  const handleDeleteVersion = (version: CommandVersion) => {
    Modal.warning({
      title: '删除版本',
      content: `确定要删除版本 ${version.version} 吗？删除后不可恢复。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { type: 'danger' },
      centered: true,
      onOk: () => {
        onDeleteVersion?.(version);
        Toast.success('版本已删除');
      },
    });
  };

  return (
    <DetailDrawerWrapper<CommandItem>
      visible={visible}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{command.name}</span>
          <Tag size="small" color={statusCfg.color === 'grey' ? 'grey' : statusCfg.color} type="light">
            {statusCfg.label}
          </Tag>
        </div>
      }
      dataList={dataList}
      currentId={command.id}
      onNavigate={onNavigate}
      pagination={pagination}
      onPageChange={onPageChange}
      extraActions={
        onEdit ? (
          <Tooltip content="编辑">
            <Button icon={<Pencil size={16} strokeWidth={2} />} theme="borderless" type="tertiary" onClick={onEdit} />
          </Tooltip>
        ) : undefined
      }
      deleteAction={
        onDelete ? (
          <Tooltip content="删除">
            <Button
              icon={<Trash2 size={16} strokeWidth={2} />}
              theme="borderless"
              type="tertiary"
              onClick={onDelete}
            />
          </Tooltip>
        ) : undefined
      }
      defaultWidth={900}
      minWidth={576}
      storageKey="commandDetailDrawerWidth"
      className="command-detail-drawer"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="command-detail-drawer-tabs">
        <TabPane tab="基本信息" itemKey="basic">
          <div className="command-detail-drawer-tab-content">
            <div className="command-detail-drawer-card">
              <div className="command-detail-drawer-hero">
                <div className="command-detail-drawer-hero-icon">{command.name.slice(0, 1)}</div>
                <div className="command-detail-drawer-hero-name">{command.name}</div>
              </div>
              <Descriptions data={basicData} align="left" />
            </div>
            <div className="command-detail-drawer-card">
              <Text className="command-detail-drawer-card-title">包含命令</Text>
              {(command.commands || []).length === 0 ? (
                <Text type="tertiary">暂无命令</Text>
              ) : (
                <Table
                  size="small"
                  rowKey="name"
                  pagination={false}
                  dataSource={command.commands}
                  columns={[
                    {
                      title: '命令名称',
                      dataIndex: 'name',
                      key: 'name',
                      width: 240,
                      ellipsis: { showTitle: false },
                      render: (v: string) => <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 220 }}>{v}</Text>,
                    },
                    {
                      title: '使用说明',
                      dataIndex: 'usage',
                      key: 'usage',
                      ellipsis: { showTitle: false },
                      render: (v: string) => <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 380 }}>{v || '-'}</Text>,
                    },
                  ]}
                  expandedRowRender={(record) => (
                    <div className="command-detail-drawer-entry-params">
                      <ParamTable title="入参定义" data={record?.inputs || []} />
                      <ParamTable title="出参定义" data={record?.outputs || []} />
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </TabPane>

        <TabPane tab="版本" itemKey="versions">
          {sortedVersions.length === 0 ? (
            <div className="command-detail-drawer-version-empty">
              <EmptyState description="暂无版本" size={120} />
              <Button icon={<Upload size={16} strokeWidth={2} />} theme="solid" onClick={onUploadVersion}>
                上传版本
              </Button>
            </div>
          ) : (
            <div className="command-detail-drawer-version-layout">
              <div className="command-detail-drawer-version-sidebar">
                <div className="command-detail-drawer-version-sidebar-header">
                  <Text className="command-detail-drawer-card-title" style={{ marginBottom: 0 }}>版本列表</Text>
                </div>
                <Button
                  icon={<Upload size={16} strokeWidth={2} />}
                  theme="solid"
                  className="command-detail-drawer-version-sidebar-upload-btn"
                  onClick={onUploadVersion}
                >
                  上传版本
                </Button>
                <div className="command-detail-drawer-version-sidebar-list">
                  {sortedVersions.map((version) => (
                    <div
                      key={version.id}
                      className={`command-detail-drawer-version-sidebar-item ${
                        selectedVersionId === version.id ? 'command-detail-drawer-version-sidebar-item--selected' : ''
                      }`}
                      onClick={() => setSelectedVersionId(version.id)}
                    >
                      <Text>{version.version}</Text>
                      <Tag size="small" color={version.is_active ? 'green' : 'grey'} type="light">
                        {version.is_active ? '已发布' : '未发布'}
                      </Tag>
                    </div>
                  ))}
                </div>
              </div>

              <div className="command-detail-drawer-version-detail">
                {selectedVersion && (
                  <>
                    <div className="command-detail-drawer-card">
                      <Text className="command-detail-drawer-card-title">版本信息</Text>
                      <Descriptions
                        align="left"
                        data={[
                          { key: '版本号', value: selectedVersion.version },
                          {
                            key: '状态',
                            value: (
                              <StatusDot
                                color={selectedVersion.is_active ? 'green' : 'grey'}
                                label={selectedVersion.is_active ? '已发布' : '未发布'}
                              />
                            ),
                          },
                          { key: '上传人', value: selectedVersion.uploader_name },
                          { key: '上传时间', value: selectedVersion.created_at },
                          { key: '发布时间', value: selectedVersion.publish_time || '-' },
                          { key: '包文件', value: `${selectedVersion.file_name}（${selectedVersion.file_size}）` },
                          { key: '版本说明', value: <ExpandableText text={selectedVersion.version_note || '-'} /> },
                        ]}
                      />
                      {selectedVersion.is_active ? (
                        <Tooltip content="已发布版本不可删除">
                          <Button
                            icon={<Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />}
                            type="tertiary"
                            disabled
                            style={{ marginTop: 12 }}
                          >
                            删除版本
                          </Button>
                        </Tooltip>
                      ) : (
                        <Button
                          icon={<Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />}
                          type="tertiary"
                          style={{ marginTop: 12 }}
                          onClick={() => handleDeleteVersion(selectedVersion)}
                        >
                          删除版本
                        </Button>
                      )}
                    </div>
                    <ParamTable title="入参定义" data={selectedVersion.inputs} />
                    <ParamTable title="出参定义" data={selectedVersion.outputs} />
                  </>
                )}
              </div>
            </div>
          )}
        </TabPane>
      </Tabs>
    </DetailDrawerWrapper>
  );
};

export default CommandDetailDrawer;
