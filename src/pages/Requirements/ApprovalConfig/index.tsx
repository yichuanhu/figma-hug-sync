/**
 * 审批与评估配置（租户级单一配置）
 *
 * 顶部两个独立开关，分别控制审批与评估区域；
 * 关闭某区域则该区域配置项隐藏（数据保留），保存时仅校验启用区域。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Switch,
  Button,
  Toast,
  Space,
  Spin,
  Tag,
  Modal,
  Banner,
} from '@douyinfe/semi-ui';
import { History, Save, RotateCcw } from 'lucide-react';
import {
  fetchConfig,
  saveConfig,
  validateConfig,
  subscribeConfigChange,
  type ApprovalAssessmentConfig,
} from './mockData';
import ApprovalLevelList from './components/ApprovalLevelList';
import AssessorGroupList from './components/AssessorGroupList';
import AssessmentModelCard from './components/AssessmentModelCard';
import ConfigHistoryDrawer from './components/ConfigHistoryDrawer';
import './index.less';

const { Title, Text } = Typography;

const ApprovalAssessmentConfigPage = () => {
  const [config, setConfig] = useState<ApprovalAssessmentConfig | null>(null);
  const [original, setOriginal] = useState<ApprovalAssessmentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchConfig();
      setConfig(d);
      setOriginal(JSON.parse(JSON.stringify(d)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeConfigChange(() => load()), [load]);

  const dirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(original),
    [config, original],
  );

  const errors = useMemo(() => (config ? validateConfig(config) : []), [config]);

  const patch = (p: Partial<ApprovalAssessmentConfig>) =>
    setConfig((prev) => (prev ? { ...prev, ...p } : prev));

  const handleSave = async () => {
    if (!config) return;
    if (errors.length > 0) {
      Toast.error('存在校验错误，请修正后再保存');
      return;
    }
    setSaving(true);
    try {
      const next = await saveConfig(config);
      setConfig(next);
      setOriginal(JSON.parse(JSON.stringify(next)));
      Toast.success(`已保存为 v${next.version}`);
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!dirty) return;
    Modal.confirm({
      title: '放弃修改',
      content: '当前修改尚未保存，确认放弃并恢复到上一次保存的版本？',
      okText: '放弃',
      cancelText: '取消',
      onOk: () => setConfig(original ? JSON.parse(JSON.stringify(original)) : null),
    });
  };

  if (loading || !config) {
    return (
      <div className="approval-config-page">
        <Spin />
      </div>
    );
  }

  return (
    <div className="approval-config-page">
      <div className="approval-config-page-header">
        <div className="approval-config-page-header-title">
          <Title heading={3} className="title">
            审批与评估配置
          </Title>
          <Space spacing={8} align="center">
            <Text type="tertiary">
              租户级单一配置，控制需求审批流程与评估打分模型；保存即生成新版本快照。
            </Text>
            <Tag color="blue" type="light" size="small">
              当前 v{config.version}
            </Tag>
            <Text type="tertiary" size="small">
              {new Date(config.updated_at).toLocaleString()} · {config.updated_by}
            </Text>
          </Space>
        </div>
        <Space>
          <Button icon={<History size={14} strokeWidth={2} />} onClick={() => setHistoryVisible(true)}>
            配置历史
          </Button>
          <Button icon={<RotateCcw size={14} strokeWidth={2} />} disabled={!dirty} onClick={handleReset}>
            放弃修改
          </Button>
          <Button
            icon={<Save size={14} strokeWidth={2} />}
            theme="solid"
            type="primary"
            loading={saving}
            disabled={!dirty || errors.length > 0}
            onClick={handleSave}
          >
            保存
          </Button>
        </Space>
      </div>

      {errors.length > 0 && (
        <Banner
          type="danger"
          fullMode={false}
          closeIcon={null}
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {errors.map((e, i) => (
                <li key={i}>
                  <Text size="small">
                    [{e.code}] {e.message}
                  </Text>
                </li>
              ))}
            </ul>
          }
          style={{ marginBottom: 12 }}
        />
      )}

      <div className="approval-config-page-content">
        {/* 审批配置区 */}
        <section className="config-section">
          <div className="config-section-head">
            <div>
              <Title heading={5} style={{ margin: 0 }}>
                审批配置
              </Title>
              <Text type="tertiary" size="small">
                控制需求是否需要进入审批流程；启用后按层级串行审批
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text size="small" type="tertiary">
                {config.approval_enabled ? '已启用' : '已关闭'}
              </Text>
              <Switch
                checked={config.approval_enabled}
                onChange={(v) => patch({ approval_enabled: v })}
              />
            </div>
          </div>
          {config.approval_enabled && (
            <div className="config-section-body">
              <ApprovalLevelList
                levels={config.approval_levels}
                onChange={(approval_levels) => patch({ approval_levels })}
              />
            </div>
          )}
        </section>

        {/* 评估配置区 */}
        <section className="config-section">
          <div className="config-section-head">
            <div>
              <Title heading={5} style={{ margin: 0 }}>
                评估配置
              </Title>
              <Text type="tertiary" size="small">
                控制需求是否需要技术评估；启用后由评估人组对价值与复杂度进行打分
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text size="small" type="tertiary">
                {config.assessment_enabled ? '已启用' : '已关闭'}
              </Text>
              <Switch
                checked={config.assessment_enabled}
                onChange={(v) => patch({ assessment_enabled: v })}
              />
            </div>
          </div>
          {config.assessment_enabled && (
            <div className="config-section-body">
              <AssessorGroupList
                groups={config.assessor_groups}
                onChange={(assessor_groups) => patch({ assessor_groups })}
              />
              <AssessmentModelCard
                model={config.value_model}
                onChange={(value_model) => patch({ value_model })}
              />
              <AssessmentModelCard
                model={config.complexity_model}
                onChange={(complexity_model) => patch({ complexity_model })}
              />
            </div>
          )}
        </section>
      </div>

      <ConfigHistoryDrawer visible={historyVisible} onClose={() => setHistoryVisible(false)} />
    </div>
  );
};

export default ApprovalAssessmentConfigPage;
