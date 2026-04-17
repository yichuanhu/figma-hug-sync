import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  InputNumber,
  Select,
  Toast,
  Typography,
  TextArea,
  Empty,
} from '@douyinfe/semi-ui';
import { Plus, Trash2, Wallet } from 'lucide-react';
import type { RequirementItem, CostEstimateData, CostRoleItem } from '../../../types';
import './index.less';

const { Text, Title } = Typography;

const ROLE_DAILY_RATE: Record<string, number> = {
  product: 1500,
  backend: 1800,
  frontend: 1500,
  qa: 1200,
  designer: 1400,
  ops: 1600,
};

const ROLE_OPTIONS = Object.keys(ROLE_DAILY_RATE).map((k) => ({ value: k, label: k }));

const computeTotals = (
  roles: CostRoleItem[],
  infra: number,
  thirdParty: number,
  other: number,
) => {
  const totalPersonDays = roles.reduce((s, r) => s + r.people * r.days, 0);
  const laborCost = roles.reduce(
    (s, r) => s + r.people * r.days * (ROLE_DAILY_RATE[r.role] ?? 0),
    0,
  );
  const nonLaborCost = (infra || 0) + (thirdParty || 0) + (other || 0);
  return {
    totalPersonDays,
    laborCost,
    nonLaborCost,
    totalCost: laborCost + nonLaborCost,
  };
};

interface Props {
  data: RequirementItem;
  onSaveCost: (id: string, cost: CostEstimateData) => Promise<void>;
}

const CostEstimateTab = ({ data, onSaveCost }: Props) => {
  const { t } = useTranslation();

  const editableStatuses: string[] = ['PENDING_PROJECT', 'DEVELOPING'];
  const editable = editableStatuses.includes(data.status);
  const lockedReason =
    !editable && !(['LAUNCHED', 'OFFLINE'] as string[]).includes(data.status)
      ? t('requirements.costEstimate.lockedBeforeApproval')
      : null;

  const initial: CostEstimateData = data.costEstimate ?? {
    roles: [],
    infra: 0,
    thirdParty: 0,
    other: 0,
    totalPersonDays: 0,
    laborCost: 0,
    nonLaborCost: 0,
    totalCost: 0,
    updatedAt: '',
    updatedBy: '',
  };

  const [roles, setRoles] = useState<CostRoleItem[]>(initial.roles);
  const [infra, setInfra] = useState<number>(initial.infra);
  const [thirdParty, setThirdParty] = useState<number>(initial.thirdParty);
  const [other, setOther] = useState<number>(initial.other);
  const [roiNote, setRoiNote] = useState<string>(initial.roiNote ?? '');
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(
    () => computeTotals(roles, infra, thirdParty, other),
    [roles, infra, thirdParty, other],
  );

  const updateRole = (idx: number, patch: Partial<CostRoleItem>) => {
    setRoles((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleSubmit = async () => {
    if (roles.some((r) => !r.role)) {
      Toast.warning(t('requirements.costEstimate.selectRoleFirst'));
      return;
    }
    setSubmitting(true);
    try {
      const next: CostEstimateData = {
        roles,
        infra,
        thirdParty,
        other,
        ...totals,
        roiNote: roiNote.trim() || undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: 'John Smith',
      };
      await onSaveCost(data.id, next);
      Toast.success(t('requirements.costEstimate.saveSuccess'));
    } finally {
      setSubmitting(false);
    }
  };

  if (lockedReason) {
    return (
      <div className="cost-tab-content">
        <Empty
          image={<Wallet size={48} strokeWidth={1.5} color="var(--semi-color-text-2)" />}
          title={t('requirements.costEstimate.locked')}
          description={lockedReason}
        />
      </div>
    );
  }

  return (
    <div className="cost-tab-content">
      <div className="cost-section">
        <div className="cost-section-header">
          <Title heading={6} style={{ margin: 0 }}>
            {t('requirements.costEstimate.inputSection')}
          </Title>
        </div>

        <div className="cost-block">
          <div className="cost-block-header">
            <Text strong>{t('requirements.costEstimate.laborByRole')}</Text>
            <Button
              size="small"
              theme="borderless"
              icon={<Plus size={14} strokeWidth={2} />}
              disabled={!editable}
              onClick={() => setRoles((p) => [...p, { role: '', people: 1, days: 1 }])}
            >
              {t('requirements.costEstimate.addRole')}
            </Button>
          </div>
          {roles.length === 0 && (
            <Text type="tertiary" size="small">
              {t('requirements.costEstimate.noRoles')}
            </Text>
          )}
          {roles.map((r, idx) => (
            <div key={idx} className="cost-role-row">
              <Select
                placeholder={t('requirements.costEstimate.selectRole')}
                value={r.role}
                disabled={!editable}
                onChange={(v) => updateRole(idx, { role: v as string })}
                optionList={ROLE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: `${t(`requirements.costEstimate.role.${o.value}`)} (¥${ROLE_DAILY_RATE[o.value]}/d)`,
                }))}
                style={{ flex: 2 }}
              />
              <InputNumber
                min={1}
                value={r.people}
                disabled={!editable}
                onChange={(v) => updateRole(idx, { people: Number(v) || 1 })}
                suffix={<Text type="tertiary" size="small">{t('requirements.costEstimate.people')}</Text>}
                style={{ flex: 1 }}
              />
              <InputNumber
                min={1}
                value={r.days}
                disabled={!editable}
                onChange={(v) => updateRole(idx, { days: Number(v) || 1 })}
                suffix={<Text type="tertiary" size="small">{t('requirements.costEstimate.days')}</Text>}
                style={{ flex: 1 }}
              />
              <Button
                icon={<Trash2 size={14} strokeWidth={2} />}
                theme="borderless"
                type="tertiary"
                disabled={!editable}
                onClick={() => setRoles((p) => p.filter((_, i) => i !== idx))}
              />
            </div>
          ))}
        </div>

        <div className="cost-block">
          <div className="cost-misc-row">
            <Text>{t('requirements.costEstimate.infra')}</Text>
            <InputNumber
              min={0}
              value={infra}
              disabled={!editable}
              onChange={(v) => setInfra(Number(v) || 0)}
              prefix="¥"
            />
          </div>
          <div className="cost-misc-row">
            <Text>{t('requirements.costEstimate.thirdParty')}</Text>
            <InputNumber
              min={0}
              value={thirdParty}
              disabled={!editable}
              onChange={(v) => setThirdParty(Number(v) || 0)}
              prefix="¥"
            />
          </div>
          <div className="cost-misc-row">
            <Text>{t('requirements.costEstimate.other')}</Text>
            <InputNumber
              min={0}
              value={other}
              disabled={!editable}
              onChange={(v) => setOther(Number(v) || 0)}
              prefix="¥"
            />
          </div>
        </div>
      </div>

      <div className="cost-section cost-section-result">
        <Title heading={6} style={{ margin: 0, marginBottom: 12 }}>
          {t('requirements.costEstimate.resultSection')}
        </Title>
        <div className="cost-result-grid">
          <div className="cost-result-cell">
            <Text type="tertiary" size="small">{t('requirements.costEstimate.totalPersonDays')}</Text>
            <Title heading={5} style={{ margin: 0 }}>{totals.totalPersonDays}</Title>
          </div>
          <div className="cost-result-cell">
            <Text type="tertiary" size="small">{t('requirements.costEstimate.laborCost')}</Text>
            <Title heading={5} style={{ margin: 0 }}>¥{totals.laborCost.toLocaleString()}</Title>
          </div>
          <div className="cost-result-cell">
            <Text type="tertiary" size="small">{t('requirements.costEstimate.nonLaborCost')}</Text>
            <Title heading={5} style={{ margin: 0 }}>¥{totals.nonLaborCost.toLocaleString()}</Title>
          </div>
          <div className="cost-result-cell cost-result-cell-total">
            <Text type="tertiary" size="small">{t('requirements.costEstimate.totalCost')}</Text>
            <Title heading={4} style={{ margin: 0, color: 'var(--semi-color-primary)' }}>
              ¥{totals.totalCost.toLocaleString()}
            </Title>
          </div>
        </div>

        <Input
          placeholder={t('requirements.costEstimate.roiPlaceholder')}
          value={roiNote}
          onChange={setRoiNote}
          disabled={!editable}
          showClear
          style={{ marginTop: 12 }}
        />
        {editable && (
          <Button
            theme="solid"
            type="primary"
            loading={submitting}
            onClick={handleSubmit}
            style={{ marginTop: 12 }}
            block
          >
            {t('requirements.costEstimate.save')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CostEstimateTab;
