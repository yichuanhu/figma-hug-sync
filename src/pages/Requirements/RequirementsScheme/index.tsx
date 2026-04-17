import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Input, TextArea, Tag, Toast, Modal, Dropdown } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Upload, Ellipsis, CheckCircle, Eye, Trash2, History } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import {
  fetchSchemes,
  activateScheme,
  addScheme,
  deleteScheme,
} from '../RequirementsWorkbench/schemeConfig';
import type { RequirementScheme } from '../RequirementsWorkbench/types';
import { parseSchemeYaml } from './schemeYamlParser';
import SchemeDetailDrawer from './components/SchemeDetailDrawer';
import './index.less';

const { Title, Text } = Typography;

const RequirementsScheme = () => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [schemes, setSchemes] = useState<RequirementScheme[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploadVisible, setUploadVisible] = useState(false);
  const [yamlText, setYamlText] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const [detailScheme, setDetailScheme] = useState<RequirementScheme | null>(null);

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

  const handleUpload = async () => {
    const result = parseSchemeYaml(yamlText);
    if (!result.ok) {
      setParseErrors(result.errors.map((e) => (e.line ? `第 ${e.line} 行: ${e.message}` : e.message)));
      return;
    }
    await addScheme(result.scheme!);
    Toast.success(t('requirements.scheme.uploadSuccess'));
    setUploadVisible(false);
    setYamlText('');
    setParseErrors([]);
    load();
  };

  return (
    <div className="requirements-scheme">
      <div className="requirements-scheme-header">
        <div className="requirements-scheme-header-title">
          <Title heading={3} className="title">{t('requirements.scheme.title')}</Title>
          <Text type="tertiary">{t('requirements.scheme.description')}</Text>
        </div>
        <div className="requirements-scheme-header-toolbar">
          <Input
            prefix={<IconSearchStroked />}
            placeholder={t('requirements.scheme.searchPlaceholder')}
            className="requirements-scheme-search"
            value={keyword}
            onChange={setKeyword}
            showClear
          />
          <Button icon={<Upload size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={() => setUploadVisible(true)}>
            {t('requirements.scheme.upload')}
          </Button>
        </div>
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

      {/* 上传弹窗 */}
      <Modal
        title={t('requirements.scheme.uploadTitle')}
        visible={uploadVisible}
        onCancel={() => { setUploadVisible(false); setYamlText(''); setParseErrors([]); }}
        onOk={handleUpload}
        okText={t('requirements.scheme.parseAndCreate')}
        cancelText={t('common.cancel')}
        width={600}
      >
        <Text type="tertiary" size="small">{t('requirements.scheme.uploadHint')}</Text>
        <TextArea
          value={yamlText}
          onChange={(v) => { setYamlText(v); setParseErrors([]); }}
          rows={12}
          style={{ marginTop: 12, fontFamily: 'Menlo, monospace' }}
          placeholder={'meta:\n  code: MY-SCHEME\n  name: 我的方案\n  version: 1.0.0\ncustom_fields: []\nassessment_models: {}\napproval_flow:\n  levels: []'}
        />
        {parseErrors.length > 0 && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--semi-color-danger-light-default)', borderRadius: 4 }}>
            {parseErrors.map((e, i) => (
              <div key={i} style={{ color: 'var(--semi-color-danger)', fontSize: 12 }}>• {e}</div>
            ))}
          </div>
        )}
      </Modal>

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
    </div>
  );
};

export default RequirementsScheme;
