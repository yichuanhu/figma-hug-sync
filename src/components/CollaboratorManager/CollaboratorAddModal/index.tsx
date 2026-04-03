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
import {
  IconSearch,
  IconClose,
  IconChevronRight,
} from '@douyinfe/semi-icons';
import { UserCircle, Building2 } from 'lucide-react';
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

const mockOrgTree: DeptNode = {
  id: 'root',
  name: '来也科技',
  children: [
    {
      id: 'dept-001',
      name: '大客户业务中心',
      children: [
        { id: 'dept-011', name: 'Admin Team', users: [
          { id: 'user-101', name: '张三', department: 'Admin Team' },
          { id: 'user-102', name: '李四', department: 'Admin Team' },
        ]},
        { id: 'dept-012', name: '北区BU', users: [
          { id: 'user-201', name: '王五', department: '北区BU' },
          { id: 'user-202', name: '赵六', department: '北区BU' },
        ]},
        { id: 'dept-013', name: '东区BU', users: [
          { id: 'user-301', name: '钱七', department: '东区BU' },
        ]},
        { id: 'dept-014', name: '南区BU', users: [
          { id: 'user-401', name: '孙八', department: '南区BU' },
        ]},
        { id: 'dept-015', name: '电力BU', users: [] },
        { id: 'dept-016', name: '东南亚BU', users: [] },
        { id: 'dept-017', name: '赋能专家组', users: [
          { id: 'user-501', name: '周九', department: '赋能专家组' },
          { id: 'user-502', name: '吴十', department: '赋能专家组' },
        ]},
        { id: 'dept-018', name: '专业服务部', users: [
          { id: 'user-601', name: '郑十一', department: '专业服务部' },
        ]},
      ],
      users: [],
    },
    {
      id: 'dept-002',
      name: '研发中心',
      children: [
        { id: 'dept-021', name: '前端组', users: [
          { id: 'user-701', name: '冯十二', department: '前端组' },
          { id: 'user-702', name: '陈十三', department: '前端组' },
        ]},
        { id: 'dept-022', name: '后端组', users: [
          { id: 'user-801', name: '褚十四', department: '后端组' },
        ]},
      ],
      users: [],
    },
    {
      id: 'dept-003',
      name: '市场部',
      users: [
        { id: 'user-004', name: '赵六', department: '市场部' },
        { id: 'user-005', name: '钱七', department: '运营部' },
      ],
    },
    {
      id: 'dept-004',
      name: '运营部',
      users: [
        { id: 'user-006', name: '孙八', department: 'IT部' },
      ],
    },
    {
      id: 'dept-005',
      name: 'IT部',
      users: [
        { id: 'user-007', name: '周九', department: '研发部' },
        { id: 'user-008', name: '吴十', department: '财务部' },
      ],
    },
  ],
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

  // 已存在的协作者ID（直接分配的）
  const existingIds = useMemo(() => {
    return new Set(
      existingCollaborators
        .filter((c) => c.source === 'DIRECT')
        .map((c) => c.collaborator_id)
    );
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
      if (existingIds.has(user.id)) return;
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
    [existingIds, defaultRole]
  );

  const toggleDept = useCallback(
    (dept: DeptNode) => {
      if (existingIds.has(dept.id)) return;
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
    [existingIds, defaultRole]
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

  // 渲染左侧内容：部门树浏览 or 搜索结果
  const renderLeftContent = () => {
    // 搜索模式
    if (searchResults) {
      return (
        <div className="collaborator-add-modal-left-list">
          {searchResults.depts.length > 0 && (
            <>
              <div className="collaborator-add-modal-left-section-title">
                <Building2 size={14} strokeWidth={2} />
                {t('collaborator.addModal.departments')}
              </div>
              {searchResults.depts.map((dept) => {
                const disabled = existingIds.has(dept.id);
                const checked = isSelected(dept.id);
                return (
                  <div
                    key={dept.id}
                    className={`collaborator-add-modal-left-item ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleDept(dept)}
                    />
                    <Building2 size={16} strokeWidth={2} className="collaborator-add-modal-left-item-icon" />
                    <Text size="small" className="collaborator-add-modal-left-item-name">{dept.name}</Text>
                    {disabled && (
                      <span className="collaborator-add-modal-left-item-existing">
                        {t('collaborator.addModal.alreadyAdded')}
                      </span>
                    )}
                    {!disabled && dept.children && dept.children.length > 0 && (
                      <span
                        className="collaborator-add-modal-left-item-drill"
                        onClick={(e) => { e.stopPropagation(); navigateToDept(dept.id); }}
                      >
                        {t('collaborator.addModal.drillDown')} <IconChevronRight size="small" />
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}
          {searchResults.users.length > 0 && (
            <>
              <div className="collaborator-add-modal-left-section-title">
                <UserCircle size={14} strokeWidth={2} />
                {t('collaborator.addModal.users')}
              </div>
              {searchResults.users.map((user) => {
                const disabled = existingIds.has(user.id);
                const checked = isSelected(user.id);
                return (
                  <div
                    key={user.id}
                    className={`collaborator-add-modal-left-item ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && toggleUser(user)}
                  >
                    <Checkbox checked={checked} disabled={disabled} />
                    <UserCircle size={16} strokeWidth={2} className="collaborator-add-modal-left-item-icon" />
                    <div className="collaborator-add-modal-left-item-info">
                      <Text size="small">{user.name}</Text>
                      <span className="collaborator-add-modal-left-item-dept">{user.department}</span>
                    </div>
                    {disabled && (
                      <span className="collaborator-add-modal-left-item-existing">
                        {t('collaborator.addModal.alreadyAdded')}
                      </span>
                    )}
                  </div>
                );
              })}
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
        {children.map((dept) => {
          const disabled = existingIds.has(dept.id);
          const checked = isSelected(dept.id);
          return (
            <div
              key={dept.id}
              className={`collaborator-add-modal-left-item ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onChange={() => toggleDept(dept)}
              />
              <Building2 size={16} strokeWidth={2} className="collaborator-add-modal-left-item-icon" />
              <Text size="small" className="collaborator-add-modal-left-item-name">{dept.name}</Text>
              {disabled && (
                <span className="collaborator-add-modal-left-item-existing">
                  {t('collaborator.addModal.alreadyAdded')}
                </span>
              )}
              {!disabled && (dept.children && dept.children.length > 0) && (
                <span
                  className="collaborator-add-modal-left-item-drill"
                  onClick={(e) => { e.stopPropagation(); navigateToDept(dept.id); }}
                >
                  {t('collaborator.addModal.drillDown')} <IconChevronRight size="small" />
                </span>
              )}
            </div>
          );
        })}
        {users.map((user) => {
          const disabled = existingIds.has(user.id);
          const checked = isSelected(user.id);
          return (
            <div
              key={user.id}
              className={`collaborator-add-modal-left-item ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => !disabled && toggleUser(user)}
            >
              <Checkbox checked={checked} disabled={disabled} />
              <UserCircle size={16} strokeWidth={2} className="collaborator-add-modal-left-item-icon" />
              <div className="collaborator-add-modal-left-item-info">
                <Text size="small">{user.name}</Text>
                <span className="collaborator-add-modal-left-item-dept">{user.department}</span>
              </div>
              {disabled && (
                <span className="collaborator-add-modal-left-item-existing">
                  {t('collaborator.addModal.alreadyAdded')}
                </span>
              )}
            </div>
          );
        })}
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
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button theme="light" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button theme="solid" onClick={handleSubmit} disabled={selected.length === 0}>
            {t('collaborator.addModal.submit', { count: selected.length })}
          </Button>
        </div>
      }
    >
      <div className="collaborator-add-modal-content">
        {/* 左栏: 部门树浏览 */}
        <div className="collaborator-add-modal-left">
          <div className="collaborator-add-modal-left-search">
            <Input
              prefix={<IconSearch />}
              placeholder={t('collaborator.addModal.searchPlaceholder')}
              value={searchValue}
              onChange={setSearchValue}
              showClear
            />
          </div>

          {/* 面包屑导航 */}
          {!searchResults && breadcrumbPath.length > 1 && (
            <div className="collaborator-add-modal-left-breadcrumb">
              <Breadcrumb compact={false}>
                {breadcrumbPath.map((node, index) => (
                  <Breadcrumb.Item
                    key={node.id}
                    onClick={index < breadcrumbPath.length - 1 ? () => navigateToDept(node.id) : undefined}
                  >
                    {node.name}
                  </Breadcrumb.Item>
                ))}
              </Breadcrumb>
            </div>
          )}

          <div className="collaborator-add-modal-left-tree">
            {renderLeftContent()}
          </div>
        </div>

        {/* 右栏: 已选列表（带角色选择） */}
        <div className="collaborator-add-modal-right">
          <div className="collaborator-add-modal-right-header">
            {t('collaborator.addModal.selectedCount', { count: selected.length })}
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
                        <Building2 size={16} strokeWidth={2} />
                      ) : (
                        <UserCircle size={16} strokeWidth={2} />
                      )}
                    </span>
                    <Text size="small" ellipsis={{ showTooltip: true }} style={{ maxWidth: 100 }}>
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
                      icon={<IconClose />}
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
