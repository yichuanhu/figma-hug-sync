/**
 * 审批与评估配置 - 整页编辑
 *
 * - 双卡片布局：审批配置 / 评估配置
 * - 每张卡片右上角自带启用开关
 * - 顶部带返回 + 取消/保存
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Typography,
  Switch,
  Button,
  Toast,
  Spin,
  Tag,
  Modal,
  Space,
  Banner,
} from '@douyinfe/semi-ui';
import { ChevronLeft, Save, RotateCcw } from 'lucide-react';
import {
  fetchSchemes,
  saveScheme,
  validateScheme,
  type ApprovalAssessmentScheme,
} from '../mockData';
import ApprovalLevelList from '../components/ApprovalLevelList';
import AssessorGroupList from '../components/AssessorGroupList';
import AssessmentModelCard from '../components/AssessmentModelCard';
import '../index.less';
import './index.less';

const { Title, Text } = Typography;

const ApprovalConfigEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ApprovalAssessmentScheme | null>(null);
  const [original, setOriginal] = useState<ApprovalAssessmentScheme | null>(null);

  const isViewMode = searchParams.get('mode') === 'view';
  const readonly = isViewMode;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const list = await fetchSchemes();
      const target = list.find((s) => s.id === id);
      if (!target) {
        Toast.error('方案不存在');
        navigate('/requirements/approval-config', { replace: true });
        return;
      }
      setDraft(JSON.parse(JSON.stringify(target)));
      setOriginal(JSON.parse(JSON.stringify(target)));
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(original),
    [draft, original],
  );
  const errors = useMemo(() => (draft ? validateScheme(draft) : []), [draft]);

  const patch = (p: Partial<ApprovalAssessmentScheme>) =>
    setDraft((prev) => (prev ? { ...prev, ...p } : prev));

  const handleBack = () => {
    if (dirty) {
      Modal.confirm({
        title: '返回列表',
        content: '当前修改尚未保存，返回将丢弃。是否继续？',
        okText: '返回',
        cancelText: '取消',
        onOk: () => navigate('/requirements/approval-config'),
      });
      return;
    }
    navigate('/requirements/approval-config');
  };

  const handleReset = () => {
    if (!dirty) return;
    Modal.confirm({
      title: '放弃修改',
      content: '当前修改尚未保存，确认放弃？',
      okText: '放弃',
      cancelText: '取消',
      onOk: () => setDraft(original ? JSON.parse(JSON.stringify(original)) : null),
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    if (errors.length > 0) {
      Toast.error('存在校验错误，请修正后再保存');
      return;
    }
    setSaving(true);
    try {
      const next = await saveScheme(draft.id, draft);
      setDraft(JSON.parse(JSON.stringify(next)));
      setOriginal(JSON.parse(JSON.stringify(next)));
      Toast.success(`已保存为 v${next.version}`);
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !draft) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  }

  return (
    <div className="approval-config-edit-page">
      <div className="approval-config-edit-page-header">
        <div className="approval-config-edit-page-header-title">
          <Button
            icon={<ChevronLeft size={16} strokeWidth={2} />}
            theme="borderless"
            onClick={handleBack}
          />
          <Title heading={3} className="title">{draft.name}</Title>
          {draft.is_active && (
            <Tag color="green" type="solid" size="small">已激活</Tag>
          )}
          {draft.is_preset && (
            <Tag color="blue" type="light" size="small">
              系统预设
            </Tag>
          )}
          <Tag color="grey" type="light" size="small">v{draft.version}</Tag>
        </div>
        {!readonly && (
          <Space>
            <Button
              icon={<RotateCcw size={14} strokeWidth={2} />}
              disabled={!dirty}
              onClick={handleReset}
            >
              放弃
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
        )}
      </div>

      {readonly && (
        <Banner
          type="info"
          description="系统预设方案不可编辑，可在列表「基于此创建副本」后修改。"
          closeIcon={null}
          style={{ marginBottom: 16 }}
        />
      )}

      {errors.length > 0 && (
        <Banner
          type="danger"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {errors.map((e, i) => (
                <li key={i}>[{e.code}] {e.message}</li>
              ))}
            </ul>
          }
          closeIcon={null}
          style={{ marginBottom: 16 }}
        />
      )}

      <div className="approval-config-edit-page-content">
        {/* 审批配置卡片 */}
        <div className="edit-card">
          <div className="edit-card-header">
            <div className="edit-card-header-text">
              <Text strong style={{ fontSize: 16 }}>审批配置</Text>
              <Text type="tertiary" size="small">
                控制需求是否需要进入审批流程；启用后按层级串行审批
              </Text>
            </div>
            <div className="edit-card-header-switch">
              <Text type="tertiary" size="small">
                {draft.approval_enabled ? '已启用' : '未启用'}
              </Text>
              <Switch
                checked={draft.approval_enabled}
                onChange={(v) => patch({ approval_enabled: v })}
                disabled={readonly}
              />
            </div>
          </div>
          {draft.approval_enabled && (
            <div className="edit-card-body">
              <ApprovalLevelList
                levels={draft.approval_levels}
                onChange={(levels) => patch({ approval_levels: levels })}
                disabled={readonly}
              />
            </div>
          )}
        </div>

        {/* 评估配置卡片 */}
        <div className="edit-card">
          <div className="edit-card-header">
            <div className="edit-card-header-text">
              <Text strong style={{ fontSize: 16 }}>评估配置</Text>
              <Text type="tertiary" size="small">
                控制需求是否需要技术评估；启用后由评估人组对价值与复杂度进行打分
              </Text>
            </div>
            <div className="edit-card-header-switch">
              <Text type="tertiary" size="small">
                {draft.assessment_enabled ? '已启用' : '未启用'}
              </Text>
              <Switch
                checked={draft.assessment_enabled}
                onChange={(v) => patch({ assessment_enabled: v })}
                disabled={readonly}
              />
            </div>
          </div>
          {draft.assessment_enabled && (
            <div className="edit-card-body">
              <AssessorGroupList
                groups={draft.assessor_groups}
                onChange={(groups) => patch({ assessor_groups: groups })}
                disabled={readonly}
              />
              <AssessmentModelCard
                model={draft.value_model}
                onChange={(m) => patch({ value_model: m })}
                disabled={readonly}
              />
              <AssessmentModelCard
                model={draft.complexity_model}
                onChange={(m) => patch({ complexity_model: m })}
                disabled={readonly}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalConfigEditPage;
