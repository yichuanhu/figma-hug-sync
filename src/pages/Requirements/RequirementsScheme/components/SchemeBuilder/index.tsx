import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Tabs, TabPane, Toast, Modal, Space, Tag, Spin } from '@douyinfe/semi-ui';
import { ChevronLeft, Save, Play, CheckCircle, AlertCircle } from 'lucide-react';
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

const SchemeBuilderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [scheme, setScheme] = useState<RequirementScheme | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'assessment' | 'workflow' | 'cost'>('form');
  const [missingTabs, setMissingTabs] = useState<string[]>([]);
  const [testDriveVisible, setTestDriveVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const forkedRef = useRef(false);

  // 进入页面：若是已激活方案，先派生新版本
  useEffect(() => {
    if (!id) return;
    (async () => {
      let s = getSchemeById(id);
      if (!s) {
        Toast.error(t('requirements.scheme.builder.notFound'));
        navigate('/requirements/scheme');
        return;
      }
      if (s.is_preset || (s.status === 'active' && !s.is_draft && !forkedRef.current)) {
        forkedRef.current = true;
        await new Promise<void>((resolve) => {
          Modal.confirm({
            title: t('requirements.scheme.builder.forkTitle'),
            content: t(s!.is_preset ? 'requirements.scheme.builder.forkPresetContent' : 'requirements.scheme.builder.forkActiveContent', { name: s!.name }),
            okText: t('common.confirm'),
            cancelText: t('common.cancel'),
            onOk: async () => {
              const draft = await forkActiveScheme(s!.id);
              navigate(`/requirements/scheme/builder/${draft.id}`, { replace: true });
              resolve();
            },
            onCancel: () => {
              navigate('/requirements/scheme');
              resolve();
            },
          });
        });
        return;
      }
      setScheme(s);
      setLoading(false);
    })();
  }, [id, navigate, t]);

  // 订阅方案变更（保持本页与 store 同步）
  useEffect(() => {
    return subscribeSchemeChange(() => {
      if (id) {
        const s = getSchemeById(id);
        if (s) setScheme(s);
      }
    });
  }, [id]);

  const patch = async (partial: Partial<RequirementScheme>) => {
    if (!scheme) return;
    const updated = await updateSchemeBuilder(scheme.id, partial);
    setScheme(updated);
  };

  const handleSaveDraft = async () => {
    if (!scheme) return;
    const v = validateScheme(scheme.id);
    setMissingTabs(v.missing);
    if (!v.ok) {
      Modal.warning({
        title: t('requirements.scheme.builder.incompleteTitle'),
        content: (
          <div>
            <div style={{ marginBottom: 8 }}>{t('requirements.scheme.builder.incompleteHint')}</div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {v.errors.map((e, i) => <li key={i} style={{ color: 'var(--semi-color-danger)' }}>{e}</li>)}
            </ul>
          </div>
        ),
        okText: t('common.confirm'),
      });
      return;
    }
    Toast.success(t('requirements.scheme.builder.savedDraft'));
  };

  const handleActivate = () => {
    if (!scheme) return;
    Modal.confirm({
      title: t('requirements.scheme.builder.activateTitle'),
      content: t('requirements.scheme.builder.activateContent', { name: scheme.name }),
      okText: t('requirements.scheme.activate'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await activateSchemeBuilder(scheme.id);
          Toast.success(t('requirements.scheme.activateSuccess'));
          navigate('/requirements/scheme');
        } catch (e) {
          const err = e as Error & { missing?: string[] };
          if (err.missing) setMissingTabs(err.missing);
          Toast.error(err.message);
        }
      },
    });
  };

  const tabBadge = (key: string) => missingTabs.includes(key)
    ? <AlertCircle size={14} style={{ color: 'var(--semi-color-danger)', marginLeft: 4 }} />
    : null;

  const headerInfo = useMemo(() => scheme && (
    <Space>
      <Title heading={3} style={{ margin: 0 }}>{scheme.name}</Title>
      <Text type="tertiary">v{scheme.version}</Text>
      {scheme.is_draft && <Tag color="orange" type="light" size="small">{t('requirements.scheme.builder.draftBadge')}</Tag>}
      {scheme.parent_id && <Tag color="blue" type="light" size="small">{t('requirements.scheme.builder.newVersionBadge')}</Tag>}
    </Space>
  ), [scheme, t]);

  if (loading || !scheme) {
    return <div className="scheme-builder-loading"><Spin size="large" /></div>;
  }

  return (
    <div className="scheme-builder">
      <div className="scheme-builder-header">
        <Button
          icon={<ChevronLeft size={16} strokeWidth={2} />}
          theme="borderless"
          type="tertiary"
          onClick={() => navigate('/requirements/scheme')}
        >
          {t('common.back')}
        </Button>
        <div className="scheme-builder-header-main">
          {headerInfo}
        </div>
        <Space>
          <Button icon={<Play size={14} strokeWidth={2} />} onClick={() => setTestDriveVisible(true)}>
            {t('requirements.scheme.builder.testDrive')}
          </Button>
          <Button icon={<Save size={14} strokeWidth={2} />} onClick={handleSaveDraft}>
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
            <FormBuilder fields={scheme.custom_fields} onChange={(fields) => patch({ custom_fields: fields })} />
          </TabPane>
          <TabPane
            tab={<span>{t('requirements.scheme.builder.tabs.assessment')}{tabBadge('assessment')}</span>}
            itemKey="assessment"
          >
            <AssessmentBuilder
              valueModel={scheme.value_assessment_model}
              complexityModel={scheme.complexity_assessment_model}
              fields={scheme.custom_fields}
              onChange={(value, complexity) => patch({ value_assessment_model: value, complexity_assessment_model: complexity })}
            />
          </TabPane>
          <TabPane
            tab={<span>{t('requirements.scheme.builder.tabs.workflow')}{tabBadge('workflow')}</span>}
            itemKey="workflow"
          >
            <WorkflowBuilder
              workflow={scheme.workflow_config}
              onChange={(wf) => patch({ workflow_config: wf })}
            />
          </TabPane>
          <TabPane
            tab={<span>{t('requirements.scheme.builder.tabs.cost')}{tabBadge('cost')}</span>}
            itemKey="cost"
          >
            <CostBuilder
              cost={scheme.cost_config}
              onChange={(c) => patch({ cost_config: c })}
            />
          </TabPane>
        </Tabs>
      </div>

      <TestDriveModal
        visible={testDriveVisible}
        scheme={scheme}
        onClose={() => setTestDriveVisible(false)}
      />
    </div>
  );
};

export default SchemeBuilderPage;
