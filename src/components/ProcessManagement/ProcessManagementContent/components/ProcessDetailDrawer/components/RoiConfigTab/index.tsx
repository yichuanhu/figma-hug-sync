import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Typography,
  Button,
  RadioGroup,
  Radio,
  InputNumber,
  Select,
  Toast,
  Space,
  Tag,
  Tooltip,
} from '@douyinfe/semi-ui';
import { AlertTriangle, Info } from 'lucide-react';
import {
  getRoiConfig,
  saveRoiConfig,
  getOutputFlags,
  type ProcessRoiConfig,
  type BusinessVolumeConfig,
} from '../../roiStorage';
import './index.less';

const { Text } = Typography;

export interface RoiOutputVariable {
  name: string;
  displayName?: string;
  type?: string;
}

interface RoiConfigTabProps {
  processId: string;
  versionId: string | null;
  versionLabel?: string;
  /** 当前选中版本的输出变量列表（仅 name/displayName/type） */
  outputs: RoiOutputVariable[];
  /** 关联需求基础信息 */
  requirement?: {
    id: string;
    reqNo?: string;
    title: string;
  } | null;
  /** 引用的需求岗位时薪（元/小时）。null 表示需求未配置岗位成本 */
  referenceHourlyRate: number | null;
}

const fmtRate = (n: number) => `¥${n.toFixed(2)}/小时`;

const RoiConfigTab = ({
  processId,
  versionId,
  versionLabel,
  outputs,
  requirement,
  referenceHourlyRate,
}: RoiConfigTabProps) => {
  const [config, setConfig] = useState<ProcessRoiConfig>(() => getRoiConfig(processId));

  // processId 变化时重新加载
  useEffect(() => {
    setConfig(getRoiConfig(processId));
  }, [processId]);

  // 当前版本下被标记为业务量变量的输出
  const businessVolumeOptions = useMemo(() => {
    if (!versionId) return [] as RoiOutputVariable[];
    const flags = getOutputFlags(processId, versionId);
    return outputs.filter((o) => flags[o.name]);
  }, [processId, versionId, outputs]);

  const hasBusinessVolume = businessVolumeOptions.length > 0;
  const mode: BusinessVolumeConfig = config.businessVolumeConfig ?? 'FIXED';

  const update = (patch: Partial<ProcessRoiConfig>) =>
    setConfig((prev) => ({ ...prev, ...patch }));

  const useReferenceRate = () => {
    if (referenceHourlyRate == null) return;
    update({ baseHourlyRate: Number(referenceHourlyRate.toFixed(2)) });
  };

  const validate = useCallback((): string | null => {
    const { baseHourlyRate, businessVolumeConfig, baseTimeSavedMinutes, selectedBusinessVolumeVariable } = config;
    if (baseHourlyRate != null && baseHourlyRate <= 0) {
      return '基础时薪必须大于 0';
    }
    if (businessVolumeConfig === 'FIXED') {
      if (baseTimeSavedMinutes == null || baseTimeSavedMinutes <= 0) {
        return 'FIXED 模式必须设置基准节省时间，且必须大于 0';
      }
    }
    if (businessVolumeConfig === 'PARAM') {
      if (!selectedBusinessVolumeVariable) {
        return 'PARAM 模式必须选择一个业务量变量';
      }
      // VAL-ROI-06：选中的变量已被取消标记
      if (!businessVolumeOptions.some((o) => o.name === selectedBusinessVolumeVariable)) {
        return '所选业务量变量已失效，请重新选择';
      }
      if (baseTimeSavedMinutes == null || baseTimeSavedMinutes <= 0) {
        return 'PARAM 模式必须设置每单位节省工时，且必须大于 0';
      }
    }
    return null;
  }, [config, businessVolumeOptions]);

  const saveDisabled = mode === 'PARAM' && !hasBusinessVolume;

  const handleSave = () => {
    const err = validate();
    if (err) {
      Toast.error(err);
      return;
    }
    saveRoiConfig(processId, config);
    Toast.success('ROI 配置已保存');
  };

  const renderRateSection = () => {
    if (referenceHourlyRate != null && requirement) {
      return (
        <>
          <div className="process-roi-tab-rate-card">
            <div className="process-roi-tab-rate-card-info">
              <Text>
                需求：
                <Text strong>{requirement.reqNo ? `[${requirement.reqNo}] ${requirement.title}` : requirement.title}</Text>
              </Text>
              <Text type="tertiary">岗位成本（参考）：{fmtRate(referenceHourlyRate)}</Text>
            </div>
            <div className="process-roi-tab-rate-card-actions">
              <Button size="small" theme="solid" type="primary" onClick={useReferenceRate}>
                使用该值
              </Button>
            </div>
          </div>
          <div className="process-roi-tab-field-row">
            <span className="process-roi-tab-field-label">自定义基础时薪</span>
            <InputNumber
              min={0}
              precision={2}
              step={1}
              suffix={<span style={{ paddingRight: 8, color: 'var(--semi-color-text-2)' }}>元/小时</span>}
              value={config.baseHourlyRate}
              onChange={(v) => update({ baseHourlyRate: typeof v === 'number' ? v : undefined })}
              placeholder="请输入基础时薪"
              style={{ width: 220 }}
            />
          </div>
        </>
      );
    }
    return (
      <>
        <div className="process-roi-tab-warning">
          <AlertTriangle size={14} strokeWidth={2} />
          当前流程未关联需求或需求未配置岗位成本，请手动输入基础时薪
        </div>
        <div className="process-roi-tab-field-row" style={{ marginTop: 12 }}>
          <span className="process-roi-tab-field-label">基础时薪</span>
          <InputNumber
            min={0}
            precision={2}
            step={1}
            suffix={<span style={{ paddingRight: 8, color: 'var(--semi-color-text-2)' }}>元/小时</span>}
            value={config.baseHourlyRate}
            onChange={(v) => update({ baseHourlyRate: typeof v === 'number' ? v : undefined })}
            placeholder="请输入基础时薪"
            style={{ width: 220 }}
          />
        </div>
      </>
    );
  };

  return (
    <div className="process-roi-tab">
      {versionLabel && (
        <div className="process-roi-tab-version-bar">
          <Info size={14} strokeWidth={2} />
          业务量变量取自当前版本：<Tag size="small" type="light" color="blue">{versionLabel}</Tag>
          <Tooltip content="切换版本可在『版本列表』Tab 中进行；ROI 字段保存在流程级别。">
            <span style={{ cursor: 'help', textDecoration: 'underline dotted' }}>说明</span>
          </Tooltip>
        </div>
      )}

      <div className="process-roi-tab-section">
        <div className="process-roi-tab-section-title">基础时薪</div>
        {renderRateSection()}
        {config.baseHourlyRate != null && (
          <div className="process-roi-tab-rate-current">
            当前生效基础时薪：<Text strong>{fmtRate(config.baseHourlyRate)}</Text>
          </div>
        )}
      </div>

      <div className="process-roi-tab-section">
        <div className="process-roi-tab-section-title">业务量模式</div>
        <RadioGroup
          type="button"
          value={mode}
          onChange={(e) => update({ businessVolumeConfig: e.target.value as BusinessVolumeConfig })}
          style={{ marginBottom: 16 }}
        >
          <Radio value="FIXED">FIXED 固定值</Radio>
          <Radio value="PARAM">PARAM 参数模式</Radio>
        </RadioGroup>

        {mode === 'FIXED' && (
          <div className="process-roi-tab-field-row">
            <span className="process-roi-tab-field-label">每次执行固定节省工时</span>
            <InputNumber
              min={0}
              precision={0}
              step={1}
              suffix={<span style={{ paddingRight: 8, color: 'var(--semi-color-text-2)' }}>分钟</span>}
              value={config.baseTimeSavedMinutes}
              onChange={(v) => update({ baseTimeSavedMinutes: typeof v === 'number' ? v : undefined })}
              placeholder="请输入"
              style={{ width: 220 }}
            />
          </div>
        )}

        {mode === 'PARAM' && (
          <Space vertical align="start" style={{ width: '100%' }} spacing={12}>
            <div className="process-roi-tab-field-row">
              <span className="process-roi-tab-field-label">业务量变量</span>
              <Select
                value={config.selectedBusinessVolumeVariable}
                onChange={(v) => update({ selectedBusinessVolumeVariable: v as string })}
                placeholder={hasBusinessVolume ? '请选择' : '暂无可用的业务量变量'}
                style={{ width: 280 }}
                disabled={!hasBusinessVolume}
                emptyContent="暂无可用的业务量变量"
              >
                {businessVolumeOptions.map((o) => (
                  <Select.Option key={o.name} value={o.name}>
                    {(o.displayName || o.name) + (o.displayName ? ` (${o.name})` : '')}
                  </Select.Option>
                ))}
              </Select>
            </div>
            {!hasBusinessVolume && (
              <div className="process-roi-tab-warning">
                <AlertTriangle size={14} strokeWidth={2} />
                暂无可用的业务量变量，请先在『版本列表』下当前版本的「流程输出」中开启「业务量变量」开关
              </div>
            )}
            <div className="process-roi-tab-field-row">
              <span className="process-roi-tab-field-label">每单位节省工时</span>
              <InputNumber
                min={0}
                precision={0}
                step={1}
                suffix={<span style={{ paddingRight: 8, color: 'var(--semi-color-text-2)' }}>分钟</span>}
                value={config.baseTimeSavedMinutes}
                onChange={(v) => update({ baseTimeSavedMinutes: typeof v === 'number' ? v : undefined })}
                placeholder="请输入"
                disabled={!hasBusinessVolume}
                style={{ width: 220 }}
              />
            </div>
            {hasBusinessVolume && config.selectedBusinessVolumeVariable && config.baseTimeSavedMinutes ? (
              <Text type="tertiary" size="small">
                示例：每单位「{config.selectedBusinessVolumeVariable}」节省 {config.baseTimeSavedMinutes} 分钟
              </Text>
            ) : null}
          </Space>
        )}
      </div>

      <div className="process-roi-tab-footer">
        <Tooltip
          content={saveDisabled ? '当前没有可用的业务量变量，无法保存 PARAM 模式配置' : ''}
          trigger={saveDisabled ? 'mouseenter' : 'custom'}
        >
          <Button theme="solid" type="primary" onClick={handleSave} disabled={saveDisabled}>
            保存
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default RoiConfigTab;
