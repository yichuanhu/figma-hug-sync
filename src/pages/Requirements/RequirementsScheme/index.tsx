import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Input, Tag, Toast, Modal, Dropdown, Row, Col, Space, Tooltip, Popover } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Ellipsis, CheckCircle, Eye, Trash2, Pencil, Plus, Copy, Building2, Star, PowerOff } from 'lucide-react';
import {
  getBoundDepartmentCountMapByScheme,
  listDepartmentsByScheme,
  subscribeSchemeBindingChange,
} from '@/mocks/departmentSchemeBinding';
import { getDepartmentName } from '@/mocks/departmentData';
import EmptyState from '@/components/EmptyState';
import {
  fetchSchemes,
  activateScheme,
  deactivateScheme,
  deleteScheme,
  cloneSchemeAsDraft,
  setSchemeAsDefault,
  SchemeError,
} from '@/pages/Requirements/RequirementsWorkbench/schemeConfig';
import type { RequirementScheme } from '../RequirementsWorkbench/types';
import SchemeDetailDrawer from './components/SchemeDetailDrawer';
import './index.less';

const { Title, Text } = Typography;

const RequirementsScheme = () => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [schemes, setSchemes] = useState<RequirementScheme[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailScheme, setDetailScheme] = useState<RequirementScheme | null>(null);
  const [presetPickerVisible, setPresetPickerVisible] = useState(false);
  const [bindCountMap, setBindCountMap] = useState<Record<string, number>>(() => getBoundDepartmentCountMapByScheme());
  const navigate = useNavigate();

  useEffect(() => subscribeSchemeBindingChange(() => setBindCountMap(getBoundDepartmentCountMapByScheme())), []);

  const goEdit = (s: RequirementScheme) => {
    navigate(`/requirements/scheme/builder/${s.id}`);
  };

  const handleCreateNew = () => {
    // 不预创建草稿：进入编辑页后由用户主动保存才落库
    navigate('/requirements/scheme/builder/new');
  };

  const handleCloneFromPreset = async (sourceId: string) => {
    const draft = await cloneSchemeAsDraft(sourceId);
    setPresetPickerVisible(false);
    navigate(`/requirements/scheme/builder/${draft.id}`);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSchemes(await fetchSchemes(keyword));
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => { load(); }, [load]);

  /** 统一错误处理：SchemeError → Toast/Modal 友好提示 */
  const runWithSchemeErrors = async (fn: () => Promise<void>): Promise<boolean> => {
    try {
      await fn();
      return true;
    } catch (e) {
      if (e instanceof SchemeError) {
        if (e.code === 'SCHEME_DEPARTMENT_CONFLICT') {
          const conflicts = (e.details as { conflicts?: string[] } | undefined)?.conflicts ?? [];
          Modal.error({
            title: '存在部门冲突',
            content: (
              <div>
                <div style={{ marginBottom: 8 }}>{e.message}</div>
                {conflicts.length > 0 && (
                  <Text type="tertiary" size="small">
                    冲突部门：{conflicts.slice(0, 5).map(getDepartmentName).join('、')}
                    {conflicts.length > 5 ? ` 等 ${conflicts.length} 个` : ''}
                  </Text>
                )}
              </div>
            ),
          });
        } else {
          Toast.warning(e.message);
        }
      } else {
        Toast.error((e as Error).message ?? '操作失败');
      }
      return false;
    }
  };

  const handleActivate = (s: RequirementScheme) => {
    const deptCount = (s.applicable_department_ids ?? []).length;
    if (deptCount === 0) {
      Toast.warning('请先在模版中配置「适用部门」，激活时至少选择 1 个部门');
      goEdit(s);
      return;
    }
    Modal.confirm({
      title: t('requirements.scheme.activateTitle'),
      content: t('requirements.scheme.activateContent', { name: s.name }),
      okText: t('requirements.scheme.activate'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        const ok = await runWithSchemeErrors(async () => { await activateScheme(s.id); });
        if (ok) { Toast.success(t('requirements.scheme.activateSuccess')); load(); }
      },
    });
  };

  const handleDeactivate = (s: RequirementScheme) => {
    Modal.confirm({
      title: '停用方案？',
      content: `停用后，「${s.name}」将清空所有部门绑定，不再用于创建需求。`,
      okText: '停用',
      okButtonProps: { type: 'warning' },
      cancelText: t('common.cancel'),
      onOk: async () => {
        const ok = await runWithSchemeErrors(async () => { await deactivateScheme(s.id); });
        if (ok) { Toast.success('已停用'); load(); }
      },
    });
  };

  const handleSetAsDefault = (s: RequirementScheme) => {
    Modal.confirm({
      title: '设为默认方案？',
      content: `将「${s.name}」设为新的租户默认方案。原默认方案会被自动停用，无部门绑定的方案才能设为默认。`,
      okText: '设为默认',
      cancelText: t('common.cancel'),
      onOk: async () => {
        const ok = await runWithSchemeErrors(async () => { await setSchemeAsDefault(s.id); });
        if (ok) { Toast.success('已设为默认方案'); load(); }
      },
    });
  };

  const handleDelete = (s: RequirementScheme) => {
    Modal.confirm({
      title: t('requirements.scheme.deleteTitle'),
      content: t('requirements.scheme.deleteContent', { name: s.name }),
      okText: t('common.delete'),
      okButtonProps: { type: 'danger' },
      cancelText: t('common.cancel'),
      onOk: async () => {
        const ok = await runWithSchemeErrors(async () => { await deleteScheme(s.id); });
        if (ok) { Toast.success(t('common.deleteSuccess')); load(); }
      },
    });
  };

  /** v15 §10.3 按钮可见性矩阵：根据方案类型渲染操作菜单 */
  const renderActionMenu = (s: RequirementScheme) => {
    const items: React.ReactNode[] = [];
    // 查看（所有类型）
    items.push(
      <Dropdown.Item key="view" icon={<Eye size={14} />} onClick={(e) => { e.stopPropagation(); setDetailScheme(s); }}>
        {t('common.viewDetail')}
      </Dropdown.Item>,
    );

    if (s.is_preset) {
      // 预制方案：仅可查看
      return <Dropdown.Menu>{items}</Dropdown.Menu>;
    }

    if (s.is_tenant_default) {
      // 租户默认：编辑、查看
      items.unshift(
        <Dropdown.Item key="edit" icon={<Pencil size={14} />} onClick={(e) => { e.stopPropagation(); goEdit(s); }}>
          {t('requirements.scheme.edit')}
        </Dropdown.Item>,
      );
      return <Dropdown.Menu>{items}</Dropdown.Menu>;
    }

    // 自定义方案
    if (s.status === 'active') {
      // 启用中：编辑（仅适用部门，由编辑页约束）、停用、查看
      items.unshift(
        <Dropdown.Item key="edit" icon={<Pencil size={14} />} onClick={(e) => { e.stopPropagation(); goEdit(s); }}>
          编辑适用部门
        </Dropdown.Item>,
      );
      items.push(
        <Dropdown.Item key="deactivate" icon={<PowerOff size={14} />} onClick={(e) => { e.stopPropagation(); handleDeactivate(s); }}>
          停用
        </Dropdown.Item>,
      );
    } else {
      // 草稿/停用：编辑、启用、设为默认、删除
      items.unshift(
        <Dropdown.Item key="edit" icon={<Pencil size={14} />} onClick={(e) => { e.stopPropagation(); goEdit(s); }}>
          {t('requirements.scheme.edit')}
        </Dropdown.Item>,
      );
      items.push(
        <Dropdown.Item key="activate" icon={<CheckCircle size={14} />} onClick={(e) => { e.stopPropagation(); handleActivate(s); }}>
          {t('requirements.scheme.activate')}
        </Dropdown.Item>,
      );
      const hasBinding = (bindCountMap[s.id] ?? 0) > 0;
      const setDefaultItem = (
        <Dropdown.Item
          key="set-default"
          icon={<Star size={14} />}
          disabled={hasBinding}
          onClick={(e) => { e.stopPropagation(); if (!hasBinding) handleSetAsDefault(s); }}
        >
          设为默认
        </Dropdown.Item>
      );
      items.push(
        hasBinding ? (
          <Tooltip key="set-default-tip" content="有部门绑定的方案不能设为默认，请先清空适用部门" position="left">
            {setDefaultItem}
          </Tooltip>
        ) : setDefaultItem,
      );
      items.push(
        <Dropdown.Item key="delete" icon={<Trash2 size={14} />} type="danger" onClick={(e) => { e.stopPropagation(); handleDelete(s); }}>
          {t('common.delete')}
        </Dropdown.Item>,
      );
    }

    return <Dropdown.Menu>{items}</Dropdown.Menu>;
  };

  const renderSourceTag = (s: RequirementScheme) => {
    if (s.is_preset) return <Tag color="blue" type="light" size="small">预制</Tag>;
    if (s.is_tenant_default) return <Tag color="violet" type="light" size="small" prefixIcon={<Star size={12} strokeWidth={2} />}>默认</Tag>;
    return null;
  };

  return (
    <div className="requirements-scheme">
      <div className="requirements-scheme-header">
        <div className="requirements-scheme-header-title">
          <Title heading={3} className="title">{t('requirements.scheme.title')}</Title>
          <Text type="tertiary">{t('requirements.scheme.description')}</Text>
        </div>
        <Row
          type="flex"
          justify="space-between"
          align="middle"
          className="requirements-scheme-header-toolbar"
        >
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('requirements.scheme.searchPlaceholder')}
                className="requirements-scheme-search-input"
                value={keyword}
                onChange={setKeyword}
                showClear
                maxLength={100}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<Copy size={16} strokeWidth={2} />} onClick={() => setPresetPickerVisible(true)}>
                {t('requirements.scheme.createBasedOnPreset')}
              </Button>
              <Button icon={<Plus size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={handleCreateNew}>
                {t('requirements.scheme.createNew')}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div className="requirements-scheme-content">
        {!loading && schemes.length === 0 ? (
          <EmptyState variant="noData" description={t('requirements.scheme.empty')} />
        ) : (
          <div className="requirements-scheme-grid">
            {schemes.map((s) => (
              <div
                key={s.id}
                className={`scheme-card ${s.status === 'active' ? 'active' : ''}`}
                onClick={() => setDetailScheme(s)}
              >
                <div className="scheme-card-header">
                  <div className="scheme-card-title-row">
                    <Text strong ellipsis={{ showTooltip: true }} style={{ fontSize: 16 }}>{s.name}</Text>
                    {s.status === 'active' && !s.is_preset && (
                      <Tag color="green" type="solid" size="small">{t('requirements.scheme.active')}</Tag>
                    )}
                    {renderSourceTag(s)}
                    {s.preset_update_available && (
                      <Tooltip content="该方案对应的预制模版有新版本">
                        <Tag color="amber" type="light" size="small">预制可更新</Tag>
                      </Tooltip>
                    )}
                  </div>
                  <Dropdown trigger="click" clickToHide position="bottomRight" render={renderActionMenu(s)}>
                    <Button icon={<Ellipsis size={16} />} theme="borderless" size="small" onClick={(e) => e.stopPropagation()} />
                  </Dropdown>
                </div>
                <div className="scheme-card-meta">
                  <Text type="tertiary" size="small">{s.code} · v{s.version}</Text>
                </div>
                <Text type="secondary" size="small" ellipsis={{ rows: 2 }} style={{ marginTop: 8 }}>
                  {s.description}
                </Text>
                <div className="scheme-card-footer">
                  <Tag size="small" color="grey" type="light">{s.custom_fields.length} 字段</Tag>
                  {s.is_preset ? (
                    <Tag size="small" color="grey" type="light">只读</Tag>
                  ) : (
                    <Popover
                      position="top"
                      showArrow
                      content={(() => {
                        const selected = s.applicable_department_ids ?? [];
                        const effective = new Set(listDepartmentsByScheme(s.id));
                        if (selected.length === 0) return <Text type="tertiary" size="small">尚未配置适用部门（激活时必填）</Text>;
                        return (
                          <div style={{ maxWidth: 280, padding: '4px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {selected.map((id) => {
                              const isEffective = effective.has(id);
                              return (
                                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Text size="small" type={isEffective ? 'primary' : 'tertiary'} style={{ textDecoration: isEffective ? 'none' : 'line-through' }}>
                                    {getDepartmentName(id)}
                                  </Text>
                                  {!isEffective && (
                                    <Text size="small" type="tertiary">（已被其他方案接管）</Text>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    >
                      {(() => {
                        const selected = (s.applicable_department_ids ?? []).length;
                        const effective = bindCountMap[s.id] ?? 0;
                        if (selected === 0) {
                          return (
                            <Tag
                              size="small"
                              color="amber"
                              type="light"
                              prefixIcon={<Building2 size={12} strokeWidth={2} />}
                              onClick={(e) => e.stopPropagation()}
                              style={{ cursor: 'pointer' }}
                            >
                              未配置适用部门
                            </Tag>
                          );
                        }
                        const hasDrift = effective < selected;
                        return (
                          <Tag
                            size="small"
                            color={hasDrift ? 'amber' : 'violet'}
                            type="light"
                            prefixIcon={<Building2 size={12} strokeWidth={2} />}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer' }}
                          >
                            {hasDrift ? `适用 ${selected} · 生效 ${effective}` : `适用 ${selected} 个部门`}
                          </Tag>
                        );
                      })()}
                    </Popover>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* 详情抽屉 */}
      <SchemeDetailDrawer
        visible={!!detailScheme}
        scheme={detailScheme}
        schemes={schemes}
        onClose={() => setDetailScheme(null)}
        onNavigate={(s) => setDetailScheme(s)}
        onActivate={handleActivate}
        onDelete={(s) => { setDetailScheme(null); handleDelete(s); }}
      />

      {/* 基于预设创建 */}
      <Modal
        title={t('requirements.scheme.createBasedOnPreset')}
        visible={presetPickerVisible}
        onCancel={() => setPresetPickerVisible(false)}
        footer={null}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {schemes.filter((s) => s.is_preset).map((s) => (
            <div
              key={s.id}
              onClick={() => handleCloneFromPreset(s.id)}
              style={{ padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 6, cursor: 'pointer' }}
            >
              <div style={{ fontWeight: 500 }}>{s.name}</div>
              <Text type="tertiary" size="small">{s.code} · v{s.version}</Text>
              <div style={{ marginTop: 4 }}><Text size="small" type="secondary">{s.description}</Text></div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default RequirementsScheme;
