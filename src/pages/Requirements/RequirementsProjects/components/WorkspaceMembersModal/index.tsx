import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Tag,
  Button,
  Toast,
  Typography,
  Input,
  Avatar,
  AvatarGroup,
  Divider,
  Select,
  Checkbox,
  Breadcrumb,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Check, ChevronLeft, ChevronRight, Network, User, UserPlus, X } from 'lucide-react';
import {
  fetchWorkspaceMembers,
  fetchAllWorkspaceMembersIncludingInherited,
  addWorkspaceMembers,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
  isInheritedDeptManager,
} from '../../mockData';
import type { Workspace, WorkspaceMember, WorkspaceMemberRole, WorkspaceMemberView } from '../../types';
import { ALL_ORG_USERS, searchOrgUsers } from '@/components/CollaboratorManager/mockData';
import type { OrgUser } from '@/components/CollaboratorManager/mockData';
import './index.less';

const { Text } = Typography;

interface Props {
  visible: boolean;
  workspace: Workspace | null;
  onClose: () => void;
  onChanged?: () => void;
}

interface SelectedItem {
  userId: string;
  userName: string;
  department: string;
  role: WorkspaceMemberRole;
}

type PanelView = 'quick' | 'manage' | 'org';

// ===== Org tree (mirrors CollaboratorPanel structure, USER-only selection) =====
interface DeptNode {
  id: string;
  name: string;
  children?: DeptNode[];
  users?: { id: string; name: string; department: string }[];
}

const mockLaiyeOrg: DeptNode = {
  id: 'laiye',
  name: 'Laiye Technology',
  children: [
    { id: 'dept-ceo', name: 'CEO Office', children: [], users: [{ id: 'user-ceo-001', name: 'Michael Chen', department: 'CEO Office' }] },
    {
      id: 'dept-enterprise',
      name: 'Enterprise Business Center',
      children: [
        {
          id: 'dept-north',
          name: 'North China Regional Business Division',
          children: [
            {
              id: 'dept-north-solution',
              name: 'North China Regional Solution and Delivery Team',
              children: [],
              users: [
                { id: 'user-n-001', name: 'David Liu', department: 'North China Regional Solution and Delivery Team' },
                { id: 'user-n-002', name: 'Wenjie Rong', department: 'North China Regional Solution and Delivery Team' },
                { id: 'user-n-003', name: 'Yue Zhang', department: 'North China Regional Solution and Delivery Team' },
              ],
            },
          ],
          users: [{ id: 'user-north-001', name: 'Lei Wang', department: 'North China Regional Business Division' }],
        },
        { id: 'dept-east', name: 'East China Regional Business Division', children: [], users: [{ id: 'user-e-001', name: 'Sophia Sun', department: 'East China Regional Business Division' }, { id: 'user-e-002', name: 'William Li', department: 'East China Regional Business Division' }] },
        { id: 'dept-south', name: 'South and Southwest China Regional Business Division', children: [], users: [{ id: 'user-s-001', name: 'Emily Zhao', department: 'South and Southwest China Regional Business Division' }] },
        { id: 'dept-expert', name: 'Expert Enablement Group', children: [], users: [{ id: 'user-exp-001', name: 'Jack Zhou', department: 'Expert Enablement Group' }, { id: 'user-exp-002', name: 'Fiona Wu', department: 'Expert Enablement Group' }] },
      ],
      users: [],
    },
    {
      id: 'dept-rd',
      name: 'R&D Center',
      children: [
        { id: 'dept-frontend', name: 'Frontend Development Team', children: [], users: [{ id: 'user-fe-001', name: 'Charles Feng', department: 'Frontend Development Team' }, { id: 'user-fe-002', name: 'Linda Chen', department: 'Frontend Development Team' }, { id: 'user-fe-003', name: 'Peng Xu', department: 'Frontend Development Team' }] },
        { id: 'dept-backend', name: 'Backend Development Team', children: [], users: [{ id: 'user-be-001', name: 'Yang Chu', department: 'Backend Development Team' }, { id: 'user-be-002', name: 'Dong Wei', department: 'Backend Development Team' }] },
        { id: 'dept-ai', name: 'AI Platform Team', children: [], users: [{ id: 'user-ai-001', name: 'Ming Qian', department: 'AI Platform Team' }, { id: 'user-ai-002', name: 'Ray Huang', department: 'AI Platform Team' }] },
        { id: 'dept-qa', name: 'Quality Assurance Team', children: [], users: [{ id: 'user-qa-001', name: 'Ting Jiang', department: 'Quality Assurance Team' }] },
      ],
      users: [],
    },
    {
      id: 'dept-product',
      name: 'APA Product Division',
      children: [
        { id: 'dept-product-rpa', name: 'RPA Product Team', children: [], users: [{ id: 'user-prpa-001', name: 'Xiao Deng', department: 'RPA Product Team' }] },
        { id: 'dept-product-idp', name: 'IDP Product Team', children: [], users: [{ id: 'user-pidp-001', name: 'Jun Cao', department: 'IDP Product Team' }] },
        { id: 'dept-product-team', name: 'Product Team', children: [], users: [{ id: 'user-pt-001', name: 'Lihong Fan', department: 'Product Team' }, { id: 'user-pt-002', name: 'Yichuan Hu', department: 'Product Team' }] },
      ],
      users: [],
    },
    { id: 'dept-digital-worker', name: 'Digital Worker Division', children: [], users: [{ id: 'user-dw-001', name: 'Xuan Cai', department: 'Digital Worker Division' }, { id: 'user-dw-002', name: 'Linghui Huang', department: 'Digital Worker Division' }] },
    { id: 'dept-marketing', name: 'Marketing Department', children: [], users: [{ id: 'user-mkt-001', name: 'Lisa Tang', department: 'Marketing Department' }, { id: 'user-mkt-002', name: 'Bob Shen', department: 'Marketing Department' }] },
    { id: 'dept-hr', name: 'Human Resources Department', children: [], users: [{ id: 'user-hr-001', name: 'Fei Liang', department: 'Human Resources Department' }] },
    { id: 'dept-finance', name: 'Finance Department', children: [], users: [{ id: 'user-fin-001', name: 'Yun Xie', department: 'Finance Department' }, { id: 'user-fin-002', name: 'Hua Pan', department: 'Finance Department' }] },
  ],
  users: [],
};

const mockOrgTree: DeptNode = { id: 'root', name: '组织架构', children: [mockLaiyeOrg], users: [] };

const findNode = (node: DeptNode, id: string): DeptNode | null => {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
};

const getBreadcrumbPath = (node: DeptNode, targetId: string, path: DeptNode[] = []): DeptNode[] | null => {
  const currentPath = [...path, node];
  if (node.id === targetId) return currentPath;
  for (const child of node.children ?? []) {
    const result = getBreadcrumbPath(child, targetId, currentPath);
    if (result) return result;
  }
  return null;
};

// ===== Workspace role select (MANAGER/MEMBER + Remove slot) =====
interface WorkspaceRoleSelectProps {
  value: WorkspaceMemberRole;
  onChange: (role: WorkspaceMemberRole) => void;
  disabled?: boolean;
  size?: 'small' | 'default' | 'large';
  onRemove?: () => void;
}

const WorkspaceRoleSelect = ({
  value,
  onChange,
  disabled = false,
  size = 'small',
  onRemove,
}: WorkspaceRoleSelectProps) => {
  const { t } = useTranslation();
  const removeSlot = onRemove ? (
    <div
      className="semi-select-option semi-select-option-removable"
      style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 12px', cursor: 'pointer' }}
      onClick={onRemove}
      role="button"
      tabIndex={0}
    >
      <div style={{ width: 20, flexShrink: 0, marginTop: 2 }} />
      <span className="semi-select-option-text" style={{ color: 'var(--semi-color-danger)' }}>
        {t('collaborator.actions.remove')}
      </span>
    </div>
  ) : undefined;
  return (
    <Select
      value={value}
      onChange={(v) => onChange(v as WorkspaceMemberRole)}
      disabled={disabled}
      size={size}
      style={{ width: 96 }}
      dropdownStyle={{ width: 200 }}
      outerBottomSlot={removeSlot}
      renderSelectedItem={(node) => t(`requirements.projects.role.${(node as { value: string }).value}`) as unknown as React.ReactNode}
      renderOptionItem={(props) => {
        const { selected, focused, label, onClick, onMouseEnter, style, disabled: optDisabled } = props;
        return (
          <div
            style={{ ...style, display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: optDisabled ? 'not-allowed' : 'pointer' }}
            className={`semi-select-option${selected ? ' semi-select-option-selected' : ''}${focused ? ' semi-select-option-focused' : ''}`}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
          >
            <div style={{ width: 20, flexShrink: 0 }}>{selected && <Check size={16} strokeWidth={2} />}</div>
            <span>{label}</span>
          </div>
        );
      }}
    >
      <Select.Option value="MANAGER" label={t('requirements.projects.role.MANAGER')} />
      <Select.Option value="MEMBER" label={t('requirements.projects.role.MEMBER')} />
    </Select>
  );
};

// ===== Main =====
const WorkspaceMembersModal = ({ visible, workspace, onClose, onChanged }: Props) => {
  const { t } = useTranslation();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [allMembers, setAllMembers] = useState<WorkspaceMemberView[]>([]);
  const [panelView, setPanelView] = useState<PanelView>('quick');
  const [previousView, setPreviousView] = useState<'quick' | 'manage'>('quick');

  // Quick view state
  const [searchValue, setSearchValue] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<OrgUser[]>([]);
  const [batchRole, setBatchRole] = useState<WorkspaceMemberRole>('MEMBER');

  // Org view state
  const [orgSearchValue, setOrgSearchValue] = useState('');
  const [orgSelected, setOrgSelected] = useState<SelectedItem[]>([]);
  const [currentDeptId, setCurrentDeptId] = useState('root');

  const reload = useCallback(async () => {
    if (!workspace) return;
    const list = await fetchWorkspaceMembers(workspace.id);
    setMembers(list);
    const all = await fetchAllWorkspaceMembersIncludingInherited(workspace.id);
    setAllMembers(all);
  }, [workspace]);

  useEffect(() => {
    if (visible && workspace) {
      reload();
      setPanelView('quick');
      setPreviousView('quick');
      setSearchValue('');
      setSelectedUsers([]);
      setBatchRole('MEMBER');
      setOrgSearchValue('');
      setOrgSelected([]);
      setCurrentDeptId('root');
    }
  }, [visible, workspace, reload]);

  // ===== Quick view =====
  const existingUserIds = useMemo(() => new Set(allMembers.map((m) => m.userId)), [allMembers]);

  const searchResults = useMemo(() => {
    if (!searchValue.trim()) return [];
    const selectedIds = selectedUsers.map((u) => u.id);
    return searchOrgUsers(searchValue, [...selectedIds, ...Array.from(existingUserIds)]);
  }, [searchValue, selectedUsers, existingUserIds]);

  const handleSelectUser = useCallback((user: OrgUser) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchValue('');
  }, []);

  const handleDeselectUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const handleBatchAdd = useCallback(async () => {
    if (!workspace || selectedUsers.length === 0) return;
    await addWorkspaceMembers(
      workspace.id,
      selectedUsers.map((u) => ({
        userId: u.id,
        userName: u.name,
        department: u.department,
        role: batchRole,
      })),
    );
    Toast.success(t('common.createSuccess'));
    setSelectedUsers([]);
    setSearchValue('');
    setBatchRole('MEMBER');
    await reload();
    onChanged?.();
  }, [workspace, selectedUsers, batchRole, reload, onChanged, t]);

  // ===== Manage view =====
  const handleRoleChange = async (member: WorkspaceMember, role: WorkspaceMemberRole) => {
    try {
      await updateWorkspaceMemberRole(member.id, role);
      Toast.success(t('common.editSuccess'));
      await reload();
      onChanged?.();
    } catch (err) {
      if ((err as Error).message === 'MUST_KEEP_ONE_MANAGER') {
        Toast.error(t('requirements.projects.validation.mustKeepOneManager'));
      } else {
        Toast.error(t('common.operationFailed'));
      }
    }
  };

  const handleRemove = (member: WorkspaceMember) => {
    Modal.confirm({
      title: t('requirements.projects.removeMemberConfirm', { name: member.userName }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger', theme: 'solid' },
      onOk: async () => {
        try {
          await removeWorkspaceMember(member.id);
          Toast.success(t('common.deleteSuccess'));
          await reload();
          onChanged?.();
        } catch (err) {
          if ((err as Error).message === 'MUST_KEEP_ONE_MANAGER') {
            Toast.error(t('requirements.projects.validation.mustKeepOneManager'));
          } else {
            Toast.error(t('common.operationFailed'));
          }
        }
      },
    });
  };

  // ===== Org view =====
  const currentNode = useMemo(() => findNode(mockOrgTree, currentDeptId) || mockOrgTree, [currentDeptId]);
  const breadcrumbPath = useMemo(
    () => getBreadcrumbPath(mockOrgTree, currentDeptId) || [mockOrgTree],
    [currentDeptId],
  );

  const orgSearchResults = useMemo(() => {
    if (!orgSearchValue) return null;
    const keyword = orgSearchValue.toLowerCase();
    const users: { id: string; name: string; department: string }[] = [];
    const depts: DeptNode[] = [];
    const traverse = (node: DeptNode) => {
      if (node.id !== 'root' && node.name.toLowerCase().includes(keyword)) depts.push(node);
      node.users?.forEach((u) => {
        if (u.name.toLowerCase().includes(keyword) || u.department.toLowerCase().includes(keyword)) {
          users.push(u);
        }
      });
      node.children?.forEach(traverse);
    };
    traverse(mockOrgTree);
    return { users, depts };
  }, [orgSearchValue]);

  const isOrgSelected = useCallback(
    (id: string) => orgSelected.some((s) => s.userId === id),
    [orgSelected],
  );

  const toggleOrgUser = useCallback(
    (user: { id: string; name: string; department: string }, disabled: boolean) => {
      if (disabled) return;
      setOrgSelected((prev) => {
        const exists = prev.find((s) => s.userId === user.id);
        if (exists) return prev.filter((s) => s.userId !== user.id);
        return [...prev, { userId: user.id, userName: user.name, department: user.department, role: 'MEMBER' }];
      });
    },
    [],
  );

  const removeOrgSelected = useCallback((id: string) => {
    setOrgSelected((prev) => prev.filter((s) => s.userId !== id));
  }, []);

  const updateOrgSelectedRole = useCallback((id: string, role: WorkspaceMemberRole) => {
    setOrgSelected((prev) => prev.map((s) => (s.userId === id ? { ...s, role } : s)));
  }, []);

  const navigateToDept = useCallback((deptId: string) => {
    setCurrentDeptId(deptId);
    setOrgSearchValue('');
  }, []);

  const handleOpenOrgView = useCallback((from: 'quick' | 'manage') => {
    setPreviousView(from);
    setPanelView('org');
    setOrgSearchValue('');
    setOrgSelected([]);
    setCurrentDeptId('root');
  }, []);

  const handleOrgBack = useCallback(() => {
    setPanelView(previousView);
    setOrgSearchValue('');
    setOrgSelected([]);
    setCurrentDeptId('root');
  }, [previousView]);

  const handleOrgSubmit = useCallback(async () => {
    if (!workspace || orgSelected.length === 0) {
      Toast.warning(t('requirements.projects.validation.pickAtLeastOneUser'));
      return;
    }
    await addWorkspaceMembers(
      workspace.id,
      orgSelected.map((s) => ({
        userId: s.userId,
        userName: s.userName,
        department: s.department,
        role: s.role,
      })),
    );
    Toast.success(t('common.createSuccess'));
    setOrgSelected([]);
    setOrgSearchValue('');
    setCurrentDeptId('root');
    setPanelView(previousView);
    await reload();
    onChanged?.();
  }, [workspace, orgSelected, previousView, reload, onChanged, t]);

  // ===== Render helpers =====
  const renderAvatarGroup = () => (
    <div
      className="collaborator-panel-header-right"
      onClick={() => {
        setPanelView('manage');
        setSearchValue('');
        setSelectedUsers([]);
      }}
    >
      <AvatarGroup size="extra-extra-small" maxCount={3}>
        {allMembers.slice(0, 3).map((m) => (
          <Avatar key={m.userId} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
            {m.userName.slice(0, 1)}
          </Avatar>
        ))}
      </AvatarGroup>
      <Tag size="small" type="ghost" className="collaborator-panel-count-tag">
        +{allMembers.length}
      </Tag>
      <ChevronRight size={16} strokeWidth={2} />
    </div>
  );

  const renderSearchBox = () => (
    <div className="collaborator-panel-search-input-box">
      <div className="collaborator-panel-search-input-left">
        {selectedUsers.map((user) => (
          <Tag
            key={user.id}
            closable
            avatarShape="circle"
            onClose={() => handleDeselectUser(user.id)}
            size="large"
            className="collaborator-panel-selected-tag"
          >
            {user.name}
          </Tag>
        ))}
        <input
          className="collaborator-panel-search-native-input"
          placeholder={selectedUsers.length === 0 ? t('requirements.projects.searchUserPlaceholder') : ''}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
      {selectedUsers.length > 0 && (
        <WorkspaceRoleSelect value={batchRole} onChange={setBatchRole} size="small" />
      )}
    </div>
  );

  const renderSearchResultItem = (user: OrgUser) => (
    <div
      key={user.id}
      className="collaborator-panel-item"
      style={{ cursor: 'pointer' }}
      onClick={() => handleSelectUser(user)}
    >
      <div className="collaborator-panel-item-left">
        <Avatar size="small" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
          {user.name.slice(0, 1)}
        </Avatar>
        <div className="collaborator-panel-item-info">
          <Text ellipsis={{ showTooltip: true }} className="collaborator-panel-item-name">
            {user.name}
          </Text>
          <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }}>
            {user.department}
          </Text>
        </div>
      </div>
    </div>
  );

  const renderQuickView = () => (
    <div className="collaborator-panel-quick">
      {renderSearchBox()}
      {searchValue.trim() && (
        <div className="collaborator-panel-search-results">
          {searchResults.length > 0 ? (
            searchResults.map((u) => renderSearchResultItem(u))
          ) : (
            <div className="collaborator-panel-search-empty">
              <Text type="tertiary" size="small">
                {t('collaborator.panel.noSearchResults')}
              </Text>
            </div>
          )}
        </div>
      )}
      {selectedUsers.length > 0 ? (
        <div className="collaborator-panel-batch-actions">
          <Button type="tertiary" onClick={() => setSelectedUsers([])}>
            {t('common.cancel')}
          </Button>
          <Button type="primary" theme="solid" onClick={handleBatchAdd}>
            {t('common.confirm')}
          </Button>
        </div>
      ) : !searchValue.trim() ? (
        <div style={{ paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="tertiary"
            icon={<Network size={16} strokeWidth={2} />}
            onClick={() => handleOpenOrgView('quick')}
          >
            {t('requirements.projects.addFromOrg')}
          </Button>
        </div>
      ) : null}
    </div>
  );

  const renderMemberItem = (m: WorkspaceMemberView) => {
    const inherited = !!m.inheritedAsDeptManager;
    const explicit = members.find((x) => x.userId === m.userId);
    return (
      <div key={m.id} className="collaborator-panel-item">
        <div className="collaborator-panel-item-left">
          <Avatar size="small" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
            {m.userName.slice(0, 1)}
          </Avatar>
          <div className="collaborator-panel-item-info">
            <div className="collaborator-panel-item-name-row">
              <Text ellipsis={{ showTooltip: true }} className="collaborator-panel-item-name">
                {m.userName}
              </Text>
              {inherited && (
                <Tag size="small" color="blue" className="collaborator-panel-owner-tag">
                  {t('requirements.projects.deptManagerInheritedTag')}
                </Tag>
              )}
            </div>
            <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }}>
              {m.department}
            </Text>
          </div>
        </div>
        <div className="collaborator-panel-item-right">
          <WorkspaceRoleSelect
            value={m.role}
            onChange={(role) => explicit && handleRoleChange(explicit, role)}
            disabled={inherited || !explicit}
            onRemove={!inherited && explicit ? () => handleRemove(explicit) : undefined}
          />
        </div>
      </div>
    );
  };

  const renderManageView = () => (
    <div className="collaborator-panel-manage">
      <div className="collaborator-panel-manage-subtitle">
        <Text strong style={{ fontSize: 14 }}>
          {t('requirements.projects.allAccessUsersTitle')}
        </Text>
      </div>
      <div className="collaborator-panel-manage-list">
        {allMembers.length === 0 ? (
          <div className="collaborator-panel-manage-empty">
            <Text type="tertiary">{t('requirements.projects.noExplicitMembers')}</Text>
          </div>
        ) : (
          allMembers.map((m) => renderMemberItem(m))
        )}
      </div>
      <div className="collaborator-panel-manage-add" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="tertiary"
          icon={<UserPlus size={14} />}
          onClick={() => handleOpenOrgView('manage')}
        >
          {t('requirements.projects.addMember')}
        </Button>
      </div>
    </div>
  );

  // ===== Org view render =====
  const renderOrgUserItem = (user: { id: string; name: string; department: string }) => {
    const checked = isOrgSelected(user.id);
    const alreadyExist = existingUserIds.has(user.id);
    const inheritedDept = workspace ? isInheritedDeptManager(workspace.id, user.id) : false;
    const disabled = alreadyExist || inheritedDept;
    return (
      <div
        key={user.id}
        className={`collaborator-add-modal-left-item${checked ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
        onClick={() => toggleOrgUser(user, disabled)}
      >
        <Checkbox checked={checked} disabled={disabled} />
        <User size={14} strokeWidth={2} className="collaborator-add-modal-left-item-icon" />
        <div className="collaborator-add-modal-left-item-info">
          <Text style={{ fontSize: 14 }}>{user.name}</Text>
        </div>
        {disabled && (
          <span className="collaborator-add-modal-left-item-existing">
            {inheritedDept
              ? t('requirements.projects.deptManagerInheritedTag')
              : t('collaborator.addModal.alreadyAdded')}
          </span>
        )}
      </div>
    );
  };

  const renderOrgDeptItem = (dept: DeptNode) => {
    const hasChildren = (dept.children && dept.children.length > 0) || (dept.users && dept.users.length > 0);
    return (
      <div
        key={dept.id}
        className="collaborator-add-modal-left-item disabled"
        onClick={() => hasChildren && navigateToDept(dept.id)}
        style={{ cursor: hasChildren ? 'pointer' : 'default', opacity: 1 }}
      >
        <div style={{ width: 16, flexShrink: 0 }} />
        <Network size={16} strokeWidth={2} className="collaborator-add-modal-left-item-icon" />
        <div className="collaborator-add-modal-left-item-name">
          <Text style={{ fontSize: 14 }} ellipsis={{ showTooltip: true }}>
            {dept.name}
          </Text>
        </div>
        {hasChildren && (
          <span className="collaborator-add-modal-left-item-drill">
            <ChevronRight size={16} strokeWidth={2} />
          </span>
        )}
      </div>
    );
  };

  const renderOrgLeftContent = () => {
    if (orgSearchResults) {
      return (
        <div className="collaborator-add-modal-left-list">
          {orgSearchResults.depts.length > 0 && (
            <>
              <div className="collaborator-add-modal-left-section-title">
                <Network size={16} strokeWidth={2} />
                {t('collaborator.addModal.departments')}
              </div>
              {orgSearchResults.depts.map((dept) => renderOrgDeptItem(dept))}
            </>
          )}
          {orgSearchResults.users.length > 0 && (
            <>
              <div className="collaborator-add-modal-left-section-title">
                <User size={14} strokeWidth={2} />
                {t('collaborator.addModal.users')}
              </div>
              {orgSearchResults.users.map((u) => renderOrgUserItem(u))}
            </>
          )}
          {orgSearchResults.depts.length === 0 && orgSearchResults.users.length === 0 && (
            <div className="collaborator-add-modal-left-empty">
              {t('collaborator.addModal.noResults')}
            </div>
          )}
        </div>
      );
    }
    const children = currentNode.children || [];
    const users = currentNode.users || [];
    return (
      <div className="collaborator-add-modal-left-list">
        {children.map((dept) => renderOrgDeptItem(dept))}
        {users.map((u) => renderOrgUserItem(u))}
        {children.length === 0 && users.length === 0 && (
          <div className="collaborator-add-modal-left-empty">
            {t('collaborator.addModal.emptyDept')}
          </div>
        )}
      </div>
    );
  };

  const renderOrgView = () => (
    <div className="collaborator-panel-org">
      <div className="collaborator-add-modal-content">
        <div className="collaborator-add-modal-left">
          <div className="collaborator-add-modal-left-search">
            <Input
              prefix={<IconSearchStroked />}
              placeholder={t('requirements.projects.searchUserPlaceholder')}
              value={orgSearchValue}
              onChange={setOrgSearchValue}
              showClear
            />
          </div>
          {!orgSearchResults && (
            <div className="collaborator-add-modal-left-breadcrumb">
              <Breadcrumb compact={false}>
                {breadcrumbPath.map((node, index) => (
                  <Breadcrumb.Item
                    key={node.id}
                    onClick={index < breadcrumbPath.length - 1 ? () => navigateToDept(node.id) : undefined}
                  >
                    {node.id === 'root' ? t('collaborator.addModal.orgStructure') : node.name}
                  </Breadcrumb.Item>
                ))}
              </Breadcrumb>
            </div>
          )}
          <div className="collaborator-add-modal-left-tree">{renderOrgLeftContent()}</div>
        </div>
        <div className="collaborator-add-modal-right">
          <div className="collaborator-add-modal-right-header">
            {t('collaborator.addModal.selectedTitle')}：{orgSelected.length} {t('collaborator.addModal.unit')}
          </div>
          {orgSelected.length === 0 ? (
            <div className="collaborator-add-modal-right-empty">
              {t('collaborator.addModal.emptySelection')}
            </div>
          ) : (
            <div className="collaborator-add-modal-right-list">
              {orgSelected.map((item) => (
                <div key={item.userId} className="collaborator-add-modal-right-item">
                  <div className="collaborator-add-modal-right-item-info">
                    <span className="collaborator-add-modal-right-item-icon">
                      <User size={14} strokeWidth={2} />
                    </span>
                    <Text style={{ fontSize: 14 }} ellipsis={{ showTooltip: true }}>
                      {item.userName}
                    </Text>
                  </div>
                  <div className="collaborator-add-modal-right-item-actions">
                    <WorkspaceRoleSelect
                      value={item.role}
                      onChange={(role) => updateOrgSelectedRole(item.userId, role)}
                      size="small"
                    />
                    <Button
                      icon={<X size={16} strokeWidth={2} />}
                      theme="borderless"
                      size="small"
                      className="collaborator-add-modal-right-item-remove"
                      onClick={() => removeOrgSelected(item.userId)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="collaborator-panel-org-footer">
        <Button theme="light" onClick={handleOrgBack}>
          {t('common.cancel')}
        </Button>
        <Button theme="solid" onClick={handleOrgSubmit} disabled={orgSelected.length === 0}>
          {t('common.confirm')}
        </Button>
      </div>
    </div>
  );

  const modalTitle = (
    <div className="collaborator-panel-modal-title">
      <div className="collaborator-panel-modal-title-left">
        {panelView === 'quick' ? (
          <span className="collaborator-panel-header-title">
            {t('requirements.projects.addMember')}
          </span>
        ) : panelView === 'manage' ? (
          <div className="collaborator-panel-manage-back" onClick={() => setPanelView('quick')}>
            <ChevronLeft size={16} strokeWidth={2} />
            <span>{t('requirements.projects.manageMembersTitle')}</span>
          </div>
        ) : (
          <div className="collaborator-panel-manage-back" onClick={handleOrgBack}>
            <ChevronLeft size={16} strokeWidth={2} />
            <span>{t('collaborator.addModal.title')}</span>
          </div>
        )}
      </div>
      <div className="collaborator-panel-modal-title-right">
        {panelView !== 'org' && renderAvatarGroup()}
        {panelView !== 'org' && <Divider layout="vertical" style={{ height: 16, margin: '0 4px' }} />}
        <Button
          icon={<X size={16} />}
          theme="borderless"
          type="tertiary"
          size="small"
          onClick={onClose}
        />
      </div>
    </div>
  );

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={null}
      closable={false}
      title={modalTitle}
      width={panelView === 'org' ? 900 : 660}
      className={`collaborator-panel-modal${panelView === 'org' ? ' collaborator-panel-modal--org' : ''}`}
    >
      <div className="collaborator-panel">
        {panelView === 'quick' && renderQuickView()}
        {panelView === 'manage' && renderManageView()}
        {panelView === 'org' && renderOrgView()}
      </div>
    </Modal>
  );
};

export default WorkspaceMembersModal;
