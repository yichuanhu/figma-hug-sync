import { useState } from 'react';
import { Input, InputNumber, Switch, Select, TagInput, Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import ConfigSection, { Field } from '../ConfigSection';
import { mockLogger } from '../../mockData';
import type { LoggerConfig } from '../../types';

interface Props { advanced: boolean; }

const LEVEL_OPTIONS = [
  { label: 'DEBUG', value: 'DEBUG' },
  { label: 'INFO', value: 'INFO' },
  { label: 'WARNING', value: 'WARNING' },
  { label: 'ERROR', value: 'ERROR' },
  { label: 'CRITICAL', value: 'CRITICAL' },
];

const LoggerConfigTab = ({ advanced }: Props) => {
  const { t } = useTranslation();
  const [data, setData] = useState<LoggerConfig>(mockLogger);

  return (
    <div>
      <ConfigSection title="Basic">
        <Field label={t('maintenance.config.logger.version')}>
          <InputNumber value={data.version} onChange={(v) => setData({ ...data, version: Number(v) })} style={{ width: '100%' }} />
        </Field>
        <Field label={t('maintenance.config.logger.disableExisting')}>
          <Switch checked={data.disable_existing_loggers} onChange={(c) => setData({ ...data, disable_existing_loggers: c })} />
        </Field>
      </ConfigSection>

      <ConfigSection title={t('maintenance.config.logger.handlers')}>
        {Object.entries(data.handlers).map(([key, h]) => (
          <div key={key} className="config-section__full" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 500, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              {key} <Tag size="small" color="blue">{h.class}</Tag>
            </div>
            <div className="config-section__grid">
              <Field label={t('maintenance.config.logger.level')}>
                <Select value={h.level} onChange={(v) => setData({ ...data, handlers: { ...data.handlers, [key]: { ...h, level: v as string } } })} optionList={LEVEL_OPTIONS} style={{ width: '100%' }} />
              </Field>
              <Field label={t('maintenance.config.logger.formatter')}>
                <Input value={h.formatter} onChange={(v) => setData({ ...data, handlers: { ...data.handlers, [key]: { ...h, formatter: v } } })} />
              </Field>
              {h.filename !== undefined && (
                <Field label={t('maintenance.config.logger.filename')} full>
                  <Input value={h.filename} onChange={(v) => setData({ ...data, handlers: { ...data.handlers, [key]: { ...h, filename: v } } })} />
                </Field>
              )}
              {h.encoding !== undefined && (
                <Field label={t('maintenance.config.logger.encoding')}>
                  <Input value={h.encoding} onChange={(v) => setData({ ...data, handlers: { ...data.handlers, [key]: { ...h, encoding: v } } })} />
                </Field>
              )}
              {h.backupCount !== undefined && (
                <Field label="Backup Count">
                  <InputNumber value={h.backupCount} onChange={(v) => setData({ ...data, handlers: { ...data.handlers, [key]: { ...h, backupCount: Number(v) } } })} style={{ width: '100%' }} />
                </Field>
              )}
            </div>
          </div>
        ))}
      </ConfigSection>

      {advanced && (
        <ConfigSection title={t('maintenance.config.logger.formatters')}>
          {Object.entries(data.formatters).map(([key, f]) => (
            <Field key={key} label={key} full>
              <Input value={f.format} onChange={(v) => setData({ ...data, formatters: { ...data.formatters, [key]: { format: v } } })} />
            </Field>
          ))}
        </ConfigSection>
      )}

      <ConfigSection title={t('maintenance.config.logger.loggers')}>
        {Object.entries(data.loggers).map(([key, l]) => (
          <div key={key} className="config-section__full" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>{key}</div>
            <div className="config-section__grid">
              <Field label="Handlers" full>
                <TagInput value={l.handlers} onChange={(v) => setData({ ...data, loggers: { ...data.loggers, [key]: { ...l, handlers: v as string[] } } })} />
              </Field>
              <Field label={t('maintenance.config.logger.level')}>
                <Select value={l.level} onChange={(v) => setData({ ...data, loggers: { ...data.loggers, [key]: { ...l, level: v as string } } })} optionList={LEVEL_OPTIONS} style={{ width: '100%' }} />
              </Field>
              <Field label={t('maintenance.config.logger.propagate')}>
                <Switch checked={l.propagate} onChange={(c) => setData({ ...data, loggers: { ...data.loggers, [key]: { ...l, propagate: c } } })} />
              </Field>
            </div>
          </div>
        ))}
      </ConfigSection>
    </div>
  );
};

export default LoggerConfigTab;
