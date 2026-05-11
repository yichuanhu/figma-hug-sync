import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Input, Button, Typography, Toast, Tag, Empty, Select } from '@douyinfe/semi-ui';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type {
  ApprovalLevelConfig,
  ApprovalLevelMode,
  ApproverType,
} from '@/pages/Requirements/RequirementsWorkbench/types';
import type { ApprovalFlowTemplate } from '../../mockData';
import './index.less';

const { Text } = Typography;

interface Props {
  visible: boolean;
  flow: ApprovalFlowTemplate | null;
  onClose: () => void;
  onSubmit: (payload: { name: string; code: string; description?: string; levels: ApprovalLevelConfig[] }) => Promise<void>;
}

interface DraftLevel extends ApprovalLevelConfig {
  _key: string;
}

const APPROVER_TYPE_OPTIONS: Array<{ value: ApproverType; label: string }> = [
  { value: 'user', label: '指定用户' },
  { value: 'role', label: '系统角色' },
  { value: 'department', label: '部门' },
];

const MODE_OPTIONS: Array<{ value: ApprovalLevelMode; label: string }> = [
  { value: 'any_one', label: '任一通过' },
  { value: 'all', label: '全部通过（会签）' },
  { value: 'majority', label: '多数通过' },
];

const USER_OPTIONS = [
  { value: 'user-001', label: 'John Smith' },
  { value: 'user-002', label: 'Emily Chen' },
  { value: 'user-003', label: 'Michael Wang' },
  { value: 'user-004', label: 'Sarah Li' },
  { value: 'user-005', label: 'David Zhang' },
  { value: 'user-006', label: 'Jessica Liu' },
];
const ROLE_OPTIONS = [
  { value: 'role-line-manager', label: '直属主管' },
  { value: 'role-dept-head', label: '部门负责人' },
  { value: 'role-ai-lead', label: 'AI 负责人' },
  { value: 'role-finance-head', label: '财务负责人' },
  { value: 'role-it-head', label: 'IT 负责人' },
];
const DEPT_OPTIONS = [
  { value: 'dept-committee', label: 'AI 委员会' },
  { value: 'dept-it', label: 'IT 部' },
  { value: 'dept-001', label: '财务部' },
  { value: 'dept-002', label: '人力资源部' },
];

const genKey = () => `lvl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const ApprovalFlowEditModal = ({ visible, flow, onClose, onSubmit }: Props) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [levels, setLevels] = useState<DraftLevel[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (flow) {
      setName(flow.name);
      setCode(flow.code);
      setDescription(flow.description ?? '');
      setLevels(
        (flow.levels ?? []).map((lv) => ({
          ...lv,
          mode: lv.mode ?? (lv.count_sign ? 'all' : 'any_one'),
          _key: genKey(),
        })),
      );
    } else {
      setName('');
      setCode('');
      setDescription('');
      setLevels([
        {
          _key: genKey(),
          order: 1,
          name: '审批节点 1',
          approver_type: 'role',
          approver_ids: [],
          mode: 'any_one',
        },
      ]);
    }
  }, [visible, flow]);

  const update = (key: string, patch: Partial<DraftLevel>) => {
    setLevels((prev) => prev.map((l) => (l._key === key ? { ...l, ...patch } : l)));
  };
  const move = (index: number, dir: -1 | 1) => {
    const next = [...levels];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setLevels(next.map((l, i) => ({ ...l, order: i + 1 })));
  };
  const remove = (key: string) => {
    setLevels((prev) => prev.filter((l) => l._key !== key).map((l, i) => ({ ...l, order: i + 1 })));
  };
  const add = () => {
    setLevels((prev) => [
      ...prev,
      {
        _key: genKey(),
        order: prev.length + 1,
        name: `审批节点 ${prev.length + 1}`,
        approver_type: 'role',
        approver_ids: [],
        mode: 'any_one',
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.warning('请填写审批流名称');
      return;
    }
    if (!code.trim()) {
      Toast.warning('请填写审批流编码');
      return;
    }
    if (levels.length === 0) {
      Toast.warning('至少需要一个审批节点');
      return;
    }
    for (const lv of levels) {
      if (!lv.name?.trim()) {
        Toast.warning('请填写审批节点名称');
        return;
      }
      if (!lv.approver_ids || lv.approver_ids.length === 0) {
        Toast.warning(`「${lv.name}」请选择审批人`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || undefined,
        levels: levels.map(({ _key, ...rest }) => rest),
      };
      await onSubmit(payload);
      Toast.success(flow ? '保存成功' : '创建成功');
      onClose();
    } catch (e) {
      Toast.error((e as Error).message || t('common.operationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderApproverSelect = (lv: DraftLevel) => {
    const opts =
      lv.approver_type === 'user'
        ? USER_OPTIONS
        : lv.approver_type === 'role'
          ? ROLE_OPTIONS
          : DEPT_OPTIONS;
    return (
      <Select
        multiple
        filter
        showClear
        style={{ width: '100%' }}
        placeholder="请选择审批人"
        value={lv.approver_ids}
        onChange={(v) => update(lv._key, { approver_ids: v as string[] })}
        optionList={opts}
      />
    );
  };

  return (
    <Modal
      title={flow ? '编辑审批流' : '新建审批流'}
      visible={visible}
      onCancel={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button theme="solid" type="primary" loading={submitting} onClick={handleSubmit}>
            {t('common.save')}
          </Button>
        </>
      }
      width={720}
      maskClosable={false}
      className="approval-flow-edit-modal"
    >
      <div className="approval-flow-edit-modal__meta">
        <Form.Slot label={{ text: '名称', required: true }}>
          <Input value={name} onChange={setName} placeholder="请输入审批流名称" maxLength={60} showClear />
        </Form.Slot>
        <Form.Slot label={{ text: '编码', required: true }}>
          <Input value={code} onChange={setCode} placeholder="如 STD-3LV" maxLength={40} showClear />
        </Form.Slot>
        <Form.Slot label="描述">
          <Input value={description} onChange={setDescription} placeholder="简要描述用途" maxLength={120} showClear />
        </Form.Slot>
      </div>

      <div className="approval-flow-edit-modal__section-title">
        <Text strong>审批节点</Text>
      </div>

      {levels.length === 0 ? (
        <Empty description={<Text type="tertiary">暂无审批节点</Text>} style={{ padding: '24px 0' }} />
      ) : (
        <div className="approval-flow-edit-modal__list">
          {levels.map((lv, idx) => (
            <div key={lv._key} className="approval-flow-edit-modal__row">
              <div className="approval-flow-edit-modal__row-header">
                <Tag color="blue" type="solid" size="small">L{idx + 1}</Tag>
                <Input
                  value={lv.name}
                  onChange={(v) => update(lv._key, { name: v })}
                  placeholder="审批节点名称"
                  style={{ flex: 1, marginRight: 8 }}
                  showClear
                />
                <Button icon={<ArrowUp size={14} />} theme="borderless" type="tertiary" size="small" disabled={idx === 0} onClick={() => move(idx, -1)} />
                <Button icon={<ArrowDown size={14} />} theme="borderless" type="tertiary" size="small" disabled={idx === levels.length - 1} onClick={() => move(idx, 1)} />
                <Button icon={<Trash2 size={14} />} theme="borderless" type="danger" size="small" onClick={() => remove(lv._key)} />
              </div>
              <div className="approval-flow-edit-modal__row-grid">
                <div>
                  <Text size="small" type="tertiary">审批人类型</Text>
                  <Select
                    style={{ width: '100%', marginTop: 4 }}
                    value={lv.approver_type}
                    onChange={(v) => update(lv._key, { approver_type: v as ApproverType, approver_ids: [] })}
                    optionList={APPROVER_TYPE_OPTIONS}
                  />
                </div>
                <div>
                  <Text size="small" type="tertiary">审批模式</Text>
                  <Select
                    style={{ width: '100%', marginTop: 4 }}
                    value={lv.mode}
                    onChange={(v) => update(lv._key, { mode: v as ApprovalLevelMode })}
                    optionList={MODE_OPTIONS}
                  />
                </div>
              </div>
              <div className="approval-flow-edit-modal__row-approvers">
                <Text size="small" type="tertiary">审批人</Text>
                <div style={{ marginTop: 4 }}>{renderApproverSelect(lv)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button icon={<Plus size={14} />} theme="light" type="primary" onClick={add} style={{ marginTop: 12 }} block>
        添加审批节点
      </Button>
    </Modal>
  );
};

export default ApprovalFlowEditModal;
