import { useState, useMemo, useEffect } from 'react';
import { Typography, Tag, Button, Tooltip, Modal, Toast, Switch } from '@douyinfe/semi-ui';
import { Trash2, Upload, Pencil, Download, FileArchive } from 'lucide-react';
import DetailDrawerWrapper, { type PaginationInfo } from '@/components/DetailDrawerWrapper';
import ExpandableText from '@/components/ExpandableText';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import EmptyState from '@/components/EmptyState';
import { COMMAND_STATUS_CONFIG, type CommandItem, type CommandVersion } from '@/mocks/commandLibrary';
import './index.less';

const { Text } = Typography;

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

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="command-detail-drawer-field">
    <div className="command-detail-drawer-field-label">{label}</div>
    <div className="command-detail-drawer-field-value">{children}</div>
  </div>
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
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

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
    setActiveVersionId(sortedVersions.find((v) => v.is_active)?.id || null);
  }, [sortedVersions]);

  const selectedVersion = sortedVersions.find((v) => v.id === selectedVersionId) || null;

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

  return (
    <DetailDrawerWrapper<CommandItem>
      visible={visible}
      onClose={onClose}
      title={
        <div className="command-detail-drawer-title">
          <div className="command-detail-drawer-title-main">
            <div className="command-detail-drawer-title-icon">{command.name.slice(0, 1)}</div>
            <span className="command-detail-drawer-title-name">{command.name}</span>
            <Tag size="small" color={statusCfg.color === 'grey' ? 'grey' : statusCfg.color} type="light">
              {statusCfg.label}
            </Tag>
          </div>
          <div className="command-detail-drawer-title-sub">
            <Text type="tertiary" size="small">所有者：</Text>
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
      {sortedVersions.length === 0 ? (
        <div className="command-detail-drawer-empty">
          <EmptyState description="暂无版本" size={120} />
          <Button icon={<Upload size={16} strokeWidth={2} />} theme="solid" onClick={onUploadVersion}>
            新增版本
          </Button>
        </div>
      ) : (
        <div className="command-detail-drawer-layout">
          <div className="command-detail-drawer-sidebar">
            <div className="command-detail-drawer-sidebar-header">
              <Text className="command-detail-drawer-sidebar-title">历史版本</Text>
              <Button theme="solid" onClick={onUploadVersion}>
                + 新增版本
              </Button>
            </div>
            <Text
              link
              size="small"
              onClick={() => Toast.info('原型演示，暂不支持查看已删除版本')}
              className="command-detail-drawer-sidebar-link"
            >
              查看已删除版本
            </Text>
            <div className="command-detail-drawer-sidebar-list">
              {sortedVersions.map((version) => {
                const isActive = activeVersionId === version.id;
                return (
                  <div
                    key={version.id}
                    className={`command-detail-drawer-version-item ${
                      selectedVersionId === version.id ? 'command-detail-drawer-version-item--selected' : ''
                    }`}
                    onClick={() => setSelectedVersionId(version.id)}
                  >
                    <div className="command-detail-drawer-version-item-main">
                      <Switch
                        size="small"
                        checked={isActive}
                        onChange={(checked) => setActiveVersionId(checked ? version.id : null)}
                      />
                      <Text strong>{version.version}</Text>
                    </div>
                    {isActive ? (
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
                );
              })}
            </div>
          </div>

          <div className="command-detail-drawer-detail">
            {selectedVersion && (
              <>
                <Field label="版本号">{selectedVersion.version}</Field>
                <Field label="创建时间">{selectedVersion.created_at}</Field>
                <Field label="命令库介绍">
                  <ExpandableText text={command.description || '-'} />
                </Field>
                <Field label="更新说明">
                  <ExpandableText text={selectedVersion.version_note || '-'} />
                </Field>
                <Field label="兼容系统">
                  {(command.compatible_systems || []).length ? command.compatible_systems.join(', ') : '-'}
                </Field>
                <Field label="命令库文件">
                  <FileLine name={selectedVersion.file_name} />
                </Field>
                <Field label="命令库源码文件">
                  <FileLine name={selectedVersion.source_file_name} />
                </Field>
              </>
            )}
          </div>
        </div>
      )}
    </DetailDrawerWrapper>
  );
};

export default CommandDetailDrawer;
