import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tag,
  Typography,
  Toast,
  Modal,
  Popover,
  Avatar,
  AvatarGroup,
  Button,
  Divider,
  Input,
  Checkbox,
  Breadcrumb,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { ChevronLeft, ChevronRight, MinusCircle, Network, Search, User, UserPlus, X } from 'lucide-react';
import type {
  AssetCollaborator,
  CollaboratorAssetType,
  CollaboratorRole,
  CollaboratorType,
} from '@/api/index';
import { COLLABORATOR_ROLE_PRIORITY, ASSET_AVAILABLE_ROLES } from '@/api/index';
import { useCollaboratorCascade } from '@/hooks/useCollaboratorCascade';
import { getCollaborators, addCollaborators, searchOrgUsers } from '@/components/CollaboratorManager/mockData';
import type { OrgUser } from '@/components/CollaboratorManager/mockData';
import CollaboratorRoleSelect from '../CollaboratorRoleSelect';
import { getAvatarColor } from '@/utils/avatarColor';

import './index.less';

const { Text } = Typography;

// ===== Org tree types & data (from CollaboratorAddModal) =====
interface SelectedItem {
  collaborator_type: CollaboratorType;
  collaborator_id: string;
  collaborator_name: string;
  department_name?: string;
  role: CollaboratorRole;
}

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
    {
      id: 'dept-ceo',
      name: 'CEO Office',
      children: [],
      users: [
        { id: 'user-ceo-001', name: 'Michael Chen', department: 'CEO Office' },
      ],
    },
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
              name: 'North China Regional Solution and Delivery Team (Including Project Management and After-Sales Support Group)',
              children: [],
              users: [
                { id: 'user-n-001', name: 'David Liu', department: 'North China Regional Solution and Delivery Team' },
                { id: 'user-n-002', name: 'Wenjie Rong', department: 'North China Regional Solution and Delivery Team' },
                { id: 'user-n-003', name: 'Yue Zhang', department: 'North China Regional Solution and Delivery Team' },
                { id: 'user-n-004', name: 'Alexander Christopher Wellington-Blackstone III', department: 'North China Regional Solution and Delivery Team' },
              ],
            },
          ],
          users: [
            { id: 'user-north-001', name: 'Lei Wang', department: 'North China Regional Business Division' },
          ],
        },
        {
          id: 'dept-east',
          name: 'East China Regional Business Division',
          children: [],
          users: [
            { id: 'user-e-001', name: 'Sophia Sun', department: 'East China Regional Business Division' },
            { id: 'user-e-002', name: 'William Li', department: 'East China Regional Business Division' },
          ],
        },
        {
          id: 'dept-south',
          name: 'South and Southwest China Regional Business Division (Including HK-Macau-TW Expansion Group)',
          children: [],
          users: [
            { id: 'user-s-001', name: 'Emily Zhao', department: 'South and Southwest China Regional Business Division' },
          ],
        },
        {
          id: 'dept-expert',
          name: 'Expert Enablement Group',
          children: [],
          users: [
            { id: 'user-exp-001', name: 'Jack Zhou', department: 'Expert Enablement Group' },
            { id: 'user-exp-002', name: 'Fiona Wu', department: 'Expert Enablement Group' },
          ],
        },
        {
          id: 'dept-prof-service',
          name: 'Professional Services and Customer Success Management Center (Enterprise Customized Implementation Team)',
          children: [],
          users: [
            { id: 'user-ps-001', name: 'Henry Zheng', department: 'Professional Services and Customer Success Management Center' },
            { id: 'user-ps-002', name: 'Josephine Marguerite Beaumont-Richardson', department: 'Professional Services and Customer Success Management Center' },
          ],
        },
      ],
      users: [],
    },
    {
      id: 'dept-rd',
      name: 'R&D Center',
      children: [
        {
          id: 'dept-frontend',
          name: 'Frontend Development Team',
          children: [],
          users: [
            { id: 'user-fe-001', name: 'Charles Feng', department: 'Frontend Development Team' },
            { id: 'user-fe-002', name: 'Linda Chen', department: 'Frontend Development Team' },
            { id: 'user-fe-003', name: 'Peng Xu', department: 'Frontend Development Team' },
          ],
        },
        {
          id: 'dept-backend',
          name: 'Backend Development Team',
          children: [],
          users: [
            { id: 'user-be-001', name: 'Yang Chu', department: 'Backend Development Team' },
            { id: 'user-be-002', name: 'Dong Wei', department: 'Backend Development Team' },
          ],
        },
        {
          id: 'dept-ai',
          name: 'AI Platform and Large Language Model Application R&D Team',
          children: [],
          users: [
            { id: 'user-ai-001', name: 'Ming Qian', department: 'AI Platform and Large Language Model Application R&D Team' },
            { id: 'user-ai-002', name: 'Ray Huang', department: 'AI Platform and Large Language Model Application R&D Team' },
          ],
        },
        {
          id: 'dept-qa',
          name: 'Quality Assurance Team',
          children: [],
          users: [
            { id: 'user-qa-001', name: 'Ting Jiang', department: 'Quality Assurance Team' },
          ],
        },
      ],
      users: [],
    },
    {
      id: 'dept-product',
      name: 'APA Product Division',
      children: [
        {
          id: 'dept-product-rpa',
          name: 'RPA Product Team',
          children: [],
          users: [
            { id: 'user-prpa-001', name: 'Xiao Deng', department: 'RPA Product Team' },
          ],
        },
        {
          id: 'dept-product-idp',
          name: 'IDP Product Team',
          children: [],
          users: [
            { id: 'user-pidp-001', name: 'Jun Cao', department: 'IDP Product Team' },
          ],
        },
        {
          id: 'dept-product-team',
          name: 'Product Team',
          children: [],
          users: [
            { id: 'user-pt-001', name: 'Lihong Fan', department: 'Product Team' },
            { id: 'user-pt-002', name: 'Yichuan Hu', department: 'Product Team' },
            { id: 'user-pt-003', name: 'Xing Yin', department: 'Product Team' },
          ],
        },
      ],
      users: [],
    },
    {
      id: 'dept-digital-worker',
      name: 'Digital Worker Division',
      children: [],
      users: [
        { id: 'user-dw-001', name: 'Xuan Cai', department: 'Digital Worker Division' },
        { id: 'user-dw-002', name: 'Linghui Huang', department: 'Digital Worker Division' },
        { id: 'user-dw-003', name: 'Xiaofeng Lin', department: 'Digital Worker Division' },
      ],
    },
    {
      id: 'dept-marketing',
      name: 'Marketing Department',
      children: [],
      users: [
        { id: 'user-mkt-001', name: 'Lisa Tang', department: 'Marketing Department' },
        { id: 'user-mkt-002', name: 'Bob Shen', department: 'Marketing Department' },
      ],
    },
    {
      id: 'dept-hr',
      name: 'Human Resources Department',
      children: [],
      users: [
        { id: 'user-hr-001', name: 'Fei Liang', department: 'Human Resources Department' },
      ],
    },
    {
      id: 'dept-finance',
      name: 'Finance Department',
      children: [],
      users: [
        { id: 'user-fin-001', name: 'Yun Xie', department: 'Finance Department' },
        { id: 'user-fin-002', name: 'Hua Pan', department: 'Finance Department' },
      ],
    },
  ],
  users: [],
};

const mockOrgTree: DeptNode = {
  id: 'root',
  name: '组织架构',
  children: [mockLaiyeOrg],
  users: [],
};

const findNode = (node: DeptNode, id: string): DeptNode | null => {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
};

const getBreadcrumbPath = (node: DeptNode, targetId: string, path: DeptNode[] = []): DeptNode[] | null => {
  const currentPath = [...path, node];
  if (node.id === targetId) return currentPath;
  if (node.children) {
    for (const child of node.children) {
      const result = getBreadcrumbPath(child, targetId, currentPath);
      if (result) return result;
    }
  }
  return null;
};

const countUsers = (node: DeptNode): number => {
  let count = node.users?.length || 0;
  node.children?.forEach((child) => {
    count += countUsers(child);
  });
  return count;
};

// ===== Main component =====

type PanelView = 'quick' | 'manage' | 'org';

interface CollaboratorPanelProps {
  assetType: CollaboratorAssetType;
  assetId: string;
  context: 'development' | 'scheduling';
  canManage: boolean;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}

const CollaboratorPanel = ({
  assetType,
  assetId,
  context,
  canManage,
  visible,
  onVisibleChange,
}: CollaboratorPanelProps) => {
  const { t } = useTranslation();
  const [panelView, setPanelView] = useState<PanelView>('quick');
  const [previousView, setPreviousView] = useState<'quick' | 'manage'>('quick');
  const [collaborators, setCollaborators] = useState<AssetCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [quickAddingId, setQuickAddingId] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<OrgUser[]>([]);
  const [batchRole, setBatchRole] = useState<CollaboratorRole>(
    ASSET_AVAILABLE_ROLES[assetType]?.[ASSET_AVAILABLE_ROLES[assetType].length - 1] || 'OBSERVER'
  );
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Org view state
  const [orgSearchValue, setOrgSearchValue] = useState('');
  const [orgSelected, setOrgSelected] = useState<SelectedItem[]>([]);
  const [currentDeptId, setCurrentDeptId] = useState('root');

  const { cascadeRemove, cascadeUpdateRole, canCascade, cascadeCount } =
    useCollaboratorCascade(assetType, assetId);

  const loadData = useCallback(async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setCollaborators(getCollaborators(assetType, assetId));
    setLoading(false);
  }, [assetType, assetId]);

  useEffect(() => {
    if (visible) {
      loadData();
      setPanelView('quick');
      setPreviousView('quick');
      setSearchValue('');
      setQuickAddingId(null);
      setSelectedUsers([]);
      setBatchRole(ASSET_AVAILABLE_ROLES[assetType]?.[ASSET_AVAILABLE_ROLES[assetType].length - 1] || 'OBSERVER');
      setExpandedRows(new Set());
      // Reset org state
      setOrgSearchValue('');
      setOrgSelected([]);
      setCurrentDeptId('root');
    }
  }, [visible, loadData, assetType]);

  // ===== Quick/Manage view logic =====
  const searchResults = useMemo(() => {
    if (!searchValue.trim()) return [];
    const existingIds = collaborators.map((c) => c.collaborator_id);
    const selectedIds = selectedUsers.map((u) => u.id);
    return searchOrgUsers(searchValue, [...existingIds, ...selectedIds]);
  }, [searchValue, collaborators, selectedUsers]);

  const filteredData = useMemo(() => {
    if (!searchValue) return collaborators;
    const keyword = searchValue.toLowerCase();
    return collaborators.filter(
      (c) =>
        c.collaborator_name.toLowerCase().includes(keyword) ||
        c.department_name?.toLowerCase().includes(keyword)
    );
  }, [collaborators, searchValue]);

  const handleRoleChange = useCallback(
    async (record: AssetCollaborator, newRole: CollaboratorRole) => {
      cascadeUpdateRole(record.id, newRole);
      setCollaborators(getCollaborators(assetType, assetId));

      const isMixed = record.source === 'MIXED';
      const inheritedSources = record.inheritance_sources || [];
      if (isMixed && inheritedSources.length > 0) {
        const inheritedMaxPriority = Math.max(
          ...inheritedSources.map((s) => COLLABORATOR_ROLE_PRIORITY[s.role] || 0)
        );
        if (COLLABORATOR_ROLE_PRIORITY[newRole] < inheritedMaxPriority) {
          const inheritedMaxRole = inheritedSources.reduce((max, s) =>
            (COLLABORATOR_ROLE_PRIORITY[s.role] || 0) > (COLLABORATOR_ROLE_PRIORITY[max.role] || 0) ? s : max
          ).role;
          Toast.warning(
            t('collaborator.roleLowerWarningToast', {
              directRole: t(`collaborator.roles.${newRole}`),
              inheritedRole: t(`collaborator.roles.${inheritedMaxRole}`),
            })
          );
          return;
        }
      }

      Toast.success(t('collaborator.updateSuccess'));
    },
    [t, cascadeUpdateRole, assetType, assetId]
  );

  const handleRemove = useCallback(
    (record: AssetCollaborator) => {
      const cascadeInfo = canCascade && cascadeCount > 0;
      Modal.confirm({
        title: t('collaborator.removeConfirm.title'),
        icon: <MinusCircle size={16} strokeWidth={2} color="var(--semi-color-danger)" />,
        content: cascadeInfo
          ? t('collaborator.removeConfirm.contentWithCascade', {
              name: record.collaborator_name,
              count: cascadeCount,
            })
          : t('collaborator.removeConfirm.content', { name: record.collaborator_name }),
        okText: t('common.confirm'),
        cancelText: t('common.cancel'),
        okButtonProps: { type: 'primary', theme: 'solid' },
        onOk: async () => {
          cascadeRemove(record.id);
          setCollaborators(getCollaborators(assetType, assetId));
          Toast.success(t('collaborator.removeSuccess'));
        },
      });
    },
    [t, cascadeRemove, canCascade, cascadeCount, assetType, assetId]
  );

  const handleBatchAdd = useCallback(() => {
    if (selectedUsers.length === 0) return;
    addCollaborators(
      assetType,
      assetId,
      selectedUsers.map((user) => ({
        collaborator_type: 'USER' as const,
        collaborator_id: user.id,
        collaborator_name: user.name,
        department_name: user.department,
        role: batchRole,
      }))
    );
    setCollaborators(getCollaborators(assetType, assetId));
    setSelectedUsers([]);
    setSearchValue('');
    setBatchRole(ASSET_AVAILABLE_ROLES[assetType]?.[ASSET_AVAILABLE_ROLES[assetType].length - 1] || 'OBSERVER');
    Toast.success(t('collaborator.quickAddSuccess'));
    onVisibleChange(false);
  }, [assetType, assetId, selectedUsers, batchRole, t, onVisibleChange]);

  const handleSelectUser = useCallback((user: OrgUser) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchValue('');
  }, []);

  const handleDeselectUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const handleQuickAdd = useCallback(
    (record: AssetCollaborator, role: CollaboratorRole) => {
      addCollaborators(assetType, assetId, [
        {
          collaborator_type: record.collaborator_type,
          collaborator_id: record.collaborator_id,
          collaborator_name: record.collaborator_name,
          department_name: record.department_name,
          role,
        },
      ]);
      setCollaborators(getCollaborators(assetType, assetId));
      setQuickAddingId(null);
      Toast.success(t('collaborator.quickAddSuccess'));
    },
    [assetType, assetId, t]
  );

  // Navigate to org view
  const handleOpenOrgView = useCallback((from: 'quick' | 'manage') => {
    setPreviousView(from);
    setPanelView('org');
    setOrgSearchValue('');
    setOrgSelected([]);
    setCurrentDeptId('root');
  }, []);

  // Return from org view
  const handleOrgBack = useCallback(() => {
    setPanelView(previousView);
    setOrgSearchValue('');
    setOrgSelected([]);
    setCurrentDeptId('root');
  }, [previousView]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ===== Org view logic =====
  const orgDefaultRole = useMemo(() => {
    const roles = ASSET_AVAILABLE_ROLES[assetType] || ['USER'];
    return roles.includes('USER') ? 'USER' : roles[roles.length - 1];
  }, [assetType]);

  const existingMap = useMemo(() => {
    const map = new Map<string, CollaboratorRole>();
    collaborators
      .filter((c) => c.source === 'DIRECT')
      .forEach((c) => map.set(c.collaborator_id, c.role));
    collaborators
      .filter((c) => c.source === 'INHERITED')
      .forEach((c) => map.set(c.collaborator_id, c.final_role));
    collaborators
      .filter((c) => c.collaborator_type === 'DEPARTMENT')
      .forEach((c) => map.set(c.collaborator_id, c.role));
    return map;
  }, [collaborators]);

  const currentNode = useMemo(() => {
    return findNode(mockOrgTree, currentDeptId) || mockOrgTree;
  }, [currentDeptId]);

  const breadcrumbPath = useMemo(() => {
    return getBreadcrumbPath(mockOrgTree, currentDeptId) || [mockOrgTree];
  }, [currentDeptId]);

  const orgSearchResults = useMemo(() => {
    if (!orgSearchValue) return null;
    const keyword = orgSearchValue.toLowerCase();
    const users: { id: string; name: string; department: string }[] = [];
    const depts: DeptNode[] = [];

    const traverse = (node: DeptNode) => {
      if (node.id !== 'root' && node.name.toLowerCase().includes(keyword)) {
        depts.push(node);
      }
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
    (id: string) => orgSelected.some((s) => s.collaborator_id === id),
    [orgSelected]
  );

  const toggleOrgUser = useCallback(
    (user: { id: string; name: string; department: string }) => {
      if (existingMap.has(user.id)) return;
      setOrgSelected((prev) => {
        const exists = prev.find((s) => s.collaborator_id === user.id);
        if (exists) return prev.filter((s) => s.collaborator_id !== user.id);
        return [
          ...prev,
          {
            collaborator_type: 'USER' as CollaboratorType,
            collaborator_id: user.id,
            collaborator_name: user.name,
            department_name: user.department,
            role: orgDefaultRole as CollaboratorRole,
          },
        ];
      });
    },
    [existingMap, orgDefaultRole]
  );

  const toggleOrgDept = useCallback(
    (dept: DeptNode) => {
      if (existingMap.has(dept.id)) return;
      setOrgSelected((prev) => {
        const exists = prev.find((s) => s.collaborator_id === dept.id);
        if (exists) return prev.filter((s) => s.collaborator_id !== dept.id);
        return [
          ...prev,
          {
            collaborator_type: 'DEPARTMENT' as CollaboratorType,
            collaborator_id: dept.id,
            collaborator_name: dept.name,
            role: orgDefaultRole as CollaboratorRole,
          },
        ];
      });
    },
    [existingMap, orgDefaultRole]
  );

  const removeOrgSelected = useCallback((id: string) => {
    setOrgSelected((prev) => prev.filter((s) => s.collaborator_id !== id));
  }, []);

  const updateOrgSelectedRole = useCallback((id: string, role: CollaboratorRole) => {
    setOrgSelected((prev) =>
      prev.map((s) => (s.collaborator_id === id ? { ...s, role } : s))
    );
  }, []);

  const handleOrgSubmit = useCallback(async () => {
    if (orgSelected.length === 0) {
      Toast.warning(t('collaborator.addModal.noSelection'));
      return;
    }
    addCollaborators(assetType, assetId, orgSelected);
    setCollaborators(getCollaborators(assetType, assetId));
    Toast.success(t('collaborator.addModal.success', { count: orgSelected.length }));
    setOrgSelected([]);
    setOrgSearchValue('');
    setCurrentDeptId('root');
    // Return to previous view after success
    setPanelView(previousView);
  }, [orgSelected, t, assetType, assetId, previousView]);

  const navigateToDept = useCallback((deptId: string) => {
    setCurrentDeptId(deptId);
    setOrgSearchValue('');
  }, []);

  const getExistingRoleLabel = (id: string): string | null => {
    const role = existingMap.get(id);
    if (!role) return null;
    return t('collaborator.addModal.grantedPermission', {
      role: t(`collaborator.roles.${role}`),
    });
  };

  // ===== Render helpers =====

  // 渲染权限来源
  const renderSource = (record: AssetCollaborator) => {
    const sources = record.inheritance_sources || [];
    const isMixed = record.source === 'MIXED';
    if (sources.length === 0 && !isMixed) return null;

    const isExpanded = expandedRows.has(record.id);
    const sortedSources = [...sources].sort(
      (a, b) => (COLLABORATOR_ROLE_PRIORITY[b.role] || 0) - (COLLABORATOR_ROLE_PRIORITY[a.role] || 0)
    );
    const topSources = sortedSources.slice(0, 3);
    const remainCount = Math.max(0, sortedSources.length - 3);
    const allRoleCount = (isMixed && record.role ? 1 : 0) + sortedSources.length;
    const inheritedItems = isExpanded ? topSources : topSources.slice(0, 1);
    const effectiveText = allRoleCount > 1
      ? t('collaborator.source.effectiveRole', {
          role: t(`collaborator.roles.${record.final_role}`),
        })
      : null;

    return (
      <div className="collaborator-panel-source-detail">
        {isMixed && record.role && (
          <div className="collaborator-panel-source-detail-item source-direct">
            <Text size="small" type="tertiary">
              {t('collaborator.source.direct')} → {t(`collaborator.roles.${record.role}`)}
            </Text>
          </div>
        )}
        {inheritedItems.map((src, idx) => {
          const sourceName = src.source_type === 'INHERITED_HIERARCHY'
            ? t('collaborator.source.inheritedFromGroup', { name: src.asset_name })
            : t('collaborator.source.inheritedFromProcess', { name: src.asset_name });
          return (
            <div key={idx} className="collaborator-panel-source-detail-item">
              <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }} className="source-name">
                {sourceName}
              </Text>
              <Text size="small" type="tertiary" className="source-role">
                → {t(`collaborator.roles.${src.role}`)}
              </Text>
            </div>
          );
        })}
        {isExpanded && remainCount > 0 && (
          <div className="collaborator-panel-source-detail-item">
            <Text size="small" type="tertiary">
              {t('collaborator.source.remainingCount', { count: remainCount })}
            </Text>
          </div>
        )}
        {isExpanded && effectiveText && (
          <div className="collaborator-panel-source-detail-item">
            <Text size="small" type="tertiary">{effectiveText}</Text>
          </div>
        )}
        {topSources.length > 1 && (
          <span
            className="collaborator-panel-source-detail-toggle"
            onClick={() => toggleExpand(record.id)}
          >
            {isExpanded
              ? t('common.collapse')
              : t('collaborator.source.inheritedFromCount', { count: sortedSources.length })}
          </span>
        )}
      </div>
    );
  };

  // 渲染单个协作者行
  const renderCollaboratorItem = (record: AssetCollaborator) => {
    const isInherited = record.source === 'INHERITED' || (record.inheritance_sources && record.inheritance_sources.length > 0 && record.source !== 'DIRECT' && record.source !== 'MIXED');
    const isDisabled = record.is_owner || isInherited || !canManage;
    const canRemoveItem = !record.is_owner && !isInherited && canManage;

    const roleSelect = (
      <CollaboratorRoleSelect
        value={record.final_role}
        onChange={(role) => handleRoleChange(record, role)}
        assetType={assetType}
        disabled={isDisabled}
        onRemove={canRemoveItem ? () => handleRemove(record) : undefined}
      />
    );

    const roleEl = isInherited && !record.is_owner ? (
      <Popover
        content={
          <div className="collaborator-panel-inherited-popover">
            <div className="collaborator-panel-inherited-popover-text">
              {t('collaborator.inheritedRoleHint')}
            </div>
            <div className="collaborator-panel-inherited-popover-hint">
              {t('collaborator.inheritedRoleMaxHint')}
            </div>
            {canManage && (
              quickAddingId === record.id ? (
                <div style={{ marginTop: 8 }}>
                  <CollaboratorRoleSelect
                    value={record.final_role}
                    onChange={(role) => handleQuickAdd(record, role)}
                    assetType={assetType}
                    disabled={false}
                    size="small"
                  />
                </div>
              ) : (
                <Button
                  size="small"
                  theme="solid"
                  type="primary"
                  onClick={() => setQuickAddingId(record.id)}
                  style={{ marginTop: 8, width: '100%' }}
                >
                  {t('collaborator.actions.quickAdd')}
                </Button>
              )
            )}
          </div>
        }
        position="top"
        showArrow
        trigger="hover"
        onVisibleChange={(v) => {
          if (!v) setQuickAddingId(null);
        }}
      >
        {roleSelect}
      </Popover>
    ) : roleSelect;

    return (
      <div key={record.id} className="collaborator-panel-item">
        <div className="collaborator-panel-item-left">
          <Avatar
            size="small"
            style={
              record.collaborator_type === 'DEPARTMENT'
                ? { backgroundColor: 'var(--semi-color-fill-1)', color: 'var(--semi-color-text-2)' }
                : { backgroundColor: '#000000', color: '#ffffff' }
            }
          >
            {record.collaborator_type === 'DEPARTMENT' ? (
              <Network size={16} strokeWidth={2} />
            ) : (
              record.collaborator_name.slice(0, 1)
            )}
          </Avatar>
          <div className="collaborator-panel-item-info">
            <div className="collaborator-panel-item-name-row">
              <Text ellipsis={{ showTooltip: true }} className="collaborator-panel-item-name">
                {record.collaborator_name}
              </Text>
              {record.is_owner && (
                <Tag size="small" color="blue" className="collaborator-panel-owner-tag">
                  {t('collaborator.owner')}
                </Tag>
              )}
            </div>
            {record.department_name && record.collaborator_type === 'USER' && (
              <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }}>
                {record.department_name}
              </Text>
            )}
            {renderSource(record)}
          </div>
        </div>
        <div className="collaborator-panel-item-right">
          {roleEl}
        </div>
      </div>
    );
  };

  // 渲染搜索结果中的用户行
  const renderSearchResultItem = (user: OrgUser) => {
    return (
      <div
        key={user.id}
        className="collaborator-panel-item"
        style={{ cursor: 'pointer' }}
        onClick={() => handleSelectUser(user)}
      >
        <div className="collaborator-panel-item-left">
          <Avatar
            size="small"
            style={{ backgroundColor: '#000000', color: '#ffffff' }}
          >
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
  };

  // 头像组 + 人数
  const renderAvatarGroup = () => (
    <div
      className="collaborator-panel-header-right"
      onClick={() => { setPanelView('manage'); setSearchValue(''); setSelectedUsers([]); }}
    >
      <AvatarGroup size="extra-extra-small" maxCount={3}>
        {collaborators.slice(0, 3).map((c) => (
          <Avatar
            key={c.id}
            style={
              c.collaborator_type === 'USER'
                ? { backgroundColor: '#000000', color: '#ffffff' }
                : { backgroundColor: 'var(--semi-color-fill-1)', color: 'var(--semi-color-text-2)' }
            }
          >
            {c.collaborator_type === 'DEPARTMENT' ? (
              <Network size={16} strokeWidth={2} />
            ) : (
              c.collaborator_name.slice(0, 1)
            )}
          </Avatar>
        ))}
      </AvatarGroup>
      <Tag size="small" type="ghost" className="collaborator-panel-count-tag">
        +{collaborators.length}
      </Tag>
      <ChevronRight size={16} strokeWidth={2} />
    </div>
  );

  // Search box
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
          placeholder={selectedUsers.length === 0 ? t('collaborator.addModal.searchPlaceholder') : ''}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
      {selectedUsers.length > 0 && (
        <CollaboratorRoleSelect
          value={batchRole}
          onChange={(role) => setBatchRole(role)}
          assetType={assetType}
          size="small"
        />
      )}
    </div>
  );

  // Quick view content
  const renderQuickView = () => (
    <div className="collaborator-panel-quick">
      {renderSearchBox()}

      {searchValue.trim() && (
        <div className="collaborator-panel-search-results">
          {searchResults.length > 0 ? (
            searchResults.map((user) => renderSearchResultItem(user))
          ) : (
            <div className="collaborator-panel-search-empty">
              <Text type="tertiary" size="small">{t('collaborator.panel.noSearchResults')}</Text>
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
        <div style={{ paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="tertiary"
            icon={<Network size={16} strokeWidth={2} />}
            onClick={() => handleOpenOrgView('quick')}
          >
            {t('collaborator.panel.addFromOrg')}
          </Button>
        </div>
      ) : null}
    </div>
  );

  // Manage view content
  const renderManageView = () => (
    <div className="collaborator-panel-manage">
      <div className="collaborator-panel-manage-subtitle">
        <Text strong style={{ fontSize: 14 }}>
          {t('collaborator.panel.allAccessUsers')}
        </Text>
      </div>
      <div className="collaborator-panel-manage-list">
        {collaborators.map((record) => renderCollaboratorItem(record))}
        {collaborators.length === 0 && (
          <div className="collaborator-panel-manage-empty">
            <Text type="tertiary">{t('collaborator.empty')}</Text>
          </div>
        )}
      </div>
      {canManage && (
        <div className="collaborator-panel-manage-add" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="tertiary"
            icon={<UserPlus size={14} />}
            onClick={() => handleOpenOrgView('manage')}
          >
            {t('collaborator.actions.addCollaborator')}
          </Button>
        </div>
      )}
    </div>
  );

  // ===== Org view render helpers =====
  const renderOrgUserItem = (user: { id: string; name: string; department: string }) => {
    const disabled = existingMap.has(user.id);
    const checked = isOrgSelected(user.id);
    const existingLabel = getExistingRoleLabel(user.id);

    return (
      <div
        key={user.id}
        className={`collaborator-add-modal-left-item ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && toggleOrgUser(user)}
      >
        <Checkbox checked={checked} disabled={disabled} />
        <User size={14} strokeWidth={2} className="collaborator-add-modal-left-item-icon" />
        <div className="collaborator-add-modal-left-item-info">
          <Text style={{ fontSize: 14 }}>{user.name}</Text>
        </div>
        {disabled && existingLabel && (
          <span className="collaborator-add-modal-left-item-existing">
            {existingLabel}
          </span>
        )}
      </div>
    );
  };

  const renderOrgDeptItem = (dept: DeptNode) => {
    const disabled = existingMap.has(dept.id);
    const checked = isOrgSelected(dept.id);
    const existingLabel = getExistingRoleLabel(dept.id);
    const hasChildren = (dept.children && dept.children.length > 0) || (dept.users && dept.users.length > 0);

    return (
      <div
        key={dept.id}
        className={`collaborator-add-modal-left-item ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && toggleOrgDept(dept)}
      >
        <Checkbox checked={checked} disabled={disabled} />
        <Network size={16} strokeWidth={2} className="collaborator-add-modal-left-item-icon" />
        <div className="collaborator-add-modal-left-item-name">
          <Text style={{ fontSize: 14 }} ellipsis={{ showTooltip: true }}>
            {dept.name}
          </Text>
        </div>
        {disabled && existingLabel && (
          <span className="collaborator-add-modal-left-item-existing">
            {existingLabel}
          </span>
        )}
        {!disabled && hasChildren && (
          <span
            className="collaborator-add-modal-left-item-drill"
            onClick={(e) => { e.stopPropagation(); navigateToDept(dept.id); }}
          >
            {t('collaborator.addModal.drillDown')}
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
              {orgSearchResults.users.map((user) => renderOrgUserItem(user))}
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
        {users.map((user) => renderOrgUserItem(user))}
        {children.length === 0 && users.length === 0 && (
          <div className="collaborator-add-modal-left-empty">
            {t('collaborator.addModal.emptyDept')}
          </div>
        )}
      </div>
    );
  };

  // Org view content
  const renderOrgView = () => (
    <div className="collaborator-panel-org">
      <div className="collaborator-add-modal-content">
        <div className="collaborator-add-modal-left">
          <div className="collaborator-add-modal-left-search">
            <Input
              prefix={<IconSearchStroked />}
              placeholder={t('collaborator.addModal.searchPlaceholder')}
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
          <div className="collaborator-add-modal-left-tree">
            {renderOrgLeftContent()}
          </div>
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
                <div key={item.collaborator_id} className="collaborator-add-modal-right-item">
                  <div className="collaborator-add-modal-right-item-info">
                    <span className="collaborator-add-modal-right-item-icon">
                      {item.collaborator_type === 'DEPARTMENT' ? (
                        <Network size={16} strokeWidth={2} />
                      ) : (
                        <User size={14} strokeWidth={2} />
                      )}
                    </span>
                    <Text style={{ fontSize: 14 }} ellipsis={{ showTooltip: true }}>
                      {item.collaborator_name}
                    </Text>
                  </div>
                  <div className="collaborator-add-modal-right-item-actions">
                    <CollaboratorRoleSelect
                      value={item.role}
                      onChange={(role) => updateOrgSelectedRole(item.collaborator_id, role)}
                      assetType={assetType}
                      size="small"
                    />
                    <Button
                      icon={<X size={16} strokeWidth={2} />}
                      theme="borderless"
                      size="small"
                      className="collaborator-add-modal-right-item-remove"
                      onClick={() => removeOrgSelected(item.collaborator_id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer for org view */}
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

  // Modal title
  const modalTitle = (
    <div className="collaborator-panel-modal-title">
      <div className="collaborator-panel-modal-title-left">
        {panelView === 'quick' ? (
          <span className="collaborator-panel-header-title">
            {t('collaborator.actions.addCollaborator')}
          </span>
        ) : panelView === 'manage' ? (
          <div
            className="collaborator-panel-manage-back"
            onClick={() => setPanelView('quick')}
          >
            <ChevronLeft size={16} strokeWidth={2} />
            <span>{t('collaborator.panel.manageTitle')}</span>
          </div>
        ) : (
          <div
            className="collaborator-panel-manage-back"
            onClick={handleOrgBack}
          >
            <ChevronLeft size={16} strokeWidth={2} />
            <span>{t('collaborator.addModal.title')}</span>
          </div>
        )}
      </div>
      <div className="collaborator-panel-modal-title-right">
        {renderAvatarGroup()}
        <Divider layout="vertical" style={{ height: 16, margin: '0 4px' }} />
        <Button
          icon={<X size={16} />}
          theme="borderless"
          type="tertiary"
          size="small"
          onClick={() => onVisibleChange(false)}
        />
      </div>
    </div>
  );

  return (
    <Modal
      visible={visible}
      onCancel={() => onVisibleChange(false)}
      footer={null}
      closable={false}
      title={modalTitle}
      width={panelView === 'quick' ? 660 : 900}
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

export default CollaboratorPanel;
