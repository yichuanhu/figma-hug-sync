import { useState } from 'react';
import { Input, InputNumber, Switch, TagInput } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import ConfigSection, { Field } from '../ConfigSection';
import { mockMonitoring } from '../../mockData';
import type { MonitoringConfig } from '../../types';

interface Props { advanced: boolean; }

const MonitoringConfigTab = ({ advanced }: Props) => {
  const { t } = useTranslation();
  const [data, setData] = useState<MonitoringConfig>(mockMonitoring);

  return (
    <div>
      <ConfigSection title={t('maintenance.config.monitoring.trace')}>
        <Field label={t('maintenance.config.service.enabled')}>
          <Switch checked={data.trace.enabled} onChange={(c) => setData({ ...data, trace: { ...data.trace, enabled: c } })} />
        </Field>
        <Field label={t('maintenance.config.monitoring.samplerRatio')}>
          <InputNumber value={data.trace.sampler_ratio} step={0.1} min={0} max={1} onChange={(v) => setData({ ...data, trace: { ...data.trace, sampler_ratio: Number(v) } })} style={{ width: '100%' }} />
        </Field>
        <Field label="Excluded URLs" full>
          <TagInput value={data.trace.excluded_urls} onChange={(v) => setData({ ...data, trace: { ...data.trace, excluded_urls: v as string[] } })} />
        </Field>
      </ConfigSection>

      <ConfigSection title={t('maintenance.config.monitoring.healthCheck')}>
        <Field label={t('maintenance.config.monitoring.interval')}>
          <InputNumber value={data.health_check.interval} onChange={(v) => setData({ ...data, health_check: { ...data.health_check, interval: Number(v) } })} style={{ width: '100%' }} />
        </Field>
        <Field label={t('maintenance.config.monitoring.action')}>
          <Input value={data.health_check.action} onChange={(v) => setData({ ...data, health_check: { ...data.health_check, action: v } })} />
        </Field>
      </ConfigSection>

      <ConfigSection title={t('maintenance.config.monitoring.event')}>
        <Field label={t('maintenance.config.monitoring.dbPolling')}>
          <InputNumber value={data.event.database_polling_interval} onChange={(v) => setData({ ...data, event: { ...data.event, database_polling_interval: Number(v) } })} style={{ width: '100%' }} />
        </Field>
        <Field label={t('maintenance.config.monitoring.redisResubscribe')}>
          <InputNumber value={data.event.redis_resubscribe_interval} onChange={(v) => setData({ ...data, event: { ...data.event, redis_resubscribe_interval: Number(v) } })} style={{ width: '100%' }} />
        </Field>
      </ConfigSection>

      {advanced && (
        <>
          <ConfigSection title={t('maintenance.config.monitoring.registry')}>
            <Field label="Keepalive Interval">
              <InputNumber value={data.registry.keepalive_interval} onChange={(v) => setData({ ...data, registry: { ...data.registry, keepalive_interval: Number(v) } })} style={{ width: '100%' }} />
            </Field>
            <Field label="Initialize Timeout">
              <InputNumber value={data.registry.initialize_timeout} onChange={(v) => setData({ ...data, registry: { ...data.registry, initialize_timeout: Number(v) } })} style={{ width: '100%' }} />
            </Field>
          </ConfigSection>

          <ConfigSection title={t('maintenance.config.monitoring.scheduler')}>
            <Field label="Max Duration">
              <InputNumber value={data.scheduler.max_duration} onChange={(v) => setData({ ...data, scheduler: { ...data.scheduler, max_duration: Number(v) } })} style={{ width: '100%' }} />
            </Field>
            <Field label="Log Keep Days">
              <InputNumber value={data.scheduler.log_keep_days} onChange={(v) => setData({ ...data, scheduler: { ...data.scheduler, log_keep_days: Number(v) } })} style={{ width: '100%' }} />
            </Field>
          </ConfigSection>

          <ConfigSection title={t('maintenance.config.monitoring.metric')}>
            <Field label="Library">
              <Input value={data.metric.library} onChange={(v) => setData({ ...data, metric: { ...data.metric, library: v } })} />
            </Field>
            <Field label="Interval">
              <InputNumber value={data.metric.interval} onChange={(v) => setData({ ...data, metric: { ...data.metric, interval: Number(v) } })} style={{ width: '100%' }} />
            </Field>
            <Field label="Size">
              <InputNumber value={data.metric.size} onChange={(v) => setData({ ...data, metric: { ...data.metric, size: Number(v) } })} style={{ width: '100%' }} />
            </Field>
          </ConfigSection>
        </>
      )}
    </div>
  );
};

export default MonitoringConfigTab;
