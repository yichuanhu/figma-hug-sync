import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Input, Tag, Toast, Modal, Dropdown, Upload, Row, Col, Space } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import { Upload as UploadIcon, Ellipsis, CheckCircle, Eye, Trash2, History, Pencil, Inbox, File as FileIcon, X } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import {
  fetchSchemes,
  activateScheme,
  addScheme,
  deleteScheme,
  updateSchemeApprovalFlow,
} from '../RequirementsWorkbench/schemeConfig';
import type { RequirementScheme, ApprovalLevelConfig } from '../RequirementsWorkbench/types';
import { parseSchemeYaml } from './schemeYamlParser';
import SchemeDetailDrawer from './components/SchemeDetailDrawer';
import SchemeApprovalFlowEditor from './components/SchemeApprovalFlowEditor';
import './index.less';

const { Title, Text } = Typography;

const RequirementsScheme = () => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [schemes, setSchemes] = useState<RequirementScheme[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploadVisible, setUploadVisible] = useState(false);
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [yamlText, setYamlText] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const [detailScheme, setDetailScheme] = useState<RequirementScheme | null>(null);
  const [editingScheme, setEditingScheme] = useState<RequirementScheme | null>(null);

  const handleEditApprovalFlow = (s: RequirementScheme) => {
    if (s.is_preset) {
      Toast.warning(t('requirements.scheme.editor.presetNotEditable'));
      return;
    }
    setEditingScheme(s);
  };

  const handleSaveApprovalFlow = async (levels: ApprovalLevelConfig[]) => {
    if (!editingScheme) return;
    const updated = await updateSchemeApprovalFlow(editingScheme.id, { levels });
    setEditingScheme(null);
    // 同步抽屉显示的最新方案
    if (detailScheme?.id === updated.id) setDetailScheme(updated);
    load();
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

  const closeUploadModal = () => {
    setUploadVisible(false);
    setFileList([]);
    setYamlText('');
    setParseErrors([]);
  };

  const handleFileChange = (info: { fileList: FileItem[] }) => {
    const files = info.fileList;
    setFileList(files);
    setParseErrors([]);
    setYamlText('');
    const file = files[0]?.fileInstance;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setYamlText((e.target?.result as string) ?? '');
    reader.onerror = () => Toast.error(t('requirements.scheme.uploadReadError'));
    reader.readAsText(file);
  };

  const beforeUpload = ({ file }: { file: FileItem }) => {
    const inst = file.fileInstance;
    if (!inst) return false;
    const isYaml = /\.(ya?ml)$/i.test(inst.name);
    if (!isYaml) {
      Toast.error(t('requirements.scheme.uploadFileTypeError'));
      return { fileInstance: inst, status: 'validateFail', shouldUpload: false } as never;
    }
    if (inst.size > 1024 * 1024) {
      Toast.error(t('requirements.scheme.uploadFileTooLarge'));
      return { fileInstance: inst, status: 'validateFail', shouldUpload: false } as never;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!yamlText) return;
    const result = parseSchemeYaml(yamlText);
    if (!result.ok) {
      setParseErrors(result.errors.map((e) => (e.line ? `第 ${e.line} 行: ${e.message}` : e.message)));
      return;
    }
    await addScheme(result.scheme!);
    Toast.success(t('requirements.scheme.uploadSuccess'));
    closeUploadModal();
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
          <Button icon={<UploadIcon size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={() => setUploadVisible(true)}>
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
                          <Dropdown.Item icon={<Pencil size={14} />} onClick={(e) => { e.stopPropagation(); handleEditApprovalFlow(s); }}>
                            {t('requirements.scheme.editor.entry')}
                          </Dropdown.Item>
                        )}
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
        onCancel={closeUploadModal}
        onOk={handleUpload}
        okText={t('requirements.scheme.parseAndCreate')}
        cancelText={t('common.cancel')}
        okButtonProps={{ disabled: !yamlText }}
        width={600}
        className="scheme-upload-modal"
        maskClosable={false}
      >
        <Text type="tertiary" size="small">{t('requirements.scheme.uploadHint')}</Text>
        <div style={{ marginTop: 12 }}>
          <Upload
            action=""
            customRequest={() => ({ abort: () => {} })}
            accept=".yaml,.yml"
            limit={1}
            draggable
            dragIcon={<Inbox size={36} strokeWidth={2} />}
            dragMainText={t('requirements.scheme.uploadDragHint')}
            dragSubText={t('requirements.scheme.uploadFileTypeHint')}
            beforeUpload={beforeUpload}
            onChange={handleFileChange}
            onRemove={() => { setFileList([]); setYamlText(''); setParseErrors([]); return true; }}
            fileList={fileList}
            className="scheme-upload-uploader"
          />
          {fileList.length > 0 && fileList[0].fileInstance && (
            <div className="scheme-upload-file-info">
              <div className="file-info-left">
                <FileIcon size={16} strokeWidth={2} />
                <span className="file-name">{fileList[0].fileInstance.name}</span>
                <span className="file-size">
                  {(fileList[0].fileInstance.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <Button
                icon={<X size={14} strokeWidth={2} />}
                type="tertiary"
                theme="borderless"
                size="small"
                onClick={() => { setFileList([]); setYamlText(''); setParseErrors([]); }}
              />
            </div>
          )}
        </div>
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
        onEditApprovalFlow={handleEditApprovalFlow}
      />

      {/* 审批流编辑弹窗 */}
      <SchemeApprovalFlowEditor
        visible={!!editingScheme}
        scheme={editingScheme}
        onClose={() => setEditingScheme(null)}
        onSubmit={handleSaveApprovalFlow}
      />
    </div>
  );
};

export default RequirementsScheme;
