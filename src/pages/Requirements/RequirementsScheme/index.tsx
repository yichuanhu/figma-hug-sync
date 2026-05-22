import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Input, Tag, Toast, Modal, Dropdown, Row, Col, Space, Tooltip, Popover, Banner } from '@douyinfe/semi-ui';
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
  setSchemeAsDefault,
  validateScheme,
  getDefaultSchemeHealth,
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
  const [stats, setStats] = useState<{ hasPresets: boolean; hasTenantSchemes: boolean }>({ hasPresets: false, hasTenantSchemes: false });
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
    navigate('/requirements/scheme/builder/new');
  };

  const handleCloneFromPreset = (sourceId: string) => {
    setPresetPickerVisible(false);
    navigate(`/requirements/scheme/builder/new?preset=${encodeURIComponent(sourceId)}`);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [filtered, all] = await Promise.all([
        fetchSchemes(keyword),
        fetchSchemes(''),
      ]);
      setSchemes(filtered);
      setStats({
        hasPresets: all.some((s) => s.is_preset),
        hasTenantSchemes: all.some((s) => !s.is_preset),
      });
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => { load(); }, [load]);

  const defaultHealth = getDefaultSchemeHealth();
  const defaultHealthMessage = (() => {
    switch (defaultHealth) {
      case 'missing': return '租户默认方案缺失，请基于预设新建一份并设为默认';
      case 'inactive': return '租户默认方案当前未激活，请尽快恢复';
      case 'multiple': return '检测到存在多个默认方案，请联系管理员核实';
      default: return '';
    }
  })();

  /** 统一错误处理：SchemeError → Modal/Toast */
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
        } else if (['SCHEME_BOUND_CANNOT_SET_DEFAULT', 'SCHEME_DEFAULT_CANNOT_ACTIVATE', 'SCHEME_DEFAULT_UNAVAILABLE'].includes(e.code)) {
          Modal.error({ title: '操作不允许', content: e.message });
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

  /** 操作菜单 */
  const renderActionMenu = (s: RequirementScheme) => {
    const items: React.ReactNode[] = [];
    items.push(
      <Dropdown.Item key="view" icon={<Eye size={14} />} onClick={(e) => { e.stopPropagation(); setDetailScheme(s); }}>
        {t('common.viewDetail')}
      </Dropdown.Item>,
    );

    if (s.is_preset) {
      return <Dropdown.Menu>{items}</Dropdown.Menu>;
    }

    if (s.is_tenant_default) {
      items.unshift(
        <Dropdown.Item key="edit" icon={<Pencil size={14} />} onClick={(e) => { e.stopPropagation(); goEdit(s); }}>
          {t('requirements.scheme.edit')}
        </Dropdown.Item>,
      );
      return <Dropdown.Menu>{items}</Dropdown.Menu>;
    }

    // 自定义方案
    if (s.status === 'active') {
      items.unshift(
        <Dropdown.Item key="edit" icon={<Pencil size={14} />} onClick={(e) => { e.stopPropagation(); goEdit(s); }}>
          {t('requirements.scheme.edit')}
        </Dropdown.Item>,
      );
      items.push(
        <Dropdown.Item key="deactivate" icon={<PowerOff size={14} />} onClick={(e) => { e.stopPropagation(); handleDeactivate(s); }}>
          停用
        </Dropdown.Item>,
      );
    } else {
      items.unshift(
        <Dropdown.Item key="edit" icon={<Pencil size={14} />} onClick={(e) => { e.stopPropagation(); goEdit(s); }}>
          {t('requirements.scheme.edit')}
        </Dropdown.Item>,
      );

      // 启用 - 仅按字段完整性判断
      const validation = validateScheme(s.id);
      const canActivate = validation.ok;
      const activateReason = !validation.ok ? '请先完善字段配置' : '';
      const activateItem = (
        <Dropdown.Item
          key="activate"
          icon={<CheckCircle size={14} />}
          disabled={!canActivate}
          onClick={(e) => { e.stopPropagation(); if (canActivate) handleActivate(s); }}
        >
          {t('requirements.scheme.activate')}
        </Dropdown.Item>
      );
      items.push(
        canActivate ? activateItem : (
          <Tooltip key="activate-tip" content={activateReason} position="left">
            <span style={{ display: 'block' }}>{activateItem}</span>
          </Tooltip>
        ),
      );

      // 设为默认
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
            <span style={{ display: 'block' }}>{setDefaultItem}</span>
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
    if (s.is_tenant_default) return <Tag color="amber" type="light" size="small" prefixIcon={<Star size={12} strokeWidth={2} />}>默认</Tag>;
    return null;
  };

  const filteredTenantSchemes = schemes.filter((s) => !s.is_preset);

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
              <Tooltip content={!stats.hasPresets ? '平台预设方案不可用，请联系管理员' : ''} position="bottom">
                <span style={{ display: 'inline-block' }}>
                  <Button
                    icon={<Copy size={16} strokeWidth={2} />}
                    disabled={!stats.hasPresets}
                    onClick={() => setPresetPickerVisible(true)}
                  >
                    {t('requirements.scheme.createBasedOnPreset')}
                  </Button>
                </span>
              </Tooltip>
              <Button icon={<Plus size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={handleCreateNew}>
                {t('requirements.scheme.createNew')}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {defaultHealth !== 'ok' && (
        <Banner
          type="danger"
          description={defaultHealthMessage}
          fullMode={false}
          closeIcon={null}
          style={{ marginBottom: 12 }}
        />
      )}

      <div className="requirements-scheme-content">
        {!loading && filteredTenantSchemes.length === 0 ? (
          !stats.hasPresets ? (
            <EmptyState variant="error" description="平台预设方案不可用，请联系管理员" />
          ) : !stats.hasTenantSchemes ? (
            <EmptyState variant="noData" description="暂无租户方案，可基于预设创建" />
          ) : (
            <EmptyState variant="noData" description="未找到匹配的租户方案" />
          )
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
                    {s.status === 'active' && !s.is_preset && !s.is_tenant_default && (
                      <Tag color="green" type="solid" size="small">{t('requirements.scheme.active')}</Tag>
                    )}
                    {renderSourceTag(s)}
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
                  {s.is_preset && (
                    <Tag size="small" color="grey" type="light">只读</Tag>
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
        onSetDefault={(s) => { setDetailScheme(null); handleSetAsDefault(s); }}
        hasBinding={detailScheme ? (bindCountMap[detailScheme.id] ?? 0) > 0 : false}
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
