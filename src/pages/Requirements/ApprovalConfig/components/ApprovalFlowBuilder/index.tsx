/**
 * 审批配置 Builder：新建/编辑审批流
 * 头部交互参考 SchemeBuilder（返回、可编辑名称、保存、启用），
 * 主体复用「需求模版 → 工作流 → 审批人配置」卡片。
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Input, Toast, Modal, Space, Tag, Spin, Tooltip } from '@douyinfe/semi-ui';
import { ChevronLeft, Save, CheckCircle, Pencil } from 'lucide-react';
import {
  getApprovalFlowById,
  updateApprovalFlow,
  activateApprovalFlow,
  type ApprovalFlowTemplate,
} from '../../mockData';
import ApproverListEditor from '../ApproverListEditor';
import AssessmentBuilder from '@/pages/Requirements/RequirementsScheme/components/SchemeBuilder/AssessmentBuilder';
import './index.less';

const { Title, Text } = Typography;

const ApprovalFlowBuilderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [draft, setDraft] = useState<ApprovalFlowTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  useEffect(() => {
    if (!id) return;
    const f = getApprovalFlowById(id);
    if (!f) {
      Toast.error('审批流不存在');
      navigate('/requirements/approval-config');
      return;
    }
    setDraft({ ...f, assessors: f.assessors ?? [], approvers: f.approvers ?? [] });
    setLoading(false);
  }, [id, navigate]);

  const patch = (p: Partial<ApprovalFlowTemplate>) => {
    setDraft((prev) => (prev ? { ...prev, ...p } : prev));
    setDirty(true);
  };

  const guardedNavigate = (to: string) => {
    if (!dirty) {
      navigate(to);
      return;
    }
    Modal.confirm({
      title: '离开当前页？',
      content: '当前已有未保存的修改，离开后修改将丢失。',
      okText: '离开',
      cancelText: '继续编辑',
      okButtonProps: { type: 'danger' },
      onOk: () => navigate(to),
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      Toast.warning('请填写审批流名称');
      return;
    }
    if (draft.approvers.length === 0) {
      Toast.warning('至少需要一个审批级');
      return;
    }
    for (const a of draft.approvers) {
      if (!a.name.trim()) {
        Toast.warning('请填写所有审批级名称');
        return;
      }
      if ((a.type === 'specific_users' || a.type === 'role') && (!a.target_ids || a.target_ids.length === 0)) {
        Toast.warning(`「${a.name}」请选择审批人`);
        return;
      }
    }
    try {
      const updated = await updateApprovalFlow(draft.id, {
        name: draft.name,
        code: draft.code,
        description: draft.description,
        approvers: draft.approvers,
      });
      setDraft(updated);
      setDirty(false);
      Toast.success('已保存');
    } catch (e) {
      Toast.error((e as Error).message);
    }
  };

  const handleActivate = () => {
    if (!draft) return;
    if (dirty) {
      Toast.warning('请先保存当前修改后再启用');
      return;
    }
    Modal.confirm({
      title: '启用审批流',
      content: `确认将「${draft.name}」设为当前生效的审批流？同一时间仅一个审批流处于启用状态。`,
      okText: '启用',
      cancelText: t('common.cancel'),
      onOk: async () => {
        await activateApprovalFlow(draft.id);
        Toast.success('启用成功');
        navigate('/requirements/approval-config');
      },
    });
  };

  if (loading || !draft) {
    return (
      <div className="approval-flow-builder-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="approval-flow-builder">
      <div className="approval-flow-builder-header">
        <div className="approval-flow-builder-header-left">
          <Tooltip content={t('common.back')} position="bottom">
            <Button
              icon={<ChevronLeft size={16} strokeWidth={2} />}
              theme="borderless"
              type="tertiary"
              onClick={() => guardedNavigate('/requirements/approval-config')}
            />
          </Tooltip>
          {editingName ? (
            <Input
              autoFocus
              value={nameDraft}
              onChange={setNameDraft}
              onBlur={() => {
                const v = (nameDraft || '').trim();
                if (v && v !== draft.name) patch({ name: v });
                setEditingName(false);
              }}
              onEnterPress={() => {
                const v = (nameDraft || '').trim();
                if (v && v !== draft.name) patch({ name: v });
                setEditingName(false);
              }}
              maxLength={50}
              style={{ width: 240, fontSize: 18, fontWeight: 600 }}
            />
          ) : (
            <Title
              heading={3}
              className="approval-flow-builder-header-title"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}
              onClick={() => {
                setNameDraft(draft.name);
                setEditingName(true);
              }}
            >
              {draft.name}
              <Pencil size={14} strokeWidth={2} style={{ color: 'var(--semi-color-text-2)' }} />
            </Title>
          )}
          {draft.status === 'active' && <Tag color="green" type="light" size="small">已启用</Tag>}
          {draft.is_preset && <Tag color="blue" type="light" size="small">预设</Tag>}
          {dirty && <Tag color="red" type="light" size="small">未保存</Tag>}
        </div>
        <Space>
          <Button
            icon={<Save size={16} strokeWidth={2} />}
            theme={dirty ? 'solid' : 'light'}
            type={dirty ? 'primary' : 'tertiary'}
            onClick={handleSave}
            disabled={!dirty}
          >
            保存
          </Button>
          <Button
            icon={<CheckCircle size={16} strokeWidth={2} />}
            theme="solid"
            type="primary"
            onClick={handleActivate}
            disabled={draft.status === 'active'}
          >
            启用
          </Button>
        </Space>
      </div>

      <div className="approval-flow-builder-body">
        <div className="approval-flow-builder-meta">
          <div className="approval-flow-builder-meta-item full">
            <Text size="small" type="tertiary">描述</Text>
            <Input
              value={draft.description ?? ''}
              onChange={(v) => patch({ description: v })}
              placeholder="简要描述此审批流的用途"
              maxLength={120}
              showClear
            />
          </div>
        </div>

        <div className="workflow-builder">
          <ApproverListEditor
            title="审批人配置"
            approvers={draft.approvers}
            onChange={(approvers) => patch({ approvers })}
            enabled={draft.approvers.length > 0}
            onToggle={() => { /* 列表变更已在 onChange 中体现 */ }}
            emptyHint="暂无审批级，点击右上角添加"
            disabledHint="已关闭审批人配置，需求提交后将跳过审批环节。开启后可配置审批级与审批方式。"
            enableToastText="已启用审批人配置"
            disableToastText="已关闭审批人配置"
            defaultItemName="新审批级"
          />

          <ApproverListEditor
            title="技术评估人配置"
            approvers={draft.assessors}
            onChange={(assessors) => patch({ assessors })}
            enabled={draft.assessors.length > 0}
            onToggle={(next) => {
              if (!next) {
                // 关闭评估人时同步清空评估模型
                patch({ value_model: undefined, complexity_model: undefined });
              }
            }}
            emptyHint="暂无评估级，点击右上角添加"
            disabledHint="已关闭评估人配置，需求将不进行技术评估。开启后可配置评估人及评估模型。"
            enableToastText="已启用评估人配置"
            disableToastText="已关闭评估人配置"
            defaultItemName="新评估级"
            extra={
              <AssessmentBuilder
                valueModel={draft.value_model}
                complexityModel={draft.complexity_model}
                fields={[]}
                onChange={(value_model, complexity_model) => patch({ value_model, complexity_model })}
              />
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ApprovalFlowBuilderPage;
