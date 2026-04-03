import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Input,
  Button,
  Typography,
  Checkbox,
  Toast,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconClose,
} from '@douyinfe/semi-icons';
import { UserCircle, Building2 } from 'lucide-react';
import type {
  AssetCollaborator,
  CollaboratorAssetType,
  CollaboratorRole,
  CollaboratorType,
} from '@/api/index';
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

// Mock 用户/部门数据
const mockUsers = [
  { id: 'user-004', name: '赵六', department: '市场部' },
  { id: 'user-005', name: '钱七', department: '运营部' },
  { id: 'user-006', name: '孙八', department: 'IT部' },
  { id: 'user-007', name: '周九', department: '研发部' },
  { id: 'user-008', name: '吴十', department: '财务部' },
];

const mockDepartments = [
  { id: 'dept-002', name: '市场部' },
  { id: 'dept-003', name: '运营部' },
  { id: 'dept-004', name: 'IT部' },
  { id: 'dept-005', name: '研发部' },
];

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

  // 已存在的协作者ID（直接分配的）
  const existingIds = useMemo(() => {
    return new Set(
      existingCollaborators
        .filter((c) => c.source === 'DIRECT')
        .map((c) => c.collaborator_id)
    );
  }, [existingCollaborators]);

  // 过滤用户
  const filteredUsers = useMemo(() => {
    if (!searchValue) return mockUsers;
    const keyword = searchValue.toLowerCase();
    return mockUsers.filter(
      (u) => u.name.toLowerCase().includes(keyword) || u.department.toLowerCase().includes(keyword)
    );
  }, [searchValue]);

  // 过滤部门
  const filteredDepts = useMemo(() => {
    if (!searchValue) return mockDepartments;
    const keyword = searchValue.toLowerCase();
    return mockDepartments.filter((d) => d.name.toLowerCase().includes(keyword));
  }, [searchValue]);

  const isSelected = useCallback(
    (id: string) => selected.some((s) => s.collaborator_id === id),
    [selected]
  );

  const toggleUser = useCallback(
    (user: typeof mockUsers[0]) => {
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
            role: 'USER' as CollaboratorRole,
          },
        ];
      });
    },
    [existingIds]
  );

  const toggleDept = useCallback(
    (dept: typeof mockDepartments[0]) => {
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
            role: 'USER' as CollaboratorRole,
          },
        ];
      });
    },
    [existingIds]
  );

  const updateRole = useCallback((id: string, role: CollaboratorRole) => {
    setSelected((prev) =>
      prev.map((s) => (s.collaborator_id === id ? { ...s, role } : s))
    );
  }, []);

  const removeSelected = useCallback((id: string) => {
    setSelected((prev) => prev.filter((s) => s.collaborator_id !== id));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selected.length === 0) {
      Toast.warning(t('collaborator.addModal.noSelection'));
      return;
    }
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 300));
    Toast.success(t('collaborator.addModal.success', { count: selected.length }));
    setSelected([]);
    setSearchValue('');
    onSuccess();
  }, [selected, t, onSuccess]);

  const handleClose = useCallback(() => {
    setSelected([]);
    setSearchValue('');
    onClose();
  }, [onClose]);

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
        {/* 左栏: 用户/部门列表 */}
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
          <div className="collaborator-add-modal-left-tree">
            {/* 用户列表 */}
            <div className="collaborator-add-modal-left-section-title">
              <UserCircle size={14} strokeWidth={2} />
              {t('collaborator.addModal.users')}
            </div>
            <div className="collaborator-add-modal-left-user-list">
              {filteredUsers.map((user) => {
                const disabled = existingIds.has(user.id);
                const checked = isSelected(user.id);
                return (
                  <div
                    key={user.id}
                    className={`collaborator-add-modal-left-user-item ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && toggleUser(user)}
                  >
                    <Checkbox checked={checked} disabled={disabled} />
                    <div className="collaborator-add-modal-left-user-item-info">
                      <Text size="small">{user.name}</Text>
                      <span className="collaborator-add-modal-left-user-item-dept">{user.department}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 部门列表 */}
            <div className="collaborator-add-modal-left-section-title">
              <Building2 size={14} strokeWidth={2} />
              {t('collaborator.addModal.departments')}
            </div>
            <div className="collaborator-add-modal-left-user-list">
              {filteredDepts.map((dept) => {
                const disabled = existingIds.has(dept.id);
                const checked = isSelected(dept.id);
                return (
                  <div
                    key={dept.id}
                    className={`collaborator-add-modal-left-dept-item ${checked ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && toggleDept(dept)}
                  >
                    <Checkbox checked={checked} disabled={disabled} />
                    <Building2 size={14} strokeWidth={2} />
                    <Text size="small">{dept.name}</Text>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右栏: 已选列表 */}
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
                        <Building2 size={14} strokeWidth={2} />
                      ) : (
                        <UserCircle size={14} strokeWidth={2} />
                      )}
                    </span>
                    <Text size="small" ellipsis={{ showTooltip: true }} style={{ maxWidth: 120 }}>
                      {item.collaborator_name}
                    </Text>
                  </div>
                  <CollaboratorRoleSelect
                    value={item.role}
                    onChange={(role) => updateRole(item.collaborator_id, role)}
                    assetType={assetType}
                  />
                  <Button
                    icon={<IconClose />}
                    theme="borderless"
                    size="small"
                    onClick={() => removeSelected(item.collaborator_id)}
                  />
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
