import { useState } from 'react';
import { Input, InputNumber, Switch, Select, Banner } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ConfigSection, { Field } from '../ConfigSection';
import { mockInfrastructure } from '../../mockData';
import type { InfrastructureConfig } from '../../types';

interface Props { advanced: boolean; }

const InfrastructureTab = ({ advanced }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<InfrastructureConfig>(mockInfrastructure);

  return (
    <div>
      <ConfigSection title={t('maintenance.config.infra.database')}>
        {Object.entries(data.database).map(([dbKey, db]) => (
          <div key={dbKey} className="config-section__full" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 500, marginBottom: 8, color: 'var(--semi-color-text-1)' }}>{dbKey}</div>
            <div className="config-section__grid">
              <Field label={t('maintenance.config.infra.url')} full>
                <Input value={db.url} onChange={(v) => setData({ ...data, database: { ...data.database, [dbKey]: { ...db, url: v } } })} />
              </Field>
              <Field label={t('maintenance.config.infra.host')}>
                <Input value={db.host} onChange={(v) => setData({ ...data, database: { ...data.database, [dbKey]: { ...db, host: v } } })} />
              </Field>
              <Field label={t('maintenance.config.infra.port')}>
                <InputNumber value={db.port} onChange={(v) => setData({ ...data, database: { ...data.database, [dbKey]: { ...db, port: Number(v) } } })} style={{ width: '100%' }} />
              </Field>
              <Field label={t('maintenance.config.infra.user')}>
                <Input value={db.user} onChange={(v) => setData({ ...data, database: { ...data.database, [dbKey]: { ...db, user: v } } })} />
              </Field>
              <Field label={t('maintenance.config.infra.password')}>
                <Input mode="password" value={db.password} onChange={(v) => setData({ ...data, database: { ...data.database, [dbKey]: { ...db, password: v } } })} />
              </Field>
              <Field label={t('maintenance.config.infra.db')}>
                <Input value={db.db} onChange={(v) => setData({ ...data, database: { ...data.database, [dbKey]: { ...db, db: v } } })} />
              </Field>
              <Field label={t('maintenance.config.infra.echo')}>
                <Switch checked={db.echo} onChange={(c) => setData({ ...data, database: { ...data.database, [dbKey]: { ...db, echo: c } } })} />
              </Field>
            </div>
          </div>
        ))}
      </ConfigSection>

      {data.redis && (
        <ConfigSection title={t('maintenance.config.infra.redis')}>
          <Field label={t('maintenance.config.infra.host')}>
            <Input value={data.redis.host} onChange={(v) => setData({ ...data, redis: { ...data.redis!, host: v } })} />
          </Field>
          <Field label={t('maintenance.config.infra.port')}>
            <InputNumber value={data.redis.port} onChange={(v) => setData({ ...data, redis: { ...data.redis!, port: Number(v) } })} style={{ width: '100%' }} />
          </Field>
          <Field label={t('maintenance.config.infra.db')}>
            <InputNumber value={data.redis.db} onChange={(v) => setData({ ...data, redis: { ...data.redis!, db: Number(v) } })} style={{ width: '100%' }} />
          </Field>
          <Field label={t('maintenance.config.infra.user')}>
            <Input value={data.redis.username} onChange={(v) => setData({ ...data, redis: { ...data.redis!, username: v } })} />
          </Field>
          <Field label={t('maintenance.config.infra.password')}>
            <Input mode="password" value={data.redis.password} onChange={(v) => setData({ ...data, redis: { ...data.redis!, password: v } })} />
          </Field>
          <Field label={t('maintenance.config.service.enabled')}>
            <Switch checked={data.redis.enabled} onChange={(c) => setData({ ...data, redis: { ...data.redis!, enabled: c } })} />
          </Field>
        </ConfigSection>
      )}

      {data.file_storage && (
        <ConfigSection title={t('maintenance.config.infra.fileStorage')}>
          <Field label={t('maintenance.config.infra.path')} full>
            <Input value={data.file_storage.path} onChange={(v) => setData({ ...data, file_storage: { ...data.file_storage!, path: v } })} />
          </Field>
          <Field label={t('maintenance.config.infra.accessMode')}>
            <Select
              value={data.file_storage.access_mode}
              onChange={(v) => setData({ ...data, file_storage: { ...data.file_storage!, access_mode: v as 'read_only' | 'read_write' } })}
              optionList={[{ label: 'Read Only', value: 'read_only' }, { label: 'Read & Write', value: 'read_write' }]}
              style={{ width: '100%' }}
            />
          </Field>
          <Field label={t('maintenance.config.infra.encryption')}>
            <Switch checked={data.file_storage.encryption} onChange={(c) => setData({ ...data, file_storage: { ...data.file_storage!, encryption: c } })} />
          </Field>
        </ConfigSection>
      )}

      <ConfigSection title={t('maintenance.config.infra.storage')}>
        <Field label={t('maintenance.config.infra.defaultBucket')}>
          <Input value={data.storage.default_bucket} onChange={(v) => setData({ ...data, storage: { ...data.storage, default_bucket: v } })} />
        </Field>
        <Field label={t('maintenance.config.infra.maxSize')}>
          <InputNumber value={data.storage.max_size} onChange={(v) => setData({ ...data, storage: { ...data.storage, max_size: Number(v) } })} style={{ width: '100%' }} />
        </Field>
      </ConfigSection>

      {advanced && (
        <>
          <ConfigSection title={t('maintenance.config.infra.cache')}>
            <Field label="Max Expire">
              <InputNumber value={data.cache.max_expire} onChange={(v) => setData({ ...data, cache: { ...data.cache, max_expire: Number(v) } })} style={{ width: '100%' }} />
            </Field>
            <Field label="Local Max Count">
              <InputNumber value={data.cache.local.max_count} onChange={(v) => setData({ ...data, cache: { ...data.cache, local: { ...data.cache.local, max_count: Number(v) } } })} style={{ width: '100%' }} />
            </Field>
          </ConfigSection>

          <ConfigSection title={t('maintenance.config.infra.lock')}>
            <Field label="Max Expire">
              <InputNumber value={data.lock.max_expire} onChange={(v) => setData({ ...data, lock: { ...data.lock, max_expire: Number(v) } })} style={{ width: '100%' }} />
            </Field>
            <Field label="Max Timeout">
              <InputNumber value={data.lock.max_timeout} onChange={(v) => setData({ ...data, lock: { ...data.lock, max_timeout: Number(v) } })} style={{ width: '100%' }} />
            </Field>
            <Field label="Min Timeout">
              <InputNumber value={data.lock.min_timeout} onChange={(v) => setData({ ...data, lock: { ...data.lock, min_timeout: Number(v) } })} style={{ width: '100%' }} />
            </Field>
            <Field label="Interval">
              <InputNumber value={data.lock.interval} onChange={(v) => setData({ ...data, lock: { ...data.lock, interval: Number(v) } })} style={{ width: '100%' }} />
            </Field>
          </ConfigSection>

          <ConfigSection title={t('maintenance.config.infra.queue')}>
            <Field label="Max Size">
              <InputNumber value={data.queue.max_size} onChange={(v) => setData({ ...data, queue: { ...data.queue, max_size: Number(v) } })} style={{ width: '100%' }} />
            </Field>
            <Field label="Size Check Interval">
              <InputNumber value={data.queue.size_check_interval} onChange={(v) => setData({ ...data, queue: { ...data.queue, size_check_interval: Number(v) } })} style={{ width: '100%' }} />
            </Field>
          </ConfigSection>
        </>
      )}

      <Banner
        type="info"
        description={
          <span>
            {t('maintenance.config.infra.middlewareHint')}{' '}
            <a onClick={() => navigate('/maintenance/dashboard/middleware-status')} style={{ cursor: 'pointer', color: 'var(--semi-color-primary)' }}>
              {t('maintenance.config.infra.middlewareLink')}
            </a>
          </span>
        }
        closeIcon={null}
      />
    </div>
  );
};

export default InfrastructureTab;
