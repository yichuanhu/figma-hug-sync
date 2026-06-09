/**
 * 通用审批流编辑器（Modal）
 *
 * 复用方：
 * 1. 需求中心 → 需求模板审批配置（SchemeApprovalFlowEditor 薄壳）
 * 2. 共享中心 → 审批层级配置（按资产类型配置审批人）
 *
 * 设计：通过 props 传入 levels 与 onSubmit，组件内部维护 draft 状态；
 * 文案默认使用需求中心已有的 i18n key（requirements.scheme.editor.*），
 * 通过 title/subtitle/hint 三个 props 允许调用方覆盖标题、副标题与顶部提示。
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Typography, Toast, Tag, Select, Switch } from '@douyinfe/semi-ui';
import { Plus, Trash2, ArrowUp, ArrowDown, PowerOff } from 'lucide-react';
import type {
  ApprovalLevelConfig,
  ApprovalLevelMode,
  ApproverType,
} from '@/pages/Requirements/RequirementsWorkbench/types';
import { USER_OPTIONS, ROLE_OPTIONS, DEPT_OPTIONS } from './options';
import './index.less';

const { Text } = Typography;

interface Props {
  visible: boolean;
  levels: ApprovalLevelConfig[];
  onClose: () => void;
  onSubmit: (levels: ApprovalLevelConfig[]) => Promise<void> | void;
  /** 自定义弹窗标题，默认使用 requirements.scheme.editor.title */
  title?: ReactNode;
  /** 标题右侧的副标题（如资产类型/模板名） */
  subtitle?: ReactNode;
  /** 自定义顶部提示，默认使用 requirements.scheme.editor.hint；传 null 隐藏 */
  hint?: ReactNode | null;
  /** 关闭态自定义提示文案；默认 requirements.scheme.editor.disabledHint */
  disabledHint?: ReactNode;
  width?: number;
}

interface DraftLevel extends ApprovalLevelConfig {
  _key: string;
}

const APPROVER_TYPE_OPTIONS: Array<{ value: ApproverType; labelKey: string }> = [
  { value: 'user', labelKey: 'requirements.scheme.approverType.user' },
  { value: 'role', labelKey: 'requirements.scheme.approverType.role' },
  { value: 'department', labelKey: 'requirements.scheme.approverType.department' },
];

const MODE_OPTIONS: Array<{ value: ApprovalLevelMode; labelKey: string }> = [
  { value: 'any_one', labelKey: 'requirements.scheme.approvalMode.anyOne' },
  { value: 'all', labelKey: 'requirements.scheme.approvalMode.all' },
  { value: 'majority', labelKey: 'requirements.scheme.approvalMode.majority' },
];

const genKey = () => `lvl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const ApprovalFlowEditor = ({
  visible,
  levels: initialLevels,
  onClose,
  onSubmit,
  title,
  subtitle,
  hint,
  disabledHint,
  width = 720,
}: Props) => {
  const { t } = useTranslation();
  const [levels, setLevels] = useState<DraftLevel[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const cachedLevelsRef = useRef<DraftLevel[]>([]);

  useEffect(() => {
    if (visible) {
      const initial: DraftLevel[] = (initialLevels ?? []).map((lv) => ({
        ...lv,
        mode: lv.mode ?? (lv.count_sign ? 'all' : 'any_one'),
        _key: genKey(),
      }));
      setLevels(initial);
    }
  }, [visible, initialLevels]);

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

  const makeDefaultLevel = (n: number): DraftLevel => ({
    _key: genKey(),
    order: n,
    name: t('requirements.scheme.editor.newLevelName', { n }),
    approver_type: 'role',
    approver_ids: [],
    mode: 'any_one',
  });

  const add = () => {
    setLevels((prev) => [...prev, makeDefaultLevel(prev.length + 1)]);
  };

  const enabled = levels.length > 0;

  const handleToggleEnabled = (next: boolean) => {
    if (next) {
      const restored =
        cachedLevelsRef.current && cachedLevelsRef.current.length > 0
          ? cachedLevelsRef.current
          : [makeDefaultLevel(1)];
      setLevels(restored);
      Toast.success(t('requirements.scheme.editor.toggleOnToast'));
    } else {
      cachedLevelsRef.current = levels;
      setLevels([]);
      Toast.success(t('requirements.scheme.editor.toggleOffToast'));
    }
  };

  const handleSubmit = async () => {
    for (const lv of levels) {
      if (!lv.name?.trim()) {
        Toast.warning(t('requirements.scheme.editor.errorNameRequired'));
        return;
      }
      if (!lv.approver_ids || lv.approver_ids.length === 0) {
        Toast.warning(t('requirements.scheme.editor.errorApproversRequired', { name: lv.name }));
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload: ApprovalLevelConfig[] = levels.map(({ _key, ...rest }) => rest);
      await onSubmit(payload);
      Toast.success(t('requirements.scheme.editor.saveSuccess'));
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
          ? ROLE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))
          : DEPT_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }));
    return (
      <Select
        multiple
        filter
        showClear
        style={{ width: '100%' }}
        placeholder={t('requirements.scheme.editor.approversPlaceholder')}
        value={lv.approver_ids}
        onChange={(v) => update(lv._key, { approver_ids: v as string[] })}
        optionList={opts}
      />
    );
  };

  return (
    <Modal
      title={
        <span>
          {title ?? t('requirements.scheme.editor.title')}
          {subtitle && (
            <Text type="tertiary" size="small" style={{ marginLeft: 8 }}>
              {subtitle}
            </Text>
          )}
        </span>
      }
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
      width={width}
      maskClosable={false}
      className="approval-flow-editor"
    >
      <div className="approval-flow-editor__toggle-bar">
        <span className="approval-flow-editor__toggle-left">
          <Text strong>{t('requirements.scheme.editor.enableTitle')}</Text>
          {enabled ? (
            <Tag color="green" type="light" size="small">
              {t('requirements.scheme.editor.enabledTag')}
            </Tag>
          ) : (
            <Tag color="orange" type="light" size="small">
              {t('requirements.scheme.editor.disabledTag')}
            </Tag>
          )}
        </span>
        <Switch checked={enabled} onChange={handleToggleEnabled} />
      </div>

      {enabled && hint !== null && (
        <div className="approval-flow-editor__hint">
          <Text type="tertiary" size="small">
            {hint ?? t('requirements.scheme.editor.hint')}
          </Text>
        </div>
      )}

      {!enabled ? (
        <div className="approval-flow-editor__disabled">
          <div className="approval-flow-editor__disabled-icon">
            <PowerOff size={24} strokeWidth={1.5} />
          </div>
          <Text type="tertiary" size="small" style={{ textAlign: 'center', maxWidth: 420 }}>
            {disabledHint ?? t('requirements.scheme.editor.disabledHint')}
          </Text>
        </div>
      ) : (
        <div className="approval-flow-editor__list">
          {levels.map((lv, idx) => (
            <div key={lv._key} className="approval-flow-editor__row">
              <div className="approval-flow-editor__row-header">
                <Tag color="blue" type="solid" size="small">
                  L{idx + 1}
                </Tag>
                <Form.Input
                  field={`name-${lv._key}`}
                  noLabel
                  showClear
                  initValue={lv.name}
                  onChange={(v: string) => update(lv._key, { name: v })}
                  placeholder={t('requirements.scheme.editor.namePlaceholder')}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  icon={<ArrowUp size={14} />}
                  theme="borderless"
                  type="tertiary"
                  size="small"
                  disabled={idx === 0}
                  onClick={() => move(idx, -1)}
                />
                <Button
                  icon={<ArrowDown size={14} />}
                  theme="borderless"
                  type="tertiary"
                  size="small"
                  disabled={idx === levels.length - 1}
                  onClick={() => move(idx, 1)}
                />
                <Button
                  icon={<Trash2 size={14} />}
                  theme="borderless"
                  type="danger"
                  size="small"
                  onClick={() => remove(lv._key)}
                />
              </div>
              <div className="approval-flow-editor__row-grid">
                <div>
                  <Text size="small" type="tertiary">
                    {t('requirements.scheme.editor.approverType')}
                  </Text>
                  <Select
                    style={{ width: '100%', marginTop: 4 }}
                    value={lv.approver_type}
                    onChange={(v) =>
                      update(lv._key, {
                        approver_type: v as ApproverType,
                        approver_ids: [],
                      })
                    }
                    optionList={APPROVER_TYPE_OPTIONS.map((o) => ({
                      value: o.value,
                      label: t(o.labelKey),
                    }))}
                  />
                </div>
                <div>
                  <Text size="small" type="tertiary">
                    {t('requirements.scheme.editor.mode')}
                  </Text>
                  <Select
                    style={{ width: '100%', marginTop: 4 }}
                    value={lv.mode}
                    onChange={(v) => update(lv._key, { mode: v as ApprovalLevelMode })}
                    optionList={MODE_OPTIONS.map((o) => ({
                      value: o.value,
                      label: t(o.labelKey),
                    }))}
                  />
                </div>
              </div>
              <div className="approval-flow-editor__row-approvers">
                <Text size="small" type="tertiary">
                  {t('requirements.scheme.editor.approvers')}
                </Text>
                <div style={{ marginTop: 4 }}>{renderApproverSelect(lv)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {enabled && (
        <Button
          icon={<Plus size={14} />}
          theme="light"
          type="primary"
          onClick={add}
          style={{ marginTop: 12 }}
          block
        >
          {t('requirements.scheme.editor.addLevel')}
        </Button>
      )}
    </Modal>
  );
};

export default ApprovalFlowEditor;
export { USER_OPTIONS, ROLE_OPTIONS, DEPT_OPTIONS };
