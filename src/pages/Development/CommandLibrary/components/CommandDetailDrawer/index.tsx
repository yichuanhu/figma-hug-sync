import { useState, useMemo, useEffect } from 'react';
import {
  Typography,
  Tag,
  Button,
  Tooltip,
  Modal,
  Toast,
  Tabs,
  TabPane,
  Descriptions,
  Divider,
  Space,
  Table,
} from '@douyinfe/semi-ui';
import { Trash2, Upload, Pencil, Download, FileArchive, HelpCircle } from 'lucide-react';
import DetailDrawerWrapper, { type PaginationInfo } from '@/components/DetailDrawerWrapper';
import ExpandableText from '@/components/ExpandableText';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import DepartmentPath from '@/components/DepartmentPath';
import EmptyState from '@/components/EmptyState';
import {
  COMMAND_STATUS_CONFIG,
  type CommandEntry,
  type CommandItem,
  type CommandParam,
  type CommandVersion,
} from '@/mocks/commandLibrary';
import './index.less';

const { Title, Text } = Typography;

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

const PARAM_TYPE_LABEL: Record<CommandParam['type'], string> = {
  string: '文本',
  number: '数值',
  boolean: '布尔',
  object: '对象',
  array: '数组',
};

/** 参数卡片列表（与流程详情变量卡片风格一致） */
const ParamCardList = ({ data }: { data: CommandParam[] }) => (
  <div className="command-detail-drawer-variable-card-list">
    {data.map((param, index) => (
      <div className="command-detail-drawer-variable-card" key={`${param.name}-${index}`}>
        <div className="command-detail-drawer-variable-card-header">
          <div className="command-detail-drawer-variable-card-header-left">
            <Text strong className="command-detail-drawer-variable-card-name">
              {param.name}
            </Text>
            <Tag size="small" color="blue" type="light">
              {PARAM_TYPE_LABEL[param.type]}
            </Tag>
            {param.required && (
              <Tag size="small" color="red" type="light">
                必填
              </Tag>
            )}
          </div>
        </div>
        <div className="command-detail-drawer-variable-card-body">
          <div className="command-detail-drawer-variable-card-row">
            <Text type="tertiary" size="small" className="command-detail-drawer-variable-card-label">
              默认值
            </Text>
            <Text size="small" className="command-detail-drawer-variable-card-value">
              {param.default_value ?? '-'}
            </Text>
          </div>
          <div className="command-detail-drawer-variable-card-row">
            <Text type="tertiary" size="small" className="command-detail-drawer-variable-card-label">
              描述
            </Text>
            <Text size="small" className="command-detail-drawer-variable-card-value">
              {param.description || '-'}
            </Text>
          </div>
        </div>
      </div>
    ))}
  </div>
);

/** 命令清单表格（行展开显示该命令的入参 / 出参） */
const CommandEntryTable = ({ data }: { data: CommandEntry[] }) => (
  <Table
    size="small"
    pagination={false}
    dataSource={data.map((c, i) => ({ ...c, key: `${c.name}-${i}` }))}
    empty={<EmptyState description="暂无命令" size={100} />}
    expandedRowRender={(record) =>
      record ? (
        <div className="command-detail-drawer-command-expand">
          <div className="command-detail-drawer-command-expand-block">
            <Text type="tertiary" size="small">
              入参
            </Text>
            {record.inputs?.length ? <ParamCardList data={record.inputs} /> : <Text>-</Text>}
          </div>
          <div className="command-detail-drawer-command-expand-block">
            <Text type="tertiary" size="small">
              出参
            </Text>
            {record.outputs?.length ? <ParamCardList data={record.outputs} /> : <Text>-</Text>}
          </div>
        </div>
      ) : null
    }
    columns={[
      {
        title: '命令名称',
        dataIndex: 'name',
        width: 220,
        render: (text: string) => <Text ellipsis={{ showTooltip: true }}>{text}</Text>,
      },
      {
        title: '使用说明',
        dataIndex: 'usage',
        render: (text: string) => <Text ellipsis={{ showTooltip: true }}>{text || '-'}</Text>,
      },
    ]}
  />
);

const FileLine = ({ name, size }: { name: string; size?: string }) => (
  <div className="command-detail-drawer-file">
    <FileArchive size={16} strokeWidth={2} color="var(--semi-color-primary)" />
    <Text ellipsis={{ showTooltip: true }} className="command-detail-drawer-file-name">
      {name}
    </Text>
    {size && (
      <Text type="tertiary" size="small">
        {size}
      </Text>
    )}
    <Button
      icon={<Download size={16} strokeWidth={2} />}
      theme="borderless"
      type="tertiary"
      size="small"
      onClick={() => Toast.info('原型演示，暂不支持下载')}
    />
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

  const selectedVersion = sortedVersions.find((v) => v.id === selectedVersionId) || null;
  const latestActiveVersionId = sortedVersions.find((v) => v.is_active)?.id || null;

  if (!command) return null;

  const statusCfg = COMMAND_STATUS_CONFIG[command.status];

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

  const basicGroupData = [
    { key: '命令库名称', value: command.name },
    {
      key: '状态',
      value: (
        <Tag size="small" color={statusCfg.color} type="light">
          {statusCfg.label}
        </Tag>
      ),
    },
    { key: '所属部门', value: <DepartmentPath departmentId={command.owning_department_id} /> },
    {
      key: '创建者',
      value: (
        <UserNameWithCard
          name={command.owner_name}
          userId={command.owner_id}
          department={command.owning_department_name}
        />
      ),
    },
    {
      key: '适用平台',
      value: (command.platforms || []).length ? (
        <Space spacing={4} wrap>
          {command.platforms.map((p) => (
            <Tag key={p} size="small" color="blue" type="light">
              {p}
            </Tag>
          ))}
        </Space>
      ) : (
        '-'
      ),
    },
    {
      key: '兼容系统',
      value: (command.compatible_systems || []).length ? command.compatible_systems.join('、') : '-',
    },
    { key: '命令库介绍', value: <ExpandableText text={command.description} /> },
  ];

  const publishGroupData = [
    { key: '最新发布版本', value: command.current_version || '-' },
    { key: '发布人', value: command.publisher_name || '-' },
    { key: '安装次数', value: command.install_count ?? 0 },
    { key: '创建时间', value: command.created_at },
    { key: '更新时间', value: command.updated_at },
  ];

  const getVersionDescriptionData = (version: CommandVersion) => [
    { key: '版本号', value: version.version },
    {
      key: '状态',
      value: (
        <Tag size="small" color={version.is_active ? 'green' : 'grey'} type="light">
          {version.is_active ? '已发布' : '未发布'}
        </Tag>
      ),
    },
    {
      key: '上传人',
      value: <UserNameWithCard name={version.uploader_name} userId={version.uploader_id} />,
    },
    { key: '创建时间', value: version.created_at },
    { key: '发布时间', value: version.publish_time || '-' },
    { key: '更新说明', value: <ExpandableText text={version.version_note} /> },
    { key: '命令库文件', value: <FileLine name={version.file_name} size={version.file_size} /> },
    {
      key: '源码文件',
      value: <FileLine name={version.source_file_name} size={version.source_file_size} />,
    },
  ];

  return (
    <DetailDrawerWrapper<CommandItem>
      visible={visible}
      onClose={onClose}
      title={
        <div className="command-detail-drawer-title">
          <div className="command-detail-drawer-title-main">
            <div className="command-detail-drawer-title-icon">{command.name.slice(0, 1)}</div>
            <span className="command-detail-drawer-title-name">{command.name}</span>
            <Tag size="small" color={statusCfg.color} type="light">
              {statusCfg.label}
            </Tag>
          </div>
          <div className="command-detail-drawer-title-sub">
            <Text type="tertiary" size="small">
              所有者：
            </Text>
            <UserNameWithCard
              name={command.owner_name}
              userId={command.owner_id}
              department={command.owning_department_name}
            />
          </div>
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
            <Button icon={<Trash2 size={16} strokeWidth={2} />} theme="borderless" type="tertiary" onClick={onDelete} />
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
            <Title heading={6} style={{ margin: '0 0 12px' }}>
              基础信息
            </Title>
            <Descriptions data={basicGroupData} align="left" />

            <Divider margin="20px" />
            <Title heading={6} style={{ margin: '0 0 12px' }}>
              发布信息
            </Title>
            <Descriptions data={publishGroupData} align="left" />

          </div>
        </TabPane>

        <TabPane tab="版本" itemKey="versions">
          {sortedVersions.length === 0 ? (
            <div className="command-detail-drawer-version-empty">
              <EmptyState description="暂无版本" size={120} />
              <Button
                icon={<Upload size={16} strokeWidth={2} />}
                theme="solid"
                className="command-detail-drawer-version-empty-upload-btn"
                onClick={onUploadVersion}
              >
                上传版本
              </Button>
            </div>
          ) : (
            <div className="command-detail-drawer-version-layout">
              <div className="command-detail-drawer-version-sidebar">
                <div className="command-detail-drawer-version-sidebar-header">
                  <Text className="command-detail-drawer-version-sidebar-title">历史版本</Text>
                  <Tooltip content="展示该命令库的全部历史版本，绿点为当前启用版本">
                    <HelpCircle size={16} strokeWidth={2} />
                  </Tooltip>
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
                        selectedVersionId === version.id
                          ? 'command-detail-drawer-version-sidebar-item--selected'
                          : ''
                      }`}
                      onClick={() => setSelectedVersionId(version.id)}
                    >
                      <Space spacing={6} align="center">
                        <Text className="command-detail-drawer-version-sidebar-item-version">{version.version}</Text>
                        {version.id === latestActiveVersionId && (
                          <Tooltip content="当前启用版本">
                            <span className="command-detail-drawer-version-sidebar-item-active-dot" />
                          </Tooltip>
                        )}
                      </Space>
                      <Tag color={version.is_active ? 'green' : 'grey'} type="light" size="small">
                        {version.is_active ? '已发布' : '未发布'}
                      </Tag>
                    </div>
                  ))}
                </div>
              </div>

              <div className="command-detail-drawer-version-detail">
                {selectedVersion ? (
                  <>
                    <div className="command-detail-drawer-version-detail-section">
                      <Text className="command-detail-drawer-version-detail-section-title">版本信息</Text>
                      <Descriptions data={getVersionDescriptionData(selectedVersion)} align="left" />
                      {selectedVersion.is_active ? (
                        <Tooltip content="已发布版本不可删除">
                          <Button
                            icon={<Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />}
                            type="tertiary"
                            className="command-detail-drawer-version-detail-delete-btn"
                            disabled
                          >
                            删除版本
                          </Button>
                        </Tooltip>
                      ) : (
                        <Button
                          icon={<Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />}
                          type="tertiary"
                          className="command-detail-drawer-version-detail-delete-btn"
                          onClick={() => handleDeleteVersion(selectedVersion)}
                        >
                          删除版本
                        </Button>
                      )}
                    </div>

                    <div className="command-detail-drawer-version-detail-section">
                      <Text className="command-detail-drawer-version-detail-section-title">本版本包含命令</Text>
                      <CommandEntryTable data={selectedVersion.commands || []} />
                    </div>
                  </>
                ) : (
                  <div className="command-detail-drawer-version-detail-empty">
                    <EmptyState description="暂无版本" size={100} />
                  </div>
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
