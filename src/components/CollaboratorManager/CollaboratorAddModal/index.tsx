import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Input,
  Button,
  Typography,
  Checkbox,
  Toast,
  Breadcrumb,
} from '@douyinfe/semi-ui';
import { Building2, ChevronRight, Network, User, X } from 'lucide-react';
import type {
  AssetCollaborator,
  CollaboratorAssetType,
  CollaboratorRole,
  CollaboratorType,
} from '@/api/index';
import { ASSET_AVAILABLE_ROLES } from '@/api/index';
import CollaboratorRoleSelect from '../CollaboratorRoleSelect';

import './index.less';

const { Text } = Typography;

interface SelectedItem {
  collaborator_type: CollaboratorType;
  collaborator_id: string;
  collaborator_name: string;
  department_name?: string;
  role: CollaboratorRole;
}

// Mock 组织架构树数据
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

// 虚拟根节点，包含"来也科技"作为可选部门
const mockOrgTree: DeptNode = {
  id: 'root',
  name: '组织架构',
  children: [mockLaiyeOrg],
  users: [],
};

// 扁平化查找节点
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

// 获取面包屑路径
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

// 计算部门下的总人数（含子部门）
const countUsers = (node: DeptNode): number => {
  let count = node.users?.length || 0;
  node.children?.forEach((child) => {
    count += countUsers(child);
  });
  return count;
};

interface CollaboratorAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assetType: CollaboratorAssetType;
  assetId: string;
  existingCollaborators: AssetCollaborator[];
}

const CollaboratorAddModal = ({
  visible,
  onClose,
  onSuccess,
  assetType,
  assetId,
  existingCollaborators,
}: CollaboratorAddModalProps) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [currentDeptId, setCurrentDeptId] = useState('root');

  // 该资产类型的默认角色（取可用角色中的 USER，若无则取最后一个）
  const defaultRole = useMemo(() => {
    const roles = ASSET_AVAILABLE_ROLES[assetType] || ['USER'];
    return roles.includes('USER') ? 'USER' : roles[roles.length - 1];
  }, [assetType]);

  // 已存在的协作者 Map（id -> role）
  const existingMap = useMemo(() => {
    const map = new Map<string, CollaboratorRole>();
    existingCollaborators
      .filter((c) => c.source === 'DIRECT')
      .forEach((c) => map.set(c.collaborator_id, c.role));
    // 继承来源的协作者也标记为已添加
    existingCollaborators
      .filter((c) => c.source === 'INHERITED')
      .forEach((c) => map.set(c.collaborator_id, c.final_role));
    // 部门协作者
    existingCollaborators
      .filter((c) => c.collaborator_type === 'DEPARTMENT')
      .forEach((c) => map.set(c.collaborator_id, c.role));
    return map;
  }, [existingCollaborators]);

  // 当前部门节点
  const currentNode = useMemo(() => {
    return findNode(mockOrgTree, currentDeptId) || mockOrgTree;
  }, [currentDeptId]);

  // 面包屑路径
  const breadcrumbPath = useMemo(() => {
    return getBreadcrumbPath(mockOrgTree, currentDeptId) || [mockOrgTree];
  }, [currentDeptId]);

  // 搜索模式下的扁平结果
  const searchResults = useMemo(() => {
    if (!searchValue) return null;
    const keyword = searchValue.toLowerCase();
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
  }, [searchValue]);

  const isSelected = useCallback(
    (id: string) => selected.some((s) => s.collaborator_id === id),
    [selected]
  );

  const toggleUser = useCallback(
    (user: { id: string; name: string; department: string }) => {
      if (existingMap.has(user.id)) return;
      setSelected((prev) => {
        const exists = prev.find((s) => s.collaborator_id === user.id);
        if (exists) return prev.filter((s) => s.collaborator_id !== user.id);
        return [
          ...prev,
          {
            collaborator_type: 'USER' as CollaboratorType,
            collaborator_id: user.id,
            collaborator_name: user.name,
            department_name: user.department,
            role: defaultRole as CollaboratorRole,
          },
        ];
      });
    },
    [existingMap, defaultRole]
  );

  const toggleDept = useCallback(
    (dept: DeptNode) => {
      if (existingMap.has(dept.id)) return;
      setSelected((prev) => {
        const exists = prev.find((s) => s.collaborator_id === dept.id);
        if (exists) return prev.filter((s) => s.collaborator_id !== dept.id);
        return [
          ...prev,
          {
            collaborator_type: 'DEPARTMENT' as CollaboratorType,
            collaborator_id: dept.id,
            collaborator_name: dept.name,
            role: defaultRole as CollaboratorRole,
          },
        ];
      });
    },
    [existingMap, defaultRole]
  );

  const removeSelected = useCallback((id: string) => {
    setSelected((prev) => prev.filter((s) => s.collaborator_id !== id));
  }, []);

  const updateSelectedRole = useCallback((id: string, role: CollaboratorRole) => {
    setSelected((prev) =>
      prev.map((s) => (s.collaborator_id === id ? { ...s, role } : s))
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selected.length === 0) {
      Toast.warning(t('collaborator.addModal.noSelection'));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    Toast.success(t('collaborator.addModal.success', { count: selected.length }));
    setSelected([]);
    setSearchValue('');
    setCurrentDeptId('root');
    onSuccess();
  }, [selected, t, onSuccess]);

  const handleClose = useCallback(() => {
    setSelected([]);
    setSearchValue('');
    setCurrentDeptId('root');
    onClose();
  }, [onClose]);

  const navigateToDept = useCallback((deptId: string) => {
    setCurrentDeptId(deptId);
    setSearchValue('');
  }, []);

  // 获取已授予权限的显示文本
  const getExistingRoleLabel = (id: string): string | null => {
    const role = existingMap.get(id);
    if (!role) return null;
    return t('collaborator.addModal.grantedPermission', {
      role: t(`collaborator.roles.${role}`),
    });
  };

  // 渲染用户行 - 点击整行可选中
  const renderUserItem = (user: { id: string; name: string; department: string }) => {
    const disabled = existingMap.has(user.id);
    const checked = isSelected(user.id);
    const existingLabel = getExistingRoleLabel(user.id);

    return (
      <div
        key={user.id}
        className={`collaborator-add-modal-left-item ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && toggleUser(user)}
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

  // 渲染部门行 - 点击整行可选中
  const renderDeptItem = (dept: DeptNode) => {
    const disabled = existingMap.has(dept.id);
    const checked = isSelected(dept.id);
    const existingLabel = getExistingRoleLabel(dept.id);
    const userCount = countUsers(dept);
    const hasChildren = (dept.children && dept.children.length > 0) || (dept.users && dept.users.length > 0);

    return (
      <div
        key={dept.id}
        className={`collaborator-add-modal-left-item ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && toggleDept(dept)}
      >
        <Checkbox
          checked={checked}
          disabled={disabled}
        />
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

  // 渲染左侧内容
  const renderLeftContent = () => {
    if (searchResults) {
      return (
        <div className="collaborator-add-modal-left-list">
          {searchResults.depts.length > 0 && (
            <>
              <div className="collaborator-add-modal-left-section-title">
              <Network size={16} strokeWidth={2} />
                {t('collaborator.addModal.departments')}
              </div>
              {searchResults.depts.map((dept) => renderDeptItem(dept))}
            </>
          )}
          {searchResults.users.length > 0 && (
            <>
              <div className="collaborator-add-modal-left-section-title">
                <User size={14} strokeWidth={2} />
                {t('collaborator.addModal.users')}
              </div>
              {searchResults.users.map((user) => renderUserItem(user))}
            </>
          )}
          {searchResults.depts.length === 0 && searchResults.users.length === 0 && (
            <div className="collaborator-add-modal-left-empty">
              {t('collaborator.addModal.noResults')}
            </div>
          )}
        </div>
      );
    }

    // 部门树浏览模式
    const children = currentNode.children || [];
    const users = currentNode.users || [];

    return (
      <div className="collaborator-add-modal-left-list">
        {children.map((dept) => renderDeptItem(dept))}
        {users.map((user) => renderUserItem(user))}
        {children.length === 0 && users.length === 0 && (
          <div className="collaborator-add-modal-left-empty">
            {t('collaborator.addModal.emptyDept')}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      title={t('collaborator.addModal.title')}
      visible={visible}
      onCancel={handleClose}
      width={900}
      centered
      maskClosable={false}
      className="collaborator-add-modal"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button theme="light" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button theme="solid" onClick={handleSubmit} disabled={selected.length === 0}>
            {t('common.confirm')}
          </Button>
        </div>
      }
    >
      <div className="collaborator-add-modal-content">
        {/* 左栏: 组织架构树浏览 */}
        <div className="collaborator-add-modal-left">
          <div className="collaborator-add-modal-left-search">
            <Input
              prefix={<IconSearchStroked />}
              placeholder={t('collaborator.addModal.searchPlaceholder')}
              value={searchValue}
              onChange={setSearchValue}
              showClear
            />
          </div>

          {/* 面包屑导航 - 始终显示 */}
          {!searchResults && (
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
            {renderLeftContent()}
          </div>
        </div>

        {/* 右栏: 已选协作者列表 */}
        <div className="collaborator-add-modal-right">
          <div className="collaborator-add-modal-right-header">
            {t('collaborator.addModal.selectedTitle')}：{selected.length} {t('collaborator.addModal.unit')}
          </div>
          {selected.length === 0 ? (
            <div className="collaborator-add-modal-right-empty">
              {t('collaborator.addModal.emptySelection')}
            </div>
          ) : (
            <div className="collaborator-add-modal-right-list">
              {selected.map((item) => (
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
                      onChange={(role) => updateSelectedRole(item.collaborator_id, role)}
                      assetType={assetType}
                      size="small"
                    />
                    <Button
                      icon={<X size={16} strokeWidth={2} />}
                      theme="borderless"
                      size="small"
                      className="collaborator-add-modal-right-item-remove"
                      onClick={() => removeSelected(item.collaborator_id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CollaboratorAddModal;
