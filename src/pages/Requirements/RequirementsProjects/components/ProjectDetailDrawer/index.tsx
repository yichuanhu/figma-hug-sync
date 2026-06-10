import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabPane, Typography, Table, Button, Modal, Toast, Empty, Dropdown, Tooltip, Descriptions } from '@douyinfe/semi-ui';
import { Plus, Pencil, Trash2, Link as LinkIcon, Users, Ellipsis } from 'lucide-react';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import ExpandableText from '@/components/ExpandableText';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import type { Project, Workspace } from '../../types';
import { fetchWorkspacesByProject, deleteWorkspace } from '../../mockData';
import {
  countUnackedByWorkspace,
  countUnackedByWorkspaces,
  firstPendingChangeByWorkspace,
  firstPendingChangeByWorkspaces,
} from '../../../RequirementsWorkbench/mockData';
import UnackedBadge from '@/components/UnackedBadge';
import WorkspaceFormModal from '../WorkspaceFormModal';
import LinkRequirementsModal from '../LinkRequirementsModal';
import WorkspaceMembersModal from '../WorkspaceMembersModal';

const { Text, Title } = Typography;

interface Props {
  visible: boolean;
  data: Project | null;
  dataList: Project[];
  pagination: PaginationInfo;
  onClose: () => void;
  onNavigate: (item: Project) => void;
  onEdit: (item: Project) => void;
  onDelete: (item: Project) => void;
  onRefresh: () => void;
}

const ProjectDetailDrawer = ({
  visible,
  data,
  dataList,
  pagination,
  onClose,
  onNavigate,
  onEdit,
  onDelete,
  onRefresh,
}: Props) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [wsModalVisible, setWsModalVisible] = useState(false);
  const [editingWs, setEditingWs] = useState<Workspace | null>(null);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkingWs, setLinkingWs] = useState<Workspace | null>(null);
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [membersWs, setMembersWs] = useState<Workspace | null>(null);

  const reload = useMemo(
    () => () => {
      if (data) fetchWorkspacesByProject(data.id).then(setWorkspaces);
    },
    [data],
  );

  useEffect(() => {
    if (!visible) {
      setActiveTab('overview');
      return;
    }
    reload();
  }, [visible, reload]);

  if (!data) return null;

  const handleDeleteWs = (ws: Workspace) => {
    Modal.confirm({
      title: t('requirements.projects.deleteWorkspace'),
      content: t('requirements.projects.deleteWorkspaceConfirm', { name: ws.name }),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          await deleteWorkspace(ws.id);
          Toast.success(t('common.deleteSuccess'));
          reload();
          onRefresh();
        } catch (err) {
          if ((err as Error).message === 'WORKSPACE_IN_USE') {
            Toast.error(t('requirements.projects.validation.workspaceInUse'));
          } else {
            Toast.error(t('common.operationFailed'));
          }
        }
      },
    });
  };

  const wsColumns = [
    {
      title: t('requirements.projects.fields.workspaceName'),
      dataIndex: 'name',
      width: 220,
      render: (v: string, record: Workspace) => {
        const unacked = countUnackedByWorkspace(record.id);
        const target = unacked > 0 ? firstPendingChangeByWorkspace(record.id) : null;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, maxWidth: 200 }}>
            <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 160 }}>{v}</Text>
            {target && (
              <UnackedBadge
                count={unacked}
                requirementId={target.requirementId}
                changeLogId={target.changeLogId}
              />
            )}
          </span>
        );
      },
    },
    {
      title: t('requirements.projects.fields.department'),
      dataIndex: 'departmentName',
      width: 140,
    },
    {
      title: t('requirements.projects.fields.requirementCount'),
      dataIndex: 'linkedRequirementIds',
      width: 110,
      render: (ids: string[]) => ids.length,
    },
    {
      title: t('requirements.projects.fields.memberCount'),
      dataIndex: 'memberCount',
      width: 90,
    },
    {
      title: t('common.actions'),
      fixed: 'right' as const,
      align: 'center' as const,
      key: 'actions',
      width: 60,
      render: (_: unknown, record: Workspace) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          stopPropagation
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                icon={<LinkIcon size={16} strokeWidth={2} />}
                onClick={() => {
                  setLinkingWs(record);
                  setLinkModalVisible(true);
                }}
              >
                {t('requirements.projects.linkRequirements')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<Users size={16} strokeWidth={2} />}
                onClick={() => {
                  setMembersWs(record);
                  setMembersModalVisible(true);
                }}
              >
                {t('requirements.projects.members')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<Pencil size={16} strokeWidth={2} />}
                onClick={() => {
                  setEditingWs(record);
                  setWsModalVisible(true);
                }}
              >
                {t('common.edit')}
              </Dropdown.Item>
              {(() => {
                const wsInUse = record.hasPublishedProcess || record.linkedRequirementIds.length > 0;
                const deleteItem = (
                  <Dropdown.Item
                    icon={<Trash2 size={16} strokeWidth={2} />}
                    type="danger"
                    disabled={wsInUse}
                    onClick={() => !wsInUse && handleDeleteWs(record)}
                  >
                    {t('common.delete')}
                  </Dropdown.Item>
                );
                return wsInUse ? (
                  <Tooltip
                    content={t('requirements.projects.validation.workspaceInUse')}
                    position="left"
                  >
                    <div>{deleteItem}</div>
                  </Tooltip>
                ) : (
                  deleteItem
                );
              })()}
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
    <>
      <DetailDrawerWrapper<Project>
        visible={visible}
        onClose={onClose}
        title={data.name}
        dataList={dataList}
        currentId={data.id}
        onNavigate={onNavigate}
        pagination={pagination}
        defaultWidth={900}
        minWidth={760}
        storageKey="projectDetailDrawerWidth"
        extraActions={
          <Button
            theme="borderless"
            type="tertiary"
            size="small"
            icon={<Pencil size={16} />}
            onClick={() => onEdit(data)}
          />
        }
        deleteAction={
          <Tooltip
            content={t('requirements.projects.validation.projectHasWorkspaces')}
            trigger={data.workspaceCount > 0 ? 'hover' : 'custom'}
            visible={data.workspaceCount > 0 ? undefined : false}
          >
            <Button
              theme="borderless"
              type="tertiary"
              size="small"
              disabled={data.workspaceCount > 0}
              icon={<Trash2 size={16} color={data.workspaceCount > 0 ? undefined : 'var(--semi-color-danger)'} />}
              onClick={() => data.workspaceCount === 0 && onDelete(data)}
            />
          </Tooltip>
        }
      >
        <Tabs type="line" activeKey={activeTab} onChange={setActiveTab} className="project-detail-drawer-tabs">
          <TabPane itemKey="overview" tab={t('common.overview')}>
            <div className="project-detail-overview">
              <Descriptions
                align="left"
                data={[
                  {
                    key: t('requirements.projects.fields.dateRange'),
                    value:
                      data.startDate && data.endDate
                        ? `${data.startDate} ~ ${data.endDate}`
                        : '-',
                  },
                  {
                    key: t('requirements.projects.fields.workspaceCount'),
                    value: data.workspaceCount,
                  },
                  {
                    key: t('requirements.projects.fields.requirementCount'),
                    value: data.requirementCount,
                  },
                  {
                    key: t('common.createTime'),
                    value: data.createdAt.replace('T', ' ').substring(0, 19),
                  },
                  {
                    key: t('common.description'),
                    value: <ExpandableText text={data.description || '-'} maxLines={3} />,
                  },
                ]}
              />
            </div>
          </TabPane>

          <TabPane
            itemKey="workspaces"
            tab={(() => {
              const wsIds = workspaces.map((w) => w.id);
              const unacked = countUnackedByWorkspaces(wsIds);
              const target = unacked > 0 ? firstPendingChangeByWorkspaces(wsIds) : null;
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {`${t('requirements.projects.workspaces')} (${workspaces.length})`}
                  {target && (
                    <UnackedBadge
                      count={unacked}
                      requirementId={target.requirementId}
                      changeLogId={target.changeLogId}
                    />
                  )}
                </span>
              );
            })()}
          >
            <div className="project-workspaces-tab">
              <div className="project-workspaces-tab-toolbar">
                <Title heading={6} style={{ margin: 0 }}>
                  {t('requirements.projects.workspaceList')}
                </Title>
                <Button
                  theme="solid"
                  type="primary"
                  style={{ height: 32 }}
                  icon={<Plus size={14} />}
                  onClick={() => {
                    setEditingWs(null);
                    setWsModalVisible(true);
                  }}
                >
                  {t('requirements.projects.createWorkspace')}
                </Button>
              </div>
              {workspaces.length === 0 ? (
                <Empty description={t('requirements.projects.noWorkspaces')} style={{ padding: 32 }} />
              ) : (
                <Table
                  size="small"
                  dataSource={workspaces}
                  columns={wsColumns}
                  rowKey="id"
                  pagination={false}
                />
              )}
            </div>
          </TabPane>
        </Tabs>
      </DetailDrawerWrapper>

      <WorkspaceFormModal
        visible={wsModalVisible}
        projectId={data.id}
        initialData={editingWs}
        onClose={() => setWsModalVisible(false)}
        onSuccess={() => {
          reload();
          onRefresh();
        }}
      />
      <LinkRequirementsModal
        visible={linkModalVisible}
        workspace={linkingWs}
        onClose={() => setLinkModalVisible(false)}
        onSuccess={() => {
          reload();
          onRefresh();
        }}
      />
      <WorkspaceMembersModal
        visible={membersModalVisible}
        workspace={membersWs}
        onClose={() => setMembersModalVisible(false)}
        onChanged={() => {
          reload();
          onRefresh();
        }}
      />
    </>
  );
};

export default ProjectDetailDrawer;
