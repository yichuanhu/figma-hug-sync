import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Descriptions,
  Tag,
  Progress,
} from '@douyinfe/semi-ui';
import type { LYRequirementROI } from '@/api';
import EmptyState from '@/components/EmptyState';

import './index.less';

const { Title, Text } = Typography;

interface ROIPanelProps {
  requirementId: string;
}

const generateMockROI = (requirementId: string): LYRequirementROI | null => {
  const seed = requirementId.charCodeAt(requirementId.length - 1) % 10;
  if (seed < 2) return null;

  const savingBase = [120000, 85000, 250000, 60000, 180000, 95000, 320000, 45000, 150000, 200000];
  const costBase = [30000, 25000, 80000, 15000, 50000, 35000, 100000, 12000, 40000, 65000];

  const estimated_annual_saving = savingBase[seed];
  const estimated_implementation_cost = costBase[seed];
  const estimated_payback_months = Math.round((estimated_implementation_cost / estimated_annual_saving) * 12);
  const estimated_roi_ratio = Math.round((estimated_annual_saving / estimated_implementation_cost) * 100) / 100;

  const hasActual = seed % 3 === 0;

  return {
    id: `roi-${requirementId}`,
    requirement_id: requirementId,
    estimated_annual_saving,
    estimated_implementation_cost,
    estimated_payback_months,
    estimated_roi_ratio,
    actual_saving: hasActual ? Math.round(estimated_annual_saving * (0.8 + Math.random() * 0.4)) : null,
    actual_cost: hasActual ? Math.round(estimated_implementation_cost * (0.9 + Math.random() * 0.3)) : null,
    actual_roi_ratio: hasActual ? Math.round(estimated_roi_ratio * (0.85 + Math.random() * 0.3) * 100) / 100 : null,
    updated_at: '2026-03-12T09:15:00Z',
  };
};

const formatCurrency = (value: number) => {
  return `¥${value.toLocaleString()}`;
};

const ROIPanel: React.FC<ROIPanelProps> = ({ requirementId }) => {
  const { t } = useTranslation();
  const roi = useMemo(() => generateMockROI(requirementId), [requirementId]);

  if (!roi) {
    return (
      <div className="roi-panel-empty">
        <EmptyState
          variant="noData"
          description={t('requirement.roi.noROIDesc')}
        />
      </div>
    );
  }

  const roiHealthColor = roi.estimated_roi_ratio >= 3 ? 'green' : roi.estimated_roi_ratio >= 1.5 ? 'blue' : 'orange';
  const roiHealthLabel = roi.estimated_roi_ratio >= 3
    ? t('requirement.roi.healthExcellent')
    : roi.estimated_roi_ratio >= 1.5
      ? t('requirement.roi.healthGood')
      : t('requirement.roi.healthFair');

  const estimatedData = [
    {
      key: t('requirement.roi.annualSaving'),
      value: <Text style={{ color: 'var(--semi-color-success)' }}>{formatCurrency(roi.estimated_annual_saving)}</Text>,
    },
    {
      key: t('requirement.roi.implementationCost'),
      value: formatCurrency(roi.estimated_implementation_cost),
    },
    {
      key: t('requirement.roi.paybackMonths'),
      value: `${roi.estimated_payback_months} ${t('requirement.roi.months')}`,
    },
    {
      key: t('requirement.roi.roiRatio'),
      value: (
        <span>
          {roi.estimated_roi_ratio}x{' '}
          <Tag color={roiHealthColor} size="small">{roiHealthLabel}</Tag>
        </span>
      ),
    },
  ];

  const hasActualData = roi.actual_saving != null;

  const actualData = hasActualData ? [
    {
      key: t('requirement.roi.actualSaving'),
      value: <Text style={{ color: 'var(--semi-color-success)' }}>{formatCurrency(roi.actual_saving!)}</Text>,
    },
    {
      key: t('requirement.roi.actualCost'),
      value: formatCurrency(roi.actual_cost!),
    },
    {
      key: t('requirement.roi.actualROIRatio'),
      value: `${roi.actual_roi_ratio}x`,
    },
  ] : [];

  const savingsPercent = hasActualData
    ? Math.min(Math.round((roi.actual_saving! / roi.estimated_annual_saving) * 100), 150)
    : 0;

  return (
    <div className="roi-panel">
      {/* ROI Summary Card */}
      <div className="roi-panel-summary">
        <div className="roi-panel-summary-item">
          <Text size="small" type="tertiary">{t('requirement.roi.roiRatio')}</Text>
          <div className="roi-panel-summary-value">
            <Text style={{ fontSize: 24, fontWeight: 600 }}>{roi.estimated_roi_ratio}x</Text>
          </div>
          <Tag color={roiHealthColor} size="small">{roiHealthLabel}</Tag>
        </div>
        <div className="roi-panel-summary-divider" />
        <div className="roi-panel-summary-item">
          <Text size="small" type="tertiary">{t('requirement.roi.paybackMonths')}</Text>
          <div className="roi-panel-summary-value">
            <Text style={{ fontSize: 24, fontWeight: 600 }}>{roi.estimated_payback_months}</Text>
            <Text size="small" type="tertiary"> {t('requirement.roi.months')}</Text>
          </div>
        </div>
        <div className="roi-panel-summary-divider" />
        <div className="roi-panel-summary-item">
          <Text size="small" type="tertiary">{t('requirement.roi.annualSaving')}</Text>
          <div className="roi-panel-summary-value">
            <Text style={{ fontSize: 24, fontWeight: 600, color: 'var(--semi-color-success)' }}>
              {formatCurrency(roi.estimated_annual_saving)}
            </Text>
          </div>
        </div>
      </div>

      {/* Estimated Section */}
      <div className="roi-panel-section">
        <Title heading={6} className="roi-panel-section-title">
          <span className="roi-panel-section-indicator" />
          {t('requirement.roi.estimatedTitle')}
        </Title>
        <Descriptions data={estimatedData} align="left" />
      </div>

      {/* Actual Section */}
      {hasActualData && (
        <div className="roi-panel-section">
          <Title heading={6} className="roi-panel-section-title">
            <span className="roi-panel-section-indicator" />
            {t('requirement.roi.actualTitle')}
          </Title>
          <Descriptions data={actualData} align="left" />
          <div className="roi-panel-achievement">
            <Text size="small" type="tertiary">
              {t('requirement.roi.savingsAchievement')}
            </Text>
            <Progress
              percent={savingsPercent}
              showInfo
              strokeWidth={8}
              style={{ marginTop: 4 }}
            />
          </div>
        </div>
      )}

      <div className="roi-panel-updated">
        <Text size="small" type="tertiary">
          {t('common.updateTime')}：{new Date(roi.updated_at).toLocaleString('zh-CN')}
        </Text>
      </div>
    </div>
  );
};

export default ROIPanel;
