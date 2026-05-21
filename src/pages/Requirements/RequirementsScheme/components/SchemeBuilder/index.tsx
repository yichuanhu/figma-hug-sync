import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Tabs, TabPane, Toast, Modal, Space, Tag, Spin, Tooltip, Input } from '@douyinfe/semi-ui';
import { ChevronLeft, Save, Play, CheckCircle, AlertCircle, Pencil, Building2 } from 'lucide-react';

import {
  getSchemeById,
  getActiveSchemes,
  updateSchemeBuilder,
  validateScheme,
  activateSchemeBuilder,
  forkActiveScheme,
  subscribeSchemeChange,
} from '@/pages/Requirements/RequirementsWorkbench/schemeConfig';
import type { RequirementScheme } from '@/pages/Requirements/RequirementsWorkbench/types';
import DepartmentPicker from '@/components/DepartmentPicker';
import {
  setSchemeBindingsForScheme,
  getOccupiedDepartmentMapByScheme,
} from '@/mocks/departmentSchemeBinding';
import { expandDepartmentIdsWithDescendants } from '@/mocks/departmentData';
import { computeDeptDisabledOptions } from '@/pages/Requirements/_shared/computeDeptDisabledOptions';
import FormBuilder from './FormBuilder';
import { validateAllFields } from './FormBuilder/validators';
import WorkflowBuilder from './WorkflowBuilder';
import TestDriveModal from './TestDriveModal';
import './index.less';
import '@/pages/Requirements/ApprovalConfig/components/ApprovalFlowBuilder/index.less';

const { Title, Text } = Typography;

const formatTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const SchemeBuilderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  // savedScheme：与 store 同步的最近一次持久化版本
  const [savedScheme, setSavedScheme] = useState<RequirementScheme | null>(null);
  // draftScheme：本地编辑缓冲区
  const [draftScheme, setDraftScheme] = useState<RequirementScheme | null>(null);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'workflow'>('form');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [missingTabs, setMissingTabs] = useState<string[]>([]);
  const [testDriveVisible, setTestDriveVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const forkedRef = useRef(false);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  // 进入页面：若是已激活模版/预设，先派生新版本
  useEffect(() => {
    if (!id) return;
    (async () => {
      const s = getSchemeById(id);
      if (!s) {
        Toast.error(t('requirements.scheme.builder.notFound'));
        navigate('/requirements/scheme');
        return;
      }
      if (s.is_preset || (s.status === 'active' && !s.is_draft && !forkedRef.current)) {
        forkedRef.current = true;
        Modal.confirm({
          title: t('requirements.scheme.builder.forkTitle'),
          content: t(s.is_preset ? 'requirements.scheme.builder.forkPresetContent' : 'requirements.scheme.builder.forkActiveContent', { name: s.name }),
          okText: t('common.confirm'),
          cancelText: t('common.cancel'),
          onOk: async () => {
            const draft = await forkActiveScheme(s.id);
            navigate(`/requirements/scheme/builder/${draft.id}`, { replace: true });
          },
          onCancel: () => navigate('/requirements/scheme'),
        });
        return;
      }
      setSavedScheme(s);
      setDraftScheme(s);
      setDirty(false);
      setLoading(false);
      if (s.updated_at) {
        Toast.info({
          content: t('requirements.scheme.builder.draftLoadedAt', { time: formatTime(s.updated_at) }),
          duration: 3,
        });
      }
    })();
  }, [id, navigate, t]);

  // 订阅外部 store 变化（仅同步 savedScheme，不覆盖未保存的本地编辑）
  useEffect(() => {
    return subscribeSchemeChange(() => {
      if (!id) return;
      const s = getSchemeById(id);
      if (!s) return;
      setSavedScheme(s);
      if (!dirtyRef.current) {
        setDraftScheme(s);
      }
    });
  }, [id]);

  // 离开浏览器/标签页前提醒
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const patch = useCallback((partial: Partial<RequirementScheme>) => {
    setDraftScheme((prev) => (prev ? { ...prev, ...partial } : prev));
    setDirty(true);
  }, []);

  const handleSaveDraft = async () => {
    if (!draftScheme) return;
    // 字段配置联动校验拦截
    const fv = validateAllFields(draftScheme.custom_fields ?? []);
    if (fv.hasError) {
      Toast.error(`字段配置存在 ${fv.errorFieldKeys.length} 项问题，请先修正`);
      setActiveTab('form');
      return;
    }
    const selectedDeptIds = draftScheme.applicable_department_ids ?? [];
    // R-04：选中父部门时自动展开所有子部门写入绑定
    const expandedDeptIds = expandDepartmentIdsWithDescendants(selectedDeptIds);

    const doPersist = async () => {
      try {
        const updated = await updateSchemeBuilder(draftScheme.id, {
          name: draftScheme.name,
          description: draftScheme.description,
          custom_fields: draftScheme.custom_fields,
          value_assessment_model: draftScheme.value_assessment_model,
          complexity_assessment_model: draftScheme.complexity_assessment_model,
          workflow_config: draftScheme.workflow_config,
          cost_config: draftScheme.cost_config,
          approval_flow: draftScheme.approval_flow,
          applicable_department_ids: selectedDeptIds,
        });
        setSchemeBindingsForScheme(draftScheme.id, expandedDeptIds);
        setSavedScheme(updated);
        setDraftScheme(updated);
        setDirty(false);
        const v = validateScheme(updated.id);
        setMissingTabs(v.missing);
        Toast.success(t('requirements.scheme.builder.savedDraft'));
        if (!v.ok) {
          Modal.warning({
            title: t('requirements.scheme.builder.incompleteTitle'),
            content: (
              <div>
                <div style={{ marginBottom: 8 }}>{t('requirements.scheme.builder.incompleteHint')}</div>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {v.errors.map((e, i) => <li key={i} style={{ color: 'var(--semi-color-warning)' }}>{e}</li>)}
                </ul>
              </div>
            ),
            okText: t('common.confirm'),
          });
        }
      } catch (e) {
        Toast.error((e as Error).message);
      }
    };

    await doPersist();
  };

  const handleActivate = () => {
    if (!draftScheme) return;
    if (dirty) {
      Toast.warning(t('requirements.scheme.builder.activateDirty'));
      return;
    }
    const deptIds = draftScheme.applicable_department_ids ?? [];
    if (deptIds.length === 0) {
      Toast.warning('请先选择「适用部门」，激活时至少选择 1 个部门');
      return;
    }
    Modal.confirm({
      title: t('requirements.scheme.builder.activateTitle'),
      content: t('requirements.scheme.builder.activateContent', { name: draftScheme.name }),
      okText: t('requirements.scheme.activate'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await activateSchemeBuilder(draftScheme.id);
          Toast.success(t('requirements.scheme.activateSuccess'));
          setDirty(false);
          navigate('/requirements/scheme');
        } catch (e) {
          const err = e as Error & { missing?: string[] };
          if (err.missing) setMissingTabs(err.missing);
          Toast.error(err.message);
        }
      },
    });
  };

  const guardedNavigate = useCallback((to: string) => {
    if (!dirty) {
      navigate(to);
      return;
    }
    Modal.confirm({
      title: t('requirements.scheme.builder.leaveTitle'),
      content: t('requirements.scheme.builder.leaveContent'),
      okText: t('requirements.scheme.builder.leaveOk'),
      cancelText: t('requirements.scheme.builder.leaveCancel'),
      okButtonProps: { type: 'danger' },
      onOk: () => {
        setDirty(false);
        navigate(to);
      },
    });
  }, [dirty, navigate, t]);

  const tabBadge = (key: string) => missingTabs.includes(key)
    ? <AlertCircle size={14} style={{ color: 'var(--semi-color-danger)', marginLeft: 4 }} />
    : null;




  if (loading || !draftScheme) {
    return <div className="scheme-builder-loading"><Spin size="large" /></div>;
  }

  return (
    <div className="scheme-builder">
      <div className="scheme-builder-header">
        <div className="scheme-builder-header-left">
          <Tooltip content={t('common.back')} position="bottom">
            <Button
              icon={<ChevronLeft size={16} strokeWidth={2} />}
              theme="borderless"
              type="tertiary"
              onClick={() => guardedNavigate('/requirements/scheme')}
            />
          </Tooltip>
          {editingName ? (
            <Input
              autoFocus
              value={nameDraft}
              onChange={setNameDraft}
              onBlur={() => {
                const v = (nameDraft || '').trim();
                if (v && v !== draftScheme.name) patch({ name: v });
                setEditingName(false);
              }}
              onEnterPress={() => {
                const v = (nameDraft || '').trim();
                if (v && v !== draftScheme.name) patch({ name: v });
                setEditingName(false);
              }}
              maxLength={50}
              style={{ width: 240, fontSize: 18, fontWeight: 600 }}
            />
          ) : (
            <Title
              heading={3}
              className="scheme-builder-header-title"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => { setNameDraft(draftScheme.name); setEditingName(true); }}
            >
              {draftScheme.name}
              <Pencil size={14} strokeWidth={2} style={{ color: 'var(--semi-color-text-2)' }} />
            </Title>
          )}
          <Text type="tertiary">v{draftScheme.version}</Text>
          {draftScheme.parent_id && <Tag color="blue" type="light" size="small">{t('requirements.scheme.builder.newVersionBadge')}</Tag>}
          {draftScheme.workflow_config?.template === 'none' && <Tag color="grey" type="light" size="small">无审批流</Tag>}
          {dirty && <Tag color="red" type="light" size="small">{t('requirements.scheme.builder.unsaved')}</Tag>}
        </div>
        <Space>
          <Button icon={<Play size={16} strokeWidth={2} />} onClick={() => setTestDriveVisible(true)}>
            {t('requirements.scheme.builder.testDrive')}
          </Button>
          <Button
            icon={<Save size={16} strokeWidth={2} />}
            theme={dirty ? 'solid' : 'light'}
            type={dirty ? 'primary' : 'tertiary'}
            onClick={handleSaveDraft}
            disabled={!dirty}
          >
            {t('requirements.scheme.builder.saveDraft')}
          </Button>
          <Button icon={<CheckCircle size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={handleActivate}>
            {t('requirements.scheme.activate')}
          </Button>
        </Space>
      </div>

      {(() => {
        const deptIds = draftScheme.applicable_department_ids ?? [];
        const deptCount = deptIds.length;
        const showWarning = deptCount === 0;
        const activeIds = getActiveSchemes().map((s) => s.id);
        const disabledOptions = computeDeptDisabledOptions(
          getOccupiedDepartmentMapByScheme(draftScheme.id, activeIds),
          (ownerId) => getSchemeById(ownerId)?.name ?? '其他方案',
        );
        return (
          <div
            className="approval-flow-section-card"
            style={{
              marginBottom: 16,
              ...(showWarning
                ? {
                    background: 'var(--semi-color-warning-light-default)',
                    borderColor: 'var(--semi-color-warning-light-active)',
                  }
                : undefined),
            }}
          >
            <div className="approval-flow-section-card-header">
              <div className="approval-flow-section-card-title">
                <Building2 size={16} strokeWidth={2} />
                <span>适用部门</span>
                <Text type="danger" size="small" style={{ marginLeft: 2 }}>*</Text>
                <Text type="tertiary" size="small" style={{ marginLeft: 4, fontWeight: 400 }}>
                  （激活时必填，草稿可留空）
                </Text>
              </div>
              <Text type="tertiary" size="small">
                已被其他生效方案占用的部门将不可选；选中父部门时会自动包含其所有子部门。
              </Text>
            </div>
            <div className="approval-flow-section-card-body">
              <DepartmentPicker
                value={deptIds}
                onChange={(v) => patch({ applicable_department_ids: v ?? [] })}
                placeholder="请选择适用部门（可多选，选中父部门自动包含子部门）"
                maxTagCount={6}
                disabledOptions={disabledOptions}
              />
            </div>
          </div>
        );
      })()}


      <div className="scheme-builder-body">
        <Tabs
          type="line"
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as typeof activeTab)}
          keepDOM={false}
        >
          <TabPane
            tab={<span>{t('requirements.scheme.builder.tabs.form')}{tabBadge('form')}</span>}
            itemKey="form"
          >
            <FormBuilder fields={draftScheme.custom_fields} onChange={(fields) => patch({ custom_fields: fields })} />
          </TabPane>
          <TabPane
            tab={<span>{t('requirements.scheme.builder.tabs.workflow')}{tabBadge('workflow')}{tabBadge('assessment')}</span>}
            itemKey="workflow"
          >
            <WorkflowBuilder
              workflow={draftScheme.workflow_config}
              valueModel={draftScheme.value_assessment_model}
              complexityModel={draftScheme.complexity_assessment_model}
              fields={draftScheme.custom_fields}
              onChange={(wf) => patch({ workflow_config: wf })}
              onChangeAssessment={(value, complexity) => patch({ value_assessment_model: value, complexity_assessment_model: complexity })}
              onClearAssessment={() => patch({ value_assessment_model: undefined, complexity_assessment_model: undefined })}
            />
          </TabPane>
        </Tabs>
      </div>

      <TestDriveModal
        visible={testDriveVisible}
        scheme={draftScheme}
        onClose={() => setTestDriveVisible(false)}
      />
    </div>
  );
};

export default SchemeBuilderPage;
