import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Typography,
  Button,
  RadioGroup,
  Radio,
  InputNumber,
  Select,
  Toast,
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
  outputs: RoiOutputVariable[];
  requirement?: {
    id: string;
    reqNo?: string;
    title: string;
  } | null;
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

  useEffect(() => {
    setConfig(getRoiConfig(processId));
  }, [processId]);

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

  const rateInput = (
    <InputNumber
      min={0}
      precision={2}
      step={1}
      suffix={<span style={{ paddingRight: 8, color: 'var(--semi-color-text-2)' }}>元/小时</span>}
      value={config.baseHourlyRate}
      onChange={(v) => update({ baseHourlyRate: typeof v === 'number' ? v : undefined })}
      placeholder="请输入基础时薪"
      style={{ width: 260 }}
    />
  );

  return (
    <div className="roi-tab">
      {versionLabel && (
        <div className="roi-tab-version-bar">
          <Info size={12} strokeWidth={2} />
          业务量变量取自当前版本
          <Tag size="small" type="light" color="blue">{versionLabel}</Tag>
          <Tooltip content="切换版本可在『版本列表』Tab 中进行；ROI 字段保存在流程级别。">
            <span style={{ cursor: 'help', textDecoration: 'underline dotted' }}>说明</span>
          </Tooltip>
        </div>
      )}

      <div className="roi-tab-section">
        <div className="roi-tab-section-title">基础时薪</div>

        {referenceHourlyRate != null && requirement ? (
          <>
            <div className="roi-tab-rate-ref">
              <div className="roi-tab-rate-ref-info">
                <Text>
                  关联需求：
                  <Text strong>
                    {requirement.reqNo ? `[${requirement.reqNo}] ${requirement.title}` : requirement.title}
                  </Text>
                </Text>
                <Text type="tertiary" size="small">岗位成本（参考）：{fmtRate(referenceHourlyRate)}</Text>
              </div>
              <Button size="small" theme="solid" type="primary" onClick={useReferenceRate}>
                使用该值
              </Button>
            </div>
            <div className="roi-tab-field">
              <div className="roi-tab-field-label">自定义基础时薪</div>
              <div className="roi-tab-field-value">{rateInput}</div>
            </div>
          </>
        ) : (
          <>
            <div className="roi-tab-warning">
              <AlertTriangle size={14} strokeWidth={2} />
              当前流程未关联需求或需求未配置岗位成本，请手动输入基础时薪
            </div>
            <div className="roi-tab-field">
              <div className="roi-tab-field-label">基础时薪</div>
              <div className="roi-tab-field-value">{rateInput}</div>
            </div>
          </>
        )}

        {config.baseHourlyRate != null && (
          <div className="roi-tab-hint">
            当前生效基础时薪：<Text strong>{fmtRate(config.baseHourlyRate)}</Text>
          </div>
        )}
      </div>

      <div className="roi-tab-section">
        <div className="roi-tab-section-title">业务量模式</div>

        <div className="roi-tab-field">
          <div className="roi-tab-field-label">模式</div>
          <div className="roi-tab-field-value">
            <RadioGroup
              type="button"
              value={mode}
              onChange={(e) => update({ businessVolumeConfig: e.target.value as BusinessVolumeConfig })}
            >
              <Radio value="FIXED">FIXED 固定值</Radio>
              <Radio value="PARAM">PARAM 参数模式</Radio>
            </RadioGroup>
          </div>
        </div>

        {mode === 'FIXED' && (
          <div className="roi-tab-field">
            <div className="roi-tab-field-label">每次执行节省工时</div>
            <div className="roi-tab-field-value">
              <InputNumber
                min={0}
                precision={0}
                step={1}
                suffix={<span style={{ paddingRight: 8, color: 'var(--semi-color-text-2)' }}>分钟</span>}
                value={config.baseTimeSavedMinutes}
                onChange={(v) => update({ baseTimeSavedMinutes: typeof v === 'number' ? v : undefined })}
                placeholder="请输入"
                style={{ width: 260 }}
              />
            </div>
          </div>
        )}

        {mode === 'PARAM' && (
          <>
            <div className="roi-tab-field">
              <div className="roi-tab-field-label">业务量变量</div>
              <div className="roi-tab-field-value">
                <Select
                  value={config.selectedBusinessVolumeVariable}
                  onChange={(v) => update({ selectedBusinessVolumeVariable: v as string })}
                  placeholder={hasBusinessVolume ? '请选择' : '暂无可用的业务量变量'}
                  style={{ width: 320 }}
                  disabled={!hasBusinessVolume}
                  emptyContent="暂无可用的业务量变量"
                >
                  {businessVolumeOptions.map((o) => (
                    <Select.Option key={o.name} value={o.name}>
                      {(o.displayName || o.name) + (o.displayName ? ` (${o.name})` : '')}
                    </Select.Option>
                  ))}
                </Select>
                {!hasBusinessVolume && (
                  <div className="roi-tab-warning">
                    <AlertTriangle size={14} strokeWidth={2} />
                    请先在『版本列表』当前版本的「流程输出」中开启「业务量变量」开关
                  </div>
                )}
              </div>
            </div>

            <div className="roi-tab-field">
              <div className="roi-tab-field-label">每单位节省工时</div>
              <div className="roi-tab-field-value">
                <InputNumber
                  min={0}
                  precision={0}
                  step={1}
                  suffix={<span style={{ paddingRight: 8, color: 'var(--semi-color-text-2)' }}>分钟</span>}
                  value={config.baseTimeSavedMinutes}
                  onChange={(v) => update({ baseTimeSavedMinutes: typeof v === 'number' ? v : undefined })}
                  placeholder="请输入"
                  disabled={!hasBusinessVolume}
                  style={{ width: 260 }}
                />
                {hasBusinessVolume && config.selectedBusinessVolumeVariable && config.baseTimeSavedMinutes ? (
                  <span className="roi-tab-hint">
                    示例：每单位「{config.selectedBusinessVolumeVariable}」节省 {config.baseTimeSavedMinutes} 分钟
                  </span>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="roi-tab-footer">
        <Tooltip
          content={saveDisabled ? '当前没有可用的业务量变量，无法保存 PARAM 模式配置' : ''}
          trigger={saveDisabled ? 'hover' : 'custom'}
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
