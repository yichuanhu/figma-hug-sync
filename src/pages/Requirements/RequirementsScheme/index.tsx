import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Input, Tag, Toast, Modal, Dropdown, Row, Col, Space } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Ellipsis, CheckCircle, Eye, Trash2, History, Pencil, Plus, Copy } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import {
  fetchSchemes,
  activateScheme,
  deleteScheme,
  createSchemeDraft,
  cloneSchemeAsDraft,
} from '../RequirementsWorkbench/schemeConfig';
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
  const navigate = useNavigate();

  const goEdit = (s: RequirementScheme) => {
    navigate(`/requirements/scheme/builder/${s.id}`);
  };

  const handleCreateNew = async () => {
    const draft = await createSchemeDraft({ name: '未命名方案', version: '1.0.0' });
    navigate(`/requirements/scheme/builder/${draft.id}`);
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

  const handleActivate = (s: RequirementScheme) => {
    Modal.confirm({
      title: t('requirements.scheme.activateTitle'),
      content: t('requirements.scheme.activateContent', { name: s.name }),
      okText: t('requirements.scheme.activate'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        await activateScheme(s.id);
        Toast.success(t('requirements.scheme.activateSuccess'));
        load();
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
        try {
          await deleteScheme(s.id);
          Toast.success(t('common.deleteSuccess'));
          load();
        } catch (e) {
          Toast.error((e as Error).message);
        }
      },
    });
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
                    {s.status === 'active' && <Tag color="green" type="solid" size="small">{t('requirements.scheme.active')}</Tag>}
                    {s.is_preset && <Tag color="blue" type="light" size="small">{t('requirements.scheme.preset')}</Tag>}
                  </div>
                  <Dropdown
                    trigger="click"
                    position="bottomRight"
                    render={
                      <Dropdown.Menu>
                        <Dropdown.Item icon={<Eye size={14} />} onClick={(e) => { e.stopPropagation(); setDetailScheme(s); }}>
                          {t('common.viewDetail')}
                        </Dropdown.Item>
                        {s.status !== 'active' && (
                          <Dropdown.Item icon={<CheckCircle size={14} />} onClick={(e) => { e.stopPropagation(); handleActivate(s); }}>
                            {t('requirements.scheme.activate')}
                          </Dropdown.Item>
                        )}
                        <Dropdown.Item icon={<History size={14} />} disabled>
                          {t('requirements.scheme.versionHistory')}
                        </Dropdown.Item>
                        {!s.is_preset && (
                          <Dropdown.Item icon={<Pencil size={14} />} onClick={(e) => { e.stopPropagation(); goEdit(s); }}>
                            {t('requirements.scheme.edit')}
                          </Dropdown.Item>
                        )}
                        <Dropdown.Item icon={<Copy size={14} />} onClick={(e) => { e.stopPropagation(); goEdit(s); }}>
                          基于此创建副本
                        </Dropdown.Item>
                        {!s.is_preset && (
                          <Dropdown.Item icon={<Trash2 size={14} />} type="danger" onClick={(e) => { e.stopPropagation(); handleDelete(s); }}>
                            {t('common.delete')}
                          </Dropdown.Item>
                        )}
                      </Dropdown.Menu>
                    }
                  >
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
                  <Tag size="small" color="grey" type="light">{s.approval_flow.levels.length} 级审批</Tag>
                  {s.value_assessment_model && <Tag size="small" color="cyan" type="light">价值评估</Tag>}
                  {s.complexity_assessment_model && <Tag size="small" color="purple" type="light">复杂度评估</Tag>}
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
        onEditApprovalFlow={goEdit}
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
