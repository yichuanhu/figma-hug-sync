import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Table,
  Tag,
  Button,
  Select,
  Toast,
  Typography,
  Input,
  Empty,
  Popconfirm,
} from '@douyinfe/semi-ui';
import { Plus, Trash2, Search, Shield, ShieldCheck, ChevronLeft } from 'lucide-react';
import {
  fetchWorkspaceMembers,
  fetchAllWorkspaceMembersIncludingInherited,
  addWorkspaceMembers,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
  isInheritedDeptManager,
} from '../../mockData';
import type { Workspace, WorkspaceMember, WorkspaceMemberRole } from '../../types';
import { ALL_ORG_USERS } from '@/components/CollaboratorManager/mockData';

const { Text } = Typography;

interface Props {
  visible: boolean;
  workspace: Workspace | null;
  onClose: () => void;
  onChanged?: () => void;
}

const WorkspaceMembersModal = ({ visible, workspace, onClose, onChanged }: Props) => {
  const { t } = useTranslation();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [inheritedUserIds, setInheritedUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addKeyword, setAddKeyword] = useState('');
  const [addRole, setAddRole] = useState<WorkspaceMemberRole>('MEMBER');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const reload = async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const list = await fetchWorkspaceMembers(workspace.id);
      setMembers(list);
      const inherited = await fetchAllWorkspaceMembersIncludingInherited(workspace.id);
      setInheritedUserIds(
        new Set(inherited.filter((m) => m.inheritedAsDeptManager).map((m) => m.userId)),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && workspace) {
      reload();
      setAddOpen(false);
      setSelectedUserIds([]);
      setAddKeyword('');
      setAddRole('MEMBER');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, workspace?.id]);

  const inheritedRows = useMemo(() => {
    if (!workspace) return [];
    return Array.from(inheritedUserIds).map((uid) => {
      const u = ALL_ORG_USERS.find((x) => x.id === uid);
      return {
        userId: uid,
        userName: u?.name ?? uid,
        department: u?.department ?? '-',
      };
    });
  }, [inheritedUserIds, workspace]);

  const handleRoleChange = async (member: WorkspaceMember, role: WorkspaceMemberRole) => {
    try {
      await updateWorkspaceMemberRole(member.id, role);
      Toast.success(t('common.editSuccess'));
      reload();
      onChanged?.();
    } catch (err) {
      if ((err as Error).message === 'MUST_KEEP_ONE_MANAGER') {
        Toast.error(t('requirements.projects.validation.mustKeepOneManager'));
      } else {
        Toast.error(t('common.operationFailed'));
      }
    }
  };

  const handleRemove = async (member: WorkspaceMember) => {
    try {
      await removeWorkspaceMember(member.id);
      Toast.success(t('common.deleteSuccess'));
      reload();
      onChanged?.();
    } catch (err) {
      if ((err as Error).message === 'MUST_KEEP_ONE_MANAGER') {
        Toast.error(t('requirements.projects.validation.mustKeepOneManager'));
      } else {
        Toast.error(t('common.operationFailed'));
      }
    }
  };

  // Add panel: list of org users not yet a member; mark inherited as disabled
  const candidateUsers = useMemo(() => {
    const existing = new Set(members.map((m) => m.userId));
    const k = addKeyword.trim().toLowerCase();
    return ALL_ORG_USERS.filter((u) => !existing.has(u.id)).filter((u) =>
      !k ? true : u.name.toLowerCase().includes(k) || u.department.toLowerCase().includes(k),
    );
  }, [members, addKeyword]);

  const handleSubmitAdd = async () => {
    if (!workspace) return;
    if (selectedUserIds.length === 0) {
      Toast.warning(t('requirements.projects.validation.pickAtLeastOneUser'));
      return;
    }
    const toAdd = selectedUserIds
      .filter((uid) => !isInheritedDeptManager(workspace.id, uid))
      .map((uid) => {
        const u = ALL_ORG_USERS.find((x) => x.id === uid)!;
        return { userId: u.id, userName: u.name, department: u.department, role: addRole };
      });
    await addWorkspaceMembers(workspace.id, toAdd);
    Toast.success(t('common.createSuccess'));
    setAddOpen(false);
    setSelectedUserIds([]);
    setAddKeyword('');
    reload();
    onChanged?.();
  };

  const memberColumns = [
    {
      title: t('requirements.projects.fields.memberName'),
      dataIndex: 'userName',
      width: 180,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: t('requirements.projects.fields.memberDept'),
      dataIndex: 'department',
      width: 220,
      render: (v: string) => (
        <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 200 }}>{v}</Text>
      ),
    },
    {
      title: t('requirements.projects.fields.memberRole'),
      dataIndex: 'role',
      width: 160,
      render: (role: WorkspaceMemberRole, record: WorkspaceMember) => (
        <Select
          size="small"
          value={role}
          style={{ width: 120 }}
          onChange={(v) => handleRoleChange(record, v as WorkspaceMemberRole)}
        >
          <Select.Option value="MANAGER">
            {t('requirements.projects.role.MANAGER')}
          </Select.Option>
          <Select.Option value="MEMBER">
            {t('requirements.projects.role.MEMBER')}
          </Select.Option>
        </Select>
      ),
    },
    {
      title: t('common.createTime'),
      dataIndex: 'addedAt',
      width: 170,
      render: (v: string) => v.replace('T', ' ').substring(0, 19),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 80,
      render: (_: unknown, record: WorkspaceMember) => (
        <Popconfirm
          title={t('requirements.projects.removeMemberConfirm', { name: record.userName })}
          okType="danger"
          okText={t('common.delete')}
          cancelText={t('common.cancel')}
          onConfirm={() => handleRemove(record)}
        >
          <Button size="small" theme="borderless" type="danger" icon={<Trash2 size={14} />} />
        </Popconfirm>
      ),
    },
  ];

  // 添加视图：候选用户列表列
  const candidateColumns = [
    {
      title: t('requirements.projects.fields.memberName'),
      dataIndex: 'name',
      width: 220,
      render: (v: string, r: { id: string }) => {
        const inherited = workspace ? isInheritedDeptManager(workspace.id, r.id) : false;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Text>{v}</Text>
            {inherited && (
              <Tag size="small" color="green" type="light">
                {t('requirements.projects.inheritedTag')}
              </Tag>
            )}
          </span>
        );
      },
    },
    {
      title: t('requirements.projects.fields.memberDept'),
      dataIndex: 'department',
      render: (v: string) => (
        <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 360 }}>
          {v}
        </Text>
      ),
    },
  ];

  return (
    <Modal
      title={
        addOpen ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Button
              icon={<ChevronLeft size={16} strokeWidth={2} />}
              theme="borderless"
              type="tertiary"
              size="small"
              onClick={() => {
                setAddOpen(false);
                setSelectedUserIds([]);
                setAddKeyword('');
              }}
            />
            {t('requirements.projects.addMember')}
          </span>
        ) : workspace ? (
          t('requirements.projects.workspaceMembersTitle', { name: workspace.name })
        ) : (
          ''
        )
      }
      visible={visible}
      onCancel={onClose}
      footer={
        addOpen ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="tertiary" size="small">
              {t('requirements.projects.selectedCount', { count: selectedUserIds.length })}
            </Text>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                onClick={() => {
                  setAddOpen(false);
                  setSelectedUserIds([]);
                  setAddKeyword('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button type="primary" theme="solid" onClick={handleSubmitAdd}>
                {t('common.confirm')}
              </Button>
            </div>
          </div>
        ) : null
      }
      width={900}
      centered
      maskClosable={false}
    >
      {addOpen ? (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input
              prefix={<Search size={14} />}
              value={addKeyword}
              onChange={setAddKeyword}
              placeholder={t('requirements.projects.searchUserPlaceholder')}
              style={{ flex: 1 }}
              showClear
            />
            <Select
              value={addRole}
              onChange={(v) => setAddRole(v as WorkspaceMemberRole)}
              style={{ width: 160 }}
            >
              <Select.Option value="MANAGER">
                {t('requirements.projects.role.MANAGER')}
              </Select.Option>
              <Select.Option value="MEMBER">
                {t('requirements.projects.role.MEMBER')}
              </Select.Option>
            </Select>
          </div>
          <div style={{ maxHeight: 420, overflow: 'auto' }}>
            <Table
              size="small"
              dataSource={candidateUsers}
              pagination={false}
              rowKey="id"
              rowSelection={{
                selectedRowKeys: selectedUserIds,
                onChange: (keys) => setSelectedUserIds((keys as string[]) ?? []),
                getCheckboxProps: (record) => ({
                  disabled: workspace
                    ? isInheritedDeptManager(workspace.id, (record as { id: string }).id)
                    : false,
                }),
              }}
              columns={candidateColumns}
              empty={<Empty description={t('common.noSearchResults')} style={{ padding: 24 }} />}
            />
          </div>
        </div>
      ) : (
        <>
          {/* 部门管理员继承提示 */}
          {inheritedRows.length > 0 && (
            <div
              style={{
                background: 'var(--semi-color-fill-0)',
                borderRadius: 6,
                padding: '10px 12px',
                marginBottom: 12,
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}
            >
              <ShieldCheck
                size={16}
                style={{ color: 'var(--semi-color-success)', marginTop: 2, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="small" type="secondary">
                  {t('requirements.projects.inheritedManagersHint')}
                </Text>
                <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {inheritedRows.map((u) => (
                    <Tag key={u.userId} type="light" color="green" prefixIcon={<Shield size={12} />}>
                      {u.userName}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text type="tertiary" size="small">
              {t('requirements.projects.explicitMembersCount', { count: members.length })}
            </Text>
            <Button
              theme="solid"
              type="primary"
              size="small"
              icon={<Plus size={14} />}
              onClick={() => setAddOpen(true)}
            >
              {t('requirements.projects.addMember')}
            </Button>
          </div>

          {members.length === 0 ? (
            <Empty
              description={t('requirements.projects.noExplicitMembers')}
              style={{ padding: 32 }}
            />
          ) : (
            <Table
              size="small"
              loading={loading}
              dataSource={members}
              columns={memberColumns}
              rowKey="id"
              pagination={false}
            />
          )}
        </>
      )}
    </Modal>
  );
};

export default WorkspaceMembersModal;
