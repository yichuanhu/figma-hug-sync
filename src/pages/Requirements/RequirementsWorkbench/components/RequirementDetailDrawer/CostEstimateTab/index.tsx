import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Empty, Tag, Typography } from '@douyinfe/semi-ui';
import { Wallet } from 'lucide-react';
import type { RequirementItem } from '../../../types';
import { computeCostEstimate, getActiveSchemeCostConfig } from '../../../mockData';
import './index.less';

const { Text, Title } = Typography;

interface Props {
  data: RequirementItem;
}

const fmtNum = (n: number, digits = 2) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const CostEstimateTab = ({ data }: Props) => {
  const { t } = useTranslation();

  // 优先使用持久化结果（含基线快照），否则基于 baselineFormData 实时计算
  const estimate = useMemo(() => {
    if (data.costEstimate) return data.costEstimate;
    if (data.baselineFormData) {
      return computeCostEstimate(data.baselineFormData, getActiveSchemeCostConfig());
    }
    return null;
  }, [data.costEstimate, data.baselineFormData]);

  if (!estimate) {
    return (
      <div className="cost-tab-content">
        <Empty
          image={<Wallet size={48} strokeWidth={1.5} color="var(--semi-color-text-2)" />}
          title={t('requirements.costEstimate.noBaselineTitle')}
          description={t('requirements.costEstimate.noBaselineDesc')}
        />
      </div>
    );
  }

  const {
    frequency,
    durationMinutes,
    automationRatio,
    jobLevel,
    workingHoursPerDay,
    dailyRate,
    schemeName,
    monthlySavedHours,
    monthlySavedPersonDays,
    monthlySavedAmount,
  } = estimate;

  return (
    <div className="cost-tab-content">
      {/* 第 1 段：基线数据 */}
      <div className="cost-section">
        <div className="cost-section-header">
          <Title heading={6} style={{ margin: 0 }}>
            {t('requirements.costEstimate.baselineSection')}
          </Title>
          <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 4 }}>
            {t('requirements.costEstimate.baselineDesc')}
          </Text>
        </div>
        <div className="cost-baseline-grid">
          <div className="cost-baseline-item">
            <Text type="tertiary" size="small">
              {t('requirements.costEstimate.baseline.frequency')}
            </Text>
            <Title className="cost-baseline-value" heading={4} style={{ margin: 0, fontSize: 16 }}>
              {frequency} {t('requirements.costEstimate.unit.timesPerMonth')}
            </Title>
          </div>
          <div className="cost-baseline-item">
            <Text type="tertiary" size="small">
              {t('requirements.costEstimate.baseline.duration')}
            </Text>
            <Title className="cost-baseline-value" heading={4} style={{ margin: 0, fontSize: 16 }}>
              {durationMinutes} {t('requirements.costEstimate.unit.minutes')}
            </Title>
          </div>
          <div className="cost-baseline-item">
            <Text type="tertiary" size="small">
              {t('requirements.costEstimate.baseline.automationRatio')}
            </Text>
            <Title className="cost-baseline-value" heading={4} style={{ margin: 0, fontSize: 16 }}>
              {Math.round(automationRatio * 100)}%
            </Title>
          </div>
          <div className="cost-baseline-item">
            <Text type="tertiary" size="small">
              {t('requirements.costEstimate.baseline.jobLevel')}
            </Text>
            <div className="cost-baseline-tag-wrap">
              <Tag color="blue" type="light">{jobLevel}</Tag>
            </div>
          </div>
        </div>
      </div>

      {/* 第 2 段：预估节省 */}
      <div className="cost-section cost-section-result">
        <div className="cost-section-header">
          <Title heading={6} style={{ margin: 0 }}>
            {t('requirements.costEstimate.savedSection')}
          </Title>
          <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 4 }}>
            {t('requirements.costEstimate.savedSubtitle', {
              scheme: schemeName ?? t('requirements.costEstimate.defaultScheme'),
              jobLevel,
              dailyRate: dailyRate.toLocaleString(),
              hours: workingHoursPerDay,
            })}
          </Text>
        </div>
        <div className="cost-result-grid cost-result-grid-3">
          <div className="cost-result-cell">
            <Text type="tertiary" size="small">{t('requirements.costEstimate.savedHours')}</Text>
            <Title heading={4} style={{ margin: 0, fontSize: 16 }}>{fmtNum(monthlySavedHours)} h</Title>
          </div>
          <div className="cost-result-cell">
            <Text type="tertiary" size="small">{t('requirements.costEstimate.savedPersonDays')}</Text>
            <Title heading={4} style={{ margin: 0, fontSize: 16 }}>{fmtNum(monthlySavedPersonDays)} d</Title>
          </div>
          <div className="cost-result-cell cost-result-cell-total">
            <Text type="tertiary" size="small">{t('requirements.costEstimate.savedAmount')}</Text>
            <Title heading={4} style={{ margin: 0, fontSize: 16, color: 'var(--semi-color-primary)' }}>
              ¥{Math.round(monthlySavedAmount).toLocaleString()}
            </Title>
          </div>
        </div>
      </div>

      {/* 第 3 段：计算公式 */}
      <div className="cost-section">
        <div className="cost-section-header">
          <Title heading={6} style={{ margin: 0 }}>
            {t('requirements.costEstimate.formulaTitle')}
          </Title>
          <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 4 }}>
            {t('requirements.costEstimate.formulaDesc')}
          </Text>
        </div>
        <div className="cost-formula-block">
          <div>
            {t('requirements.costEstimate.savedHours')} = {frequency} × {durationMinutes}{' '}
            {t('requirements.costEstimate.unit.minutes')} × {Math.round(automationRatio * 100)}% / 60 ={' '}
            <strong>{fmtNum(monthlySavedHours)} h</strong>
          </div>
          <div>
            {t('requirements.costEstimate.savedPersonDays')} = {fmtNum(monthlySavedHours)} h /{' '}
            {workingHoursPerDay} h = <strong>{fmtNum(monthlySavedPersonDays)} d</strong>
          </div>
          <div>
            {t('requirements.costEstimate.savedAmount')} = {fmtNum(monthlySavedPersonDays)} d × ¥
            {dailyRate.toLocaleString()}/d ={' '}
            <strong>¥{Math.round(monthlySavedAmount).toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostEstimateTab;
