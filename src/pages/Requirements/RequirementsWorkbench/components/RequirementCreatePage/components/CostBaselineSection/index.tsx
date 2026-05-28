/**
 * 成本基线步骤（STORY-003 v6 / STORY-020）
 *
 * - 顶部 Banner 提示快照口径
 * - 成本项多选（来源「成本基线配置」），选中后以表格展示快照
 * - 执行频率 / 单次时长（Semi Form 字段，由父级 Form 管理）
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Banner, Form, Select, Table, Tag, Typography, Button, Empty, Tooltip } from '@douyinfe/semi-ui';
import { Trash2, Wallet, ArrowUpRight, HelpCircle } from 'lucide-react';
import {
  listCostBaselineItems,
  subscribeCostBaselineChange,
  COST_TYPE_LABEL,
  COST_TYPE_TAG_COLOR,
  type CostBaselineItem,
} from '@/mocks/requirementCostBaseline';
import './index.less';

const { Text } = Typography;

/** 需求快照内的成本项 */
export interface RequirementCostItemSnapshot {
  id: string;
  cost_type: CostBaselineItem['cost_type'];
  name: string;
  daily_cost: number;
  currency: string;
  snapshot_at: string;
}

interface Props {
  value: RequirementCostItemSnapshot[];
  onChange: (next: RequirementCostItemSnapshot[]) => void;
  /** 编辑态：旧数据仅含 position_costs 等遗留字段时展示提示 */
  legacyDeprecated?: boolean;
}

/** 标签 + tooltip 帮助图标 */
const LabelWithHelp = ({ text, tip }: { text: ReactNode; tip: ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    {text}
    <Tooltip position="top" content={<div style={{ maxWidth: 280, lineHeight: 1.6 }}>{tip}</div>}>
      <HelpCircle size={14} strokeWidth={2} color="var(--semi-color-text-2)" style={{ cursor: 'help' }} />
    </Tooltip>
  </span>
);

const CostBaselineSection = ({
  value,
  onChange,
  legacyDeprecated,
}: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<CostBaselineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    listCostBaselineItems().then((list) => {
      setItems(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    refresh();
    return subscribeCostBaselineChange(refresh);
  }, []);

  const selectedIds = useMemo(() => value.map((x) => x.id), [value]);

  const handleSelectChange = (next: unknown) => {
    const ids = (next as string[]) ?? [];
    const ts = new Date().toISOString();
    // 保留已选的快照顺序与时间戳，新增的拼装最新快照
    const prevById = new Map(value.map((x) => [x.id, x]));
    const merged: RequirementCostItemSnapshot[] = ids
      .map((id) => {
        const prev = prevById.get(id);
        if (prev) return prev;
        const src = items.find((x) => x.id === id);
        if (!src) return null;
        return {
          id: src.id,
          cost_type: src.cost_type,
          name: src.name,
          daily_cost: src.daily_cost,
          currency: src.currency,
          snapshot_at: ts,
        };
      })
      .filter(Boolean) as RequirementCostItemSnapshot[];
    onChange(merged);
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((x) => x.id !== id));
  };

  const goConfig = () => navigate('/requirements/cost-baseline');

  const isEmpty = !loading && items.length === 0;

  return (
    <div className="cost-baseline-section">
      <Banner
        type="info"
        fullMode={false}
        closeIcon={null}
        style={{ marginBottom: 16 }}
        icon={<Wallet size={16} strokeWidth={2} />}
        description={
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span>{t('requirements.form.costBaseline.banner')}</span>
            <Button
              theme="borderless"
              type="primary"
              size="small"
              icon={<ArrowUpRight size={14} strokeWidth={2} />}
              iconPosition="right"
              onClick={goConfig}
              style={{ paddingLeft: 4, paddingRight: 4 }}
            >
              {t('requirements.form.costBaseline.goConfig')}
            </Button>
          </div>
        }
      />

      {legacyDeprecated && (
        <Banner
          type="warning"
          fullMode={false}
          closeIcon={null}
          style={{ marginBottom: 16 }}
          description={t('requirements.form.costBaseline.legacyDeprecated')}
        />
      )}

      <Form.Slot
        label={{
          text: (
            <LabelWithHelp
              text={t('requirements.form.costBaseline.selectorLabel')}
              tip={t('requirements.form.costBaseline.tooltip.selector')}
            />
          ),
        }}
      >
        {isEmpty ? (
          <Empty
            image={<Wallet size={32} strokeWidth={1.5} />}
            title={t('requirements.form.costBaseline.empty')}
            style={{ padding: '24px 0' }}
          >
            <Button theme="solid" type="primary" onClick={goConfig}>
              {t('requirements.form.costBaseline.goConfig')}
            </Button>
          </Empty>
        ) : (
          <Select
            multiple
            filter
            value={selectedIds}
            onChange={handleSelectChange}
            placeholder={t('requirements.form.costBaseline.selectorPlaceholder')}
            optionList={items.map((it) => ({
              value: it.id,
              label: it.name,
              showTick: true,
              cost_type: it.cost_type,
              daily_cost: it.daily_cost,
              currency: it.currency,
            }))}
            renderSelectedItem={(option) => ({
              isRenderInTag: true,
              content: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Tag
                    color={COST_TYPE_TAG_COLOR[(option as { cost_type: CostBaselineItem['cost_type'] }).cost_type]}
                    size="small"
                    type="light"
                  >
                    {COST_TYPE_LABEL[(option as { cost_type: CostBaselineItem['cost_type'] }).cost_type]}
                  </Tag>
                  {option.label}
                </span>
              ),
            })}
            renderOptionItem={(props) => {
              const {
                onMouseEnter,
                onClick,
                selected,
                cost_type,
                daily_cost,
                currency,
                label,
              } = props as {
                onMouseEnter?: () => void;
                onClick?: () => void;
                selected?: boolean;
                cost_type: CostBaselineItem['cost_type'];
                daily_cost: number;
                currency: string;
                label: string;
              };
              return (
                <div
                  className={`cost-baseline-option${selected ? ' selected' : ''}`}
                  onMouseEnter={onMouseEnter}
                  onClick={onClick}
                >
                  <Tag color={COST_TYPE_TAG_COLOR[cost_type]} size="small" type="light">
                    {COST_TYPE_LABEL[cost_type]}
                  </Tag>
                  <span className="cost-baseline-option-name">{label}</span>
                  <Text type="tertiary" size="small" className="cost-baseline-option-cost">
                    {currency} {daily_cost.toLocaleString()} {t('requirements.form.costBaseline.dailyCostUnit')}
                  </Text>
                </div>
              );
            }}
            style={{ width: '100%' }}
          />
        )}
      </Form.Slot>

      {value.length > 0 && (
        <div className="cost-baseline-selected">
          <Text type="tertiary" size="small" className="cost-baseline-selected-title">
            {t('requirements.form.costBaseline.selectedTitle')} · {value.length}
          </Text>
          <Table
            size="small"
            dataSource={value}
            pagination={false}
            rowKey="id"
            columns={[
              {
                title: t('requirements.form.costBaseline.colType'),
                dataIndex: 'cost_type',
                width: 100,
                render: (v: CostBaselineItem['cost_type']) => (
                  <Tag color={COST_TYPE_TAG_COLOR[v]} size="small" type="light">
                    {COST_TYPE_LABEL[v]}
                  </Tag>
                ),
              },
              {
                title: t('requirements.form.costBaseline.colName'),
                dataIndex: 'name',
                ellipsis: { showTitle: true },
              },
              {
                title: (
                  <LabelWithHelp
                    text={t('requirements.form.costBaseline.colDailyCost')}
                    tip={t('requirements.form.costBaseline.tooltip.dailyCost')}
                  />
                ),
                dataIndex: 'daily_cost',
                width: 180,
                align: 'right',
                render: (v: number, row: RequirementCostItemSnapshot) =>
                  `${row.currency} ${v.toLocaleString()} ${t('requirements.form.costBaseline.dailyCostUnit')}`,
              },
              {
                title: t('requirements.form.costBaseline.colAction'),
                width: 80,
                align: 'center',
                render: (_: unknown, row: RequirementCostItemSnapshot) => (
                  <Button
                    icon={<Trash2 size={14} strokeWidth={2} />}
                    theme="borderless"
                    type="tertiary"
                    size="small"
                    onClick={() => handleRemove(row.id)}
                  />
                ),
              },
            ]}
          />
        </div>
      )}

      <Form.Select
        field="execution_frequency"
        label={t('requirements.form.costBaseline.executionFrequency')}
        placeholder={t('requirements.form.costBaseline.executionFrequency')}
        optionList={executionFrequencyOptions}
        showClear
        style={{ width: '100%' }}
      />
      <Form.InputNumber
        field="single_duration"
        label={t('requirements.form.costBaseline.singleDuration')}
        placeholder={t('requirements.form.costBaseline.singleDuration')}
        min={0}
        precision={0}
        hideButtons
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default CostBaselineSection;
