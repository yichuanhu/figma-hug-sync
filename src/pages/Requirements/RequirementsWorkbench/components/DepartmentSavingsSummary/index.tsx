import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@douyinfe/semi-ui';
import { Wallet } from 'lucide-react';
import type { RequirementItem } from '../../types';
import './index.less';

const { Text, Title } = Typography;

interface Props {
  list: RequirementItem[];
}

interface DeptAgg {
  department: string;
  count: number;
  savedAmount: number;
  savedDays: number;
}

const DepartmentSavingsSummary = ({ list }: Props) => {
  const { t } = useTranslation();

  const aggregated = useMemo<DeptAgg[]>(() => {
    const map = new Map<string, DeptAgg>();
    list.forEach((r) => {
      if (!r.costEstimate) return;
      const key = r.owning_department_name || '—';
      const cur = map.get(key) ?? { department: key, count: 0, savedAmount: 0, savedDays: 0 };
      cur.count += 1;
      cur.savedAmount += r.costEstimate.monthlySavedAmount;
      cur.savedDays += r.costEstimate.monthlySavedPersonDays;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.savedAmount - a.savedAmount);
  }, [list]);

  if (aggregated.length === 0) return null;

  return (
    <div className="dept-savings-summary">
      <div className="dept-savings-summary-header">
        <Wallet size={14} strokeWidth={2} color="var(--semi-color-primary)" />
        <Text strong>{t('requirements.costEstimate.departmentSummary.title')}</Text>
      </div>
      <div className="dept-savings-summary-grid">
        {aggregated.map((d) => (
          <div key={d.department} className="dept-savings-summary-card">
            <div className="dept-savings-summary-card-header">
              <Text strong>{d.department}</Text>
              <Text type="tertiary" size="small">
                {d.count} {t('requirements.costEstimate.departmentSummary.requirements')}
              </Text>
            </div>
            <div className="dept-savings-summary-card-metrics">
              <div className="dept-savings-summary-metric">
                <Text type="tertiary" size="small">
                  {t('requirements.costEstimate.departmentSummary.savedAmount')}
                </Text>
                <Title heading={5} style={{ margin: 0, color: 'var(--semi-color-primary)' }}>
                  ¥{Math.round(d.savedAmount).toLocaleString()}
                </Title>
              </div>
              <div className="dept-savings-summary-metric">
                <Text type="tertiary" size="small">
                  {t('requirements.costEstimate.departmentSummary.savedDays')}
                </Text>
                <Title heading={5} style={{ margin: 0 }}>
                  {d.savedDays.toFixed(1)} d
                </Title>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentSavingsSummary;
