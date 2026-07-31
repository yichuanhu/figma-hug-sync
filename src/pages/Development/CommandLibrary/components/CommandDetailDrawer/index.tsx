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
  Space,
  Switch,
  Table,
} from '@douyinfe/semi-ui';
import { Trash2, Plus, Pencil, Download, FileArchive } from 'lucide-react';
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

const FileLine = ({ name }: { name: string }) => (
  <div className="command-detail-drawer-file">
    <FileArchive size={16} strokeWidth={2} color="var(--semi-color-primary)" />
    <Text ellipsis={{ showTooltip: true }} className="command-detail-drawer-file-name">
      {name}
    </Text>
    <Button
      icon={<Download size={16} strokeWidth={2} />}
      theme="borderless"
      type="tertiary"
      size="small"
      onClick={() => Toast.info('原型演示，暂不支持下载')}
    />
  </div>
);

/** 纵向字段（标签在上，值在下） */
const StackField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="command-detail-drawer-field">
    <Text type="tertiary" className="command-detail-drawer-field-label">
      {label}
    </Text>
    <div className="command-detail-drawer-field-value">{children}</div>
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
  /** 原型内存态：版本启用开关 */
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({});

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
    setActiveMap(
      sortedVersions.reduce<Record<string, boolean>>((acc, v) => {
        acc[v.id] = v.is_active;
        return acc;
      }, {}),
    );
  }, [sortedVersions]);

  const selectedVersion = sortedVersions.find((v) => v.id === selectedVersionId) || null;

  if (!command) return null;

  const statusCfg = COMMAND_STATUS_CONFIG[command.status];

  const isActive = (version: CommandVersion) => activeMap[version.id] ?? version.is_active;

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

  return (
    <DetailDrawerWrapper<CommandItem>
      visible={visible}
      onClose={onClose}
      title={command.name}
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
          </div>
        </TabPane>

        <TabPane tab="版本" itemKey="versions">
          {sortedVersions.length === 0 ? (
            <div className="command-detail-drawer-version-empty">
              <EmptyState description="暂无版本" size={120} />
              <Button
                icon={<Plus size={16} strokeWidth={2} />}
                theme="solid"
                className="command-detail-drawer-version-empty-upload-btn"
                onClick={onUploadVersion}
              >
                新增版本
              </Button>
            </div>
          ) : (
            <div className="command-detail-drawer-version-layout">
              <div className="command-detail-drawer-version-sidebar">
                <div className="command-detail-drawer-version-sidebar-header">
                  <Text strong className="command-detail-drawer-version-sidebar-title">
                    历史版本
                  </Text>
                  <Button
                    icon={<Plus size={16} strokeWidth={2} />}
                    theme="solid"
                    size="small"
                    onClick={onUploadVersion}
                  >
                    新增版本
                  </Button>
                </div>
                <Text
                  link
                  className="command-detail-drawer-version-sidebar-deleted-link"
                  onClick={() => Toast.info('暂无已删除版本')}
                >
                  查看已删除版本
                </Text>
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
                      <div className="command-detail-drawer-version-sidebar-item-left">
                        <span onClick={(e) => e.stopPropagation()}>
                          <Switch
                            size="small"
                            checked={isActive(version)}
                            onChange={(checked) =>
                              setActiveMap((prev) => ({ ...prev, [version.id]: checked }))
                            }
                          />
                        </span>
                        <Text strong className="command-detail-drawer-version-sidebar-item-version">
                          {version.version}
                        </Text>
                      </div>
                      {isActive(version) ? (
                        <Tooltip content="已启用版本不可删除">
                          <Button
                            icon={<Trash2 size={16} strokeWidth={2} />}
                            theme="borderless"
                            type="tertiary"
                            size="small"
                            disabled
                          />
                        </Tooltip>
                      ) : (
                        <Button
                          icon={<Trash2 size={16} strokeWidth={2} />}
                          theme="borderless"
                          type="tertiary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVersion(version);
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="command-detail-drawer-version-detail">
                {selectedVersion ? (
                  <>
                    <div className="command-detail-drawer-field-list">
                      <StackField label="版本号">{selectedVersion.version}</StackField>
                      <StackField label="创建时间">{selectedVersion.created_at}</StackField>
                      <StackField label="命令库介绍">
                        <ExpandableText text={command.description} />
                      </StackField>
                      <StackField label="更新说明">
                        <ExpandableText text={selectedVersion.version_note} />
                      </StackField>
                      <StackField label="兼容系统">
                        {(command.compatible_systems || []).length
                          ? command.compatible_systems.join(', ')
                          : '-'}
                      </StackField>
                      <StackField label="命令库文件">
                        <FileLine name={selectedVersion.file_name} />
                      </StackField>
                      <StackField label="命令库源代码文件">
                        {selectedVersion.source_file_name ? (
                          <FileLine name={selectedVersion.source_file_name} />
                        ) : (
                          '-'
                        )}
                      </StackField>
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
