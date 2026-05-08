import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Tabs, TabPane, Toast, Modal, Space, Tag, Spin, Tooltip } from '@douyinfe/semi-ui';
import { ChevronLeft, Save, Play, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import {
  getSchemeById,
  updateSchemeBuilder,
  validateScheme,
  activateSchemeBuilder,
  forkActiveScheme,
  subscribeSchemeChange,
} from '@/pages/Requirements/RequirementsWorkbench/schemeConfig';
import type { RequirementScheme } from '@/pages/Requirements/RequirementsWorkbench/types';
import FormBuilder from './FormBuilder';
import AssessmentBuilder from './AssessmentBuilder';
import WorkflowBuilder from './WorkflowBuilder';
import CostBuilder from './CostBuilder';
import TestDriveModal from './TestDriveModal';
import './index.less';

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
  const [activeTab, setActiveTab] = useState<'form' | 'assessment' | 'workflow' | 'cost'>('form');
  const [missingTabs, setMissingTabs] = useState<string[]>([]);
  const [testDriveVisible, setTestDriveVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const forkedRef = useRef(false);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  // 进入页面：若是已激活方案/预设，先派生新版本
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
      });
      setSavedScheme(updated);
      setDraftScheme(updated);
      setDirty(false);
      const v = validateScheme(updated.id);
      setMissingTabs(v.missing);
      Toast.success(t('requirements.scheme.builder.savedDraft'));
      if (!v.ok) {
        // 草稿允许不完整，但提示一下哪些缺失
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

  const handleActivate = () => {
    if (!draftScheme) return;
    if (dirty) {
      Toast.warning(t('requirements.scheme.builder.activateDirty'));
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
          // 已激活，离开无需再确认
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

  const headerInfo = useMemo(() => draftScheme && (
    <Space>
      <Title heading={3} style={{ margin: 0 }}>{draftScheme.name}</Title>
      <Text type="tertiary">v{draftScheme.version}</Text>
      {draftScheme.is_draft && <Tag color="orange" type="light" size="small">{t('requirements.scheme.builder.draftBadge')}</Tag>}
      {draftScheme.parent_id && <Tag color="blue" type="light" size="small">{t('requirements.scheme.builder.newVersionBadge')}</Tag>}
      {dirty && <Tag color="red" type="light" size="small">{t('requirements.scheme.builder.unsaved')}</Tag>}
    </Space>
  ), [draftScheme, dirty, t]);

  const savedHint = useMemo(() => (
    <Space spacing={4} align="center" style={{ color: 'var(--semi-color-text-2)', fontSize: 12 }}>
      <Clock size={12} strokeWidth={2} />
      <span>
        {savedScheme?.updated_at
          ? t('requirements.scheme.builder.lastSavedAt', { time: formatTime(savedScheme.updated_at) })
          : t('requirements.scheme.builder.neverSaved')}
      </span>
    </Space>
  ), [savedScheme, t]);

  if (loading || !draftScheme) {
    return <div className="scheme-builder-loading"><Spin size="large" /></div>;
  }

  return (
    <div className="scheme-builder">
      <div className="scheme-builder-header">
        <Button
          icon={<ChevronLeft size={16} strokeWidth={2} />}
          theme="borderless"
          type="tertiary"
          onClick={() => guardedNavigate('/requirements/scheme')}
        >
          {t('common.back')}
        </Button>
        <div className="scheme-builder-header-main">
          {headerInfo}
        </div>
        <Space>
          {savedHint}
          <Button icon={<Play size={14} strokeWidth={2} />} onClick={() => setTestDriveVisible(true)}>
            {t('requirements.scheme.builder.testDrive')}
          </Button>
          <Button
            icon={<Save size={14} strokeWidth={2} />}
            theme={dirty ? 'solid' : 'light'}
            type={dirty ? 'primary' : 'tertiary'}
            onClick={handleSaveDraft}
            disabled={!dirty}
          >
            {t('requirements.scheme.builder.saveDraft')}
          </Button>
          <Button icon={<CheckCircle size={14} strokeWidth={2} />} theme="solid" type="primary" onClick={handleActivate}>
            {t('requirements.scheme.activate')}
          </Button>
        </Space>
      </div>

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
            tab={<span>{t('requirements.scheme.builder.tabs.assessment')}{tabBadge('assessment')}</span>}
            itemKey="assessment"
          >
            <AssessmentBuilder
              valueModel={draftScheme.value_assessment_model}
              complexityModel={draftScheme.complexity_assessment_model}
              fields={draftScheme.custom_fields}
              onChange={(value, complexity) => patch({ value_assessment_model: value, complexity_assessment_model: complexity })}
            />
          </TabPane>
          <TabPane
            tab={<span>{t('requirements.scheme.builder.tabs.workflow')}{tabBadge('workflow')}</span>}
            itemKey="workflow"
          >
            <WorkflowBuilder
              workflow={draftScheme.workflow_config}
              onChange={(wf) => patch({ workflow_config: wf })}
            />
          </TabPane>
          <TabPane
            tab={<span>{t('requirements.scheme.builder.tabs.cost')}{tabBadge('cost')}</span>}
            itemKey="cost"
          >
            <CostBuilder
              cost={draftScheme.cost_config}
              onChange={(c) => patch({ cost_config: c })}
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
