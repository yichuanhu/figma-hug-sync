import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Typography, Toast, Tag, Empty, Select } from '@douyinfe/semi-ui';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type {
  RequirementScheme,
  ApprovalLevelConfig,
  ApprovalLevelMode,
  ApproverType,
} from '@/pages/Requirements/RequirementsWorkbench/types';
import './index.less';

const { Text } = Typography;

interface Props {
  visible: boolean;
  scheme: RequirementScheme | null;
  onClose: () => void;
  onSubmit: (levels: ApprovalLevelConfig[]) => Promise<void>;
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

const USER_OPTIONS = [
  { value: 'user-001', label: 'John Smith' },
  { value: 'user-002', label: 'Emily Chen' },
  { value: 'user-003', label: 'Michael Wang' },
  { value: 'user-004', label: 'Sarah Li' },
  { value: 'user-005', label: 'David Zhang' },
  { value: 'user-006', label: 'Jessica Liu' },
  { value: 'user-007', label: 'Robert Xu' },
  { value: 'user-008', label: 'Angela Wu' },
];

const ROLE_OPTIONS = [
  { value: 'role-line-manager', labelKey: 'requirements.scheme.role.lineManager' },
  { value: 'role-dept-head', labelKey: 'requirements.scheme.role.deptHead' },
  { value: 'role-ai-lead', labelKey: 'requirements.scheme.role.aiLead' },
  { value: 'role-finance-head', labelKey: 'requirements.scheme.role.financeHead' },
  { value: 'role-it-head', labelKey: 'requirements.scheme.role.itHead' },
];

const DEPT_OPTIONS = [
  { value: 'dept-committee', labelKey: 'requirements.scheme.dept.committee' },
  { value: 'dept-it', labelKey: 'requirements.scheme.dept.it' },
  { value: 'dept-001', labelKey: 'requirements.scheme.dept.finance' },
  { value: 'dept-002', labelKey: 'requirements.scheme.dept.hr' },
  { value: 'dept-003', labelKey: 'requirements.scheme.dept.itDept' },
  { value: 'dept-004', labelKey: 'requirements.scheme.dept.procurement' },
  { value: 'dept-005', labelKey: 'requirements.scheme.dept.logistics' },
  { value: 'dept-006', labelKey: 'requirements.scheme.dept.sales' },
];

const genKey = () => `lvl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const SchemeApprovalFlowEditor = ({ visible, scheme, onClose, onSubmit }: Props) => {
  const { t } = useTranslation();
  const [levels, setLevels] = useState<DraftLevel[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && scheme) {
      const initial: DraftLevel[] = (scheme.approval_flow?.levels ?? []).map((lv) => ({
        ...lv,
        mode: lv.mode ?? (lv.count_sign ? 'all' : 'any_one'),
        _key: genKey(),
      }));
      setLevels(initial);
    }
  }, [visible, scheme]);

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
        name: t('requirements.scheme.editor.newLevelName', { n: prev.length + 1 }),
        approver_type: 'role',
        approver_ids: [],
        mode: 'any_one',
      },
    ]);
  };

  const handleSubmit = async () => {
    // 校验
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
          {t('requirements.scheme.editor.title')}
          {scheme && (
            <Text type="tertiary" size="small" style={{ marginLeft: 8 }}>
              {scheme.name}
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
      width={720}
      maskClosable={false}
      className="scheme-approval-flow-editor"
    >
      <div className="scheme-approval-flow-editor__hint">
        <Text type="tertiary" size="small">
          {t('requirements.scheme.editor.hint')}
        </Text>
      </div>

      {levels.length === 0 ? (
        <Empty
          description={
            <Text type="tertiary">{t('requirements.scheme.editor.emptyHint')}</Text>
          }
          style={{ padding: '24px 0' }}
        />
      ) : (
        <div className="scheme-approval-flow-editor__list">
          {levels.map((lv, idx) => (
            <div key={lv._key} className="scheme-approval-flow-editor__row">
              <div className="scheme-approval-flow-editor__row-header">
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
              <div className="scheme-approval-flow-editor__row-grid">
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
              <div className="scheme-approval-flow-editor__row-approvers">
                <Text size="small" type="tertiary">
                  {t('requirements.scheme.editor.approvers')}
                </Text>
                <div style={{ marginTop: 4 }}>{renderApproverSelect(lv)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </Modal>
  );
};

export default SchemeApprovalFlowEditor;
