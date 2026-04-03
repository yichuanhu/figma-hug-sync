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
  IconFlowChartStroked,
} from '@douyinfe/semi-icons';
import { User, Building2 } from 'lucide-react';
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
      id: 'dept-ceo',
      name: 'CEO办公室',
      children: [],
      users: [
        { id: 'user-ceo-001', name: '陈明远', department: 'CEO办公室' },
      ],
    },
    {
      id: 'dept-enterprise',
      name: '大客户业务中心',
      children: [
        {
          id: 'dept-north',
          name: '华北区域事业部',
          children: [
            {
              id: 'dept-north-solution',
              name: '华北区域解决方案与交付团队（含项目管理及售后支持组）',
              children: [],
              users: [
                { id: 'user-n-001', name: '刘毅', department: '华北区域解决方案与交付团队（含项目管理及售后支持组）' },
                { id: 'user-n-002', name: '荣文杰', department: '华北区域解决方案与交付团队（含项目管理及售后支持组）' },
                { id: 'user-n-003', name: '张越', department: '华北区域解决方案与交付团队（含项目管理及售后支持组）' },
                { id: 'user-n-004', name: '郑曙光', department: '华北区域解决方案与交付团队（含项目管理及售后支持组）' },
              ],
            },
          ],
          users: [
            { id: 'user-north-001', name: '王磊', department: '华北区域事业部' },
          ],
        },
        {
          id: 'dept-east',
          name: '华东区域事业部',
          children: [],
          users: [
            { id: 'user-e-001', name: '孙茜', department: '华东区域事业部' },
            { id: 'user-e-002', name: '李伟', department: '华东区域事业部' },
          ],
        },
        {
          id: 'dept-south',
          name: '华南及西南区域事业部（含港澳台业务拓展组）',
          children: [],
          users: [
            { id: 'user-s-001', name: '赵敏', department: '华南及西南区域事业部（含港澳台业务拓展组）' },
          ],
        },
        {
          id: 'dept-expert',
          name: '专家赋能组',
          children: [],
          users: [
            { id: 'user-exp-001', name: '周杰', department: '专家赋能组' },
            { id: 'user-exp-002', name: '吴芳', department: '专家赋能组' },
          ],
        },
        {
          id: 'dept-prof-service',
          name: '专业服务与客户成功管理中心（大客户定制化实施团队）',
          children: [],
          users: [
            { id: 'user-ps-001', name: '郑浩', department: '专业服务与客户成功管理中心（大客户定制化实施团队）' },
            { id: 'user-ps-002', name: '马小玲', department: '专业服务与客户成功管理中心（大客户定制化实施团队）' },
          ],
        },
      ],
      users: [],
    },
    {
      id: 'dept-rd',
      name: '研发中心',
      children: [
        {
          id: 'dept-frontend',
          name: '前端开发团队',
          children: [],
          users: [
            { id: 'user-fe-001', name: '冯超', department: '前端开发团队' },
            { id: 'user-fe-002', name: '陈琳', department: '前端开发团队' },
            { id: 'user-fe-003', name: '徐鹏', department: '前端开发团队' },
          ],
        },
        {
          id: 'dept-backend',
          name: '后端开发团队',
          children: [],
          users: [
            { id: 'user-be-001', name: '楚阳', department: '后端开发团队' },
            { id: 'user-be-002', name: '魏东', department: '后端开发团队' },
          ],
        },
        {
          id: 'dept-ai',
          name: 'AI平台与大模型应用研发团队',
          children: [],
          users: [
            { id: 'user-ai-001', name: '钱明', department: 'AI平台与大模型应用研发团队' },
            { id: 'user-ai-002', name: '黄瑞', department: 'AI平台与大模型应用研发团队' },
          ],
        },
        {
          id: 'dept-qa',
          name: '质量保障团队',
          children: [],
          users: [
            { id: 'user-qa-001', name: '蒋婷', department: '质量保障团队' },
          ],
        },
      ],
      users: [],
    },
    {
      id: 'dept-product',
      name: 'APA产品部',
      children: [
        {
          id: 'dept-product-rpa',
          name: 'RPA产品团队',
          children: [],
          users: [
            { id: 'user-prpa-001', name: '邓晓', department: 'RPA产品团队' },
          ],
        },
        {
          id: 'dept-product-idp',
          name: 'IDP产品团队',
          children: [],
          users: [
            { id: 'user-pidp-001', name: '曹军', department: 'IDP产品团队' },
          ],
        },
        {
          id: 'dept-product-team',
          name: '产品团队',
          children: [],
          users: [
            { id: 'user-pt-001', name: '范里鸿', department: '产品团队' },
            { id: 'user-pt-002', name: '胡一川', department: '产品团队' },
            { id: 'user-pt-003', name: '殷星', department: '产品团队' },
          ],
        },
      ],
      users: [],
    },
    {
      id: 'dept-digital-worker',
      name: '数字员工部',
      children: [],
      users: [
        { id: 'user-dw-001', name: '蔡炫', department: '数字员工部' },
        { id: 'user-dw-002', name: '黄令辉', department: '数字员工部' },
        { id: 'user-dw-003', name: '林晓峰', department: '数字员工部' },
      ],
    },
    {
      id: 'dept-marketing',
      name: '市场部',
      children: [],
      users: [
        { id: 'user-mkt-001', name: '唐丽', department: '市场部' },
        { id: 'user-mkt-002', name: '沈波', department: '市场部' },
      ],
    },
    {
      id: 'dept-hr',
      name: '人力资源部',
      children: [],
      users: [
        { id: 'user-hr-001', name: '梁飞', department: '人力资源部' },
      ],
    },
    {
      id: 'dept-finance',
      name: '财务部',
      children: [],
      users: [
        { id: 'user-fin-001', name: '谢云', department: '财务部' },
        { id: 'user-fin-002', name: '潘华', department: '财务部' },
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

  // 已存在的协作者 Map（id -> role）- 含 mock 数据演示
  const existingMap = useMemo(() => {
    const map = new Map<string, CollaboratorRole>();
    existingCollaborators
      .filter((c) => c.source === 'DIRECT')
      .forEach((c) => map.set(c.collaborator_id, c.role));
    // Mock: 模拟已授权的用户和部门
    if (map.size === 0) {
      map.set('user-dw-001', 'MANAGER' as CollaboratorRole); // 蔡炫 - 管理者
      map.set('user-dw-002', 'MAINTAINER' as CollaboratorRole); // 黄令辉 - 维护者
      map.set('dept-digital-worker', 'USER' as CollaboratorRole); // 数字员工部 - 使用者
      map.set('user-fe-001', 'OBSERVER' as CollaboratorRole); // 冯超 - 观察者
    }
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
        <IconFlowChartStroked size="small" className="collaborator-add-modal-left-item-icon" style={{ fontSize: 14 }} />
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
            <IconChevronRight size="small" />
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
              <IconFlowChartStroked size="small" style={{ fontSize: 14 }} />
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
              prefix={<IconSearch />}
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
                <Breadcrumb.Item
                  onClick={breadcrumbPath.length > 1 ? () => navigateToDept('root') : undefined}
                >
                  {t('collaborator.addModal.orgStructure')}
                </Breadcrumb.Item>
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
                        <IconFlowChartStroked size="small" style={{ fontSize: 14 }} />
                      ) : (
                        <User size={14} strokeWidth={2} />
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
