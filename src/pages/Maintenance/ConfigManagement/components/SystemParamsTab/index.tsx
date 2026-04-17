import { useState } from 'react';
import { Input, InputNumber, Switch, Select, TagInput } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import ConfigSection, { Field } from '../ConfigSection';
import { mockSystemParams } from '../../mockData';
import type { SystemParamsConfig } from '../../types';

interface Props {
  advanced: boolean;
}

const SystemParamsTab = ({ advanced }: Props) => {
  const { t } = useTranslation();
  const [data, setData] = useState<SystemParamsConfig>(mockSystemParams);

  return (
    <div>
      <ConfigSection title={t('maintenance.config.system.basic')}>
        <Field label={t('maintenance.config.system.host')}>
          <Input value={data.basic.host} onChange={(v) => setData({ ...data, basic: { ...data.basic, host: v } })} />
        </Field>
        <Field label={t('maintenance.config.system.port')}>
          <InputNumber value={data.basic.port} onChange={(v) => setData({ ...data, basic: { ...data.basic, port: Number(v) } })} style={{ width: '100%' }} />
        </Field>
        <Field label={t('maintenance.config.system.isProduction')}>
          <Switch checked={data.basic.is_production} onChange={(c) => setData({ ...data, basic: { ...data.basic, is_production: c } })} />
        </Field>
        <Field label={t('maintenance.config.system.defaultLang')}>
          <Select
            value={data.basic.default_lang}
            onChange={(v) => setData({ ...data, basic: { ...data.basic, default_lang: v as 'zh-CN' | 'en-US' } })}
            optionList={[{ label: '简体中文', value: 'zh-CN' }, { label: 'English', value: 'en-US' }]}
            style={{ width: '100%' }}
          />
        </Field>
        <Field label={t('maintenance.config.system.exitTimeout')}>
          <InputNumber value={data.basic.exit_timeout} onChange={(v) => setData({ ...data, basic: { ...data.basic, exit_timeout: Number(v) } })} style={{ width: '100%' }} />
        </Field>
        <Field label={t('maintenance.config.system.rootUrl')} full>
          <Input value={data.basic.root_url} onChange={(v) => setData({ ...data, basic: { ...data.basic, root_url: v } })} />
        </Field>
      </ConfigSection>

      <ConfigSection title={t('maintenance.config.system.loginOptions')}>
        <Field label={t('maintenance.config.system.allowPhoneLogin')}>
          <Switch checked={data.login.allow_phone_login} onChange={(c) => setData({ ...data, login: { ...data.login, allow_phone_login: c } })} />
        </Field>
        <Field label={t('maintenance.config.system.allowEmailLogin')}>
          <Switch checked={data.login.allow_email_login} onChange={(c) => setData({ ...data, login: { ...data.login, allow_email_login: c } })} />
        </Field>
        <Field label={t('maintenance.config.system.allowUsernameLogin')}>
          <Switch checked={data.login.allow_username_login} onChange={(c) => setData({ ...data, login: { ...data.login, allow_username_login: c } })} />
        </Field>
      </ConfigSection>

      {advanced && (
        <>
          <ConfigSection title={t('maintenance.config.system.cors')}>
            <Field label={t('maintenance.config.system.allowOrigins')} full>
              <TagInput value={data.cors.allow_origins} onChange={(v) => setData({ ...data, cors: { ...data.cors, allow_origins: v as string[] } })} />
            </Field>
            <Field label={t('maintenance.config.system.allowMethods')} full>
              <TagInput value={data.cors.allow_methods} onChange={(v) => setData({ ...data, cors: { ...data.cors, allow_methods: v as string[] } })} />
            </Field>
            <Field label={t('maintenance.config.system.allowHeaders')} full>
              <TagInput value={data.cors.allow_headers} onChange={(v) => setData({ ...data, cors: { ...data.cors, allow_headers: v as string[] } })} />
            </Field>
            <Field label={t('maintenance.config.system.allowCredentials')}>
              <Switch checked={data.cors.allow_credentials} onChange={(c) => setData({ ...data, cors: { ...data.cors, allow_credentials: c } })} />
            </Field>
            <Field label={t('maintenance.config.system.maxAge')}>
              <InputNumber value={data.cors.max_age} onChange={(v) => setData({ ...data, cors: { ...data.cors, max_age: Number(v) } })} style={{ width: '100%' }} />
            </Field>
          </ConfigSection>

          <ConfigSection title={t('maintenance.config.system.multiProcess')}>
            <Field label="Address Host">
              <Input value={data.multi_process.address.host} onChange={(v) => setData({ ...data, multi_process: { ...data.multi_process, address: { ...data.multi_process.address, host: v } } })} />
            </Field>
            <Field label="Address Port">
              <InputNumber value={data.multi_process.address.port} onChange={(v) => setData({ ...data, multi_process: { ...data.multi_process, address: { ...data.multi_process.address, port: Number(v) } } })} style={{ width: '100%' }} />
            </Field>
            <Field label={t('maintenance.config.system.authkey')}>
              <Input mode="password" value={data.multi_process.authkey} onChange={(v) => setData({ ...data, multi_process: { ...data.multi_process, authkey: v } })} />
            </Field>
            <Field label={t('maintenance.config.system.shutdownTimeout')}>
              <InputNumber value={data.multi_process.shutdown_timeout} onChange={(v) => setData({ ...data, multi_process: { ...data.multi_process, shutdown_timeout: Number(v) } })} style={{ width: '100%' }} />
            </Field>
          </ConfigSection>

          <ConfigSection title={t('maintenance.config.system.storage')}>
            <Field label={t('maintenance.config.system.maxSize')}>
              <InputNumber value={data.storage.max_size} onChange={(v) => setData({ ...data, storage: { ...data.storage, max_size: Number(v) } })} style={{ width: '100%' }} />
            </Field>
            <Field label={t('maintenance.config.system.maxChunkSize')}>
              <InputNumber value={data.storage.max_chunk_size} onChange={(v) => setData({ ...data, storage: { ...data.storage, max_chunk_size: Number(v) } })} style={{ width: '100%' }} />
            </Field>
            <Field label="Media Types" full>
              <TagInput value={data.storage.media_type} onChange={(v) => setData({ ...data, storage: { ...data.storage, media_type: v as string[] } })} />
            </Field>
          </ConfigSection>
        </>
      )}
    </div>
  );
};

export default SystemParamsTab;
