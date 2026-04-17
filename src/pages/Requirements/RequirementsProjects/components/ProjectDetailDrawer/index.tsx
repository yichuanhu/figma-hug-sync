import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabPane, Typography, Tag, Table, Button, Modal, Toast, Empty } from '@douyinfe/semi-ui';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import { FileText, Folder, Plus, Pencil, Trash2, Link as LinkIcon, Users } from 'lucide-react';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import type { Project, Workspace, ProjectAggregatedStatus } from '../../types';
import { fetchWorkspacesByProject, deleteWorkspace } from '../../mockData';
import WorkspaceFormModal from '../WorkspaceFormModal';
import LinkRequirementsModal from '../LinkRequirementsModal';
import WorkspaceMembersModal from '../WorkspaceMembersModal';

const { Text, Title } = Typography;

const statusTagColor: Record<ProjectAggregatedStatus, TagColor> = {
  EMPTY: 'grey',
  IN_PROGRESS: 'blue',
  DEVELOPING: 'orange',
  COMPLETED: 'green',
};

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
    if (ws.hasPublishedProcess || ws.linkedRequirementIds.length > 0) {
      Toast.warning(t('requirements.projects.validation.workspaceInUse'));
      return;
    }
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
      render: (v: string) => <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 200 }}>{v}</Text>,
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
      key: 'actions',
      width: 220,
      render: (_: unknown, record: Workspace) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            size="small"
            theme="borderless"
            icon={<LinkIcon size={14} />}
            onClick={() => {
              setLinkingWs(record);
              setLinkModalVisible(true);
            }}
          >
            {t('requirements.projects.linkRequirements')}
          </Button>
          <Button
            size="small"
            theme="borderless"
            icon={<Pencil size={14} />}
            onClick={() => {
              setEditingWs(record);
              setWsModalVisible(true);
            }}
          />
          <Button
            size="small"
            theme="borderless"
            type="danger"
            icon={<Trash2 size={14} />}
            onClick={() => handleDeleteWs(record)}
          />
        </div>
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
          <Button
            theme="borderless"
            type="tertiary"
            size="small"
            icon={<Trash2 size={16} color="var(--semi-color-danger)" />}
            onClick={() => onDelete(data)}
          />
        }
      >
        <Tabs type="line" activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            itemKey="overview"
            tab={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FileText size={14} /> {t('common.overview')}
              </span>
            }
          >
            <div className="project-detail-overview">
              <div className="project-detail-overview-meta">
                <div className="project-detail-overview-meta-item">
                  <Text type="tertiary" size="small">{t('common.status')}</Text>
                  <div>
                    <Tag color={statusTagColor[data.aggregatedStatus]} type="light" size="large">
                      {t(`requirements.projects.status.${data.aggregatedStatus}`)}
                    </Tag>
                  </div>
                </div>
                <div className="project-detail-overview-meta-item">
                  <Text type="tertiary" size="small">{t('requirements.projects.fields.dateRange')}</Text>
                  <Text>
                    {data.startDate && data.endDate
                      ? `${data.startDate} ~ ${data.endDate}`
                      : '-'}
                  </Text>
                </div>
                <div className="project-detail-overview-meta-item">
                  <Text type="tertiary" size="small">{t('requirements.projects.fields.workspaceCount')}</Text>
                  <Text>{data.workspaceCount}</Text>
                </div>
                <div className="project-detail-overview-meta-item">
                  <Text type="tertiary" size="small">{t('requirements.projects.fields.requirementCount')}</Text>
                  <Text>{data.requirementCount}</Text>
                </div>
                <div className="project-detail-overview-meta-item">
                  <Text type="tertiary" size="small">{t('common.createTime')}</Text>
                  <Text>{data.createdAt.replace('T', ' ').substring(0, 19)}</Text>
                </div>
              </div>
              {data.description && (
                <div className="project-detail-overview-description">{data.description}</div>
              )}
            </div>
          </TabPane>

          <TabPane
            itemKey="workspaces"
            tab={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Folder size={14} /> {t('requirements.projects.workspaces')} ({workspaces.length})
              </span>
            }
          >
            <div className="project-workspaces-tab">
              <div className="project-workspaces-tab-toolbar">
                <Title heading={6} style={{ margin: 0 }}>
                  {t('requirements.projects.workspaceList')}
                </Title>
                <Button
                  theme="solid"
                  type="primary"
                  size="small"
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
    </>
  );
};

export default ProjectDetailDrawer;
