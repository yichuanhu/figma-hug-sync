import { useState } from 'react';
import { Input, InputNumber, Switch, TagInput } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import ConfigSection, { Field } from '../ConfigSection';
import DictEditor from '../DictEditor';
import { mockServiceParams } from '../../mockData';
import type { ServiceParamsConfig } from '../../types';

interface Props { advanced: boolean; }

const ServiceParamsTab = ({ advanced }: Props) => {
  const { t } = useTranslation();
  const [data, setData] = useState<ServiceParamsConfig>(mockServiceParams);

  return (
    <div>
      <ConfigSection title={t('maintenance.config.service.uvicorn')}>
        <Field label={t('maintenance.config.service.accessLog')}>
          <Switch checked={data.uvicorn.access_log} onChange={(c) => setData({ ...data, uvicorn: { ...data.uvicorn, access_log: c } })} />
        </Field>
        <Field label={t('maintenance.config.service.workers')}>
          <InputNumber value={data.uvicorn.workers} onChange={(v) => setData({ ...data, uvicorn: { ...data.uvicorn, workers: Number(v) } })} style={{ width: '100%' }} />
        </Field>
        <Field label={t('maintenance.config.service.proxyHeaders')}>
          <Switch checked={data.uvicorn.proxy_headers} onChange={(c) => setData({ ...data, uvicorn: { ...data.uvicorn, proxy_headers: c } })} />
        </Field>
        <Field label={t('maintenance.config.service.rootPath')}>
          <Input value={data.uvicorn.root_path} onChange={(v) => setData({ ...data, uvicorn: { ...data.uvicorn, root_path: v } })} />
        </Field>
        <Field label={t('maintenance.config.service.limitConcurrency')}>
          <InputNumber value={data.uvicorn.limit_concurrency} onChange={(v) => setData({ ...data, uvicorn: { ...data.uvicorn, limit_concurrency: Number(v) } })} style={{ width: '100%' }} />
        </Field>
        <Field label={t('maintenance.config.service.limitMaxRequests')}>
          <InputNumber value={data.uvicorn.limit_max_requests} onChange={(v) => setData({ ...data, uvicorn: { ...data.uvicorn, limit_max_requests: Number(v) } })} style={{ width: '100%' }} />
        </Field>
        <Field label="Forwarded Allow IPs" full>
          <TagInput value={data.uvicorn.forwarded_allow_ips} onChange={(v) => setData({ ...data, uvicorn: { ...data.uvicorn, forwarded_allow_ips: v as string[] } })} />
        </Field>
      </ConfigSection>

      <ConfigSection title={t('maintenance.config.service.websocket')}>
        <Field label={t('maintenance.config.service.protocol')}>
          <Input value={data.websocket.protocol} onChange={(v) => setData({ ...data, websocket: { ...data.websocket, protocol: v } })} />
        </Field>
        <Field label={t('maintenance.config.service.maxQueue')}>
          <InputNumber value={data.websocket.max_queue} onChange={(v) => setData({ ...data, websocket: { ...data.websocket, max_queue: Number(v) } })} style={{ width: '100%' }} />
        </Field>
        <Field label={t('maintenance.config.service.pingInterval')}>
          <InputNumber value={data.websocket.ping_interval} onChange={(v) => setData({ ...data, websocket: { ...data.websocket, ping_interval: Number(v) } })} style={{ width: '100%' }} />
        </Field>
        <Field label={t('maintenance.config.service.pingTimeout')}>
          <InputNumber value={data.websocket.ping_timeout} onChange={(v) => setData({ ...data, websocket: { ...data.websocket, ping_timeout: Number(v) } })} style={{ width: '100%' }} />
        </Field>
      </ConfigSection>

      {data.rate_limit && (
        <ConfigSection title={t('maintenance.config.service.rateLimit')}>
          <Field label={t('maintenance.config.service.requestAmount')}>
            <InputNumber value={data.rate_limit.request_amount} onChange={(v) => setData({ ...data, rate_limit: { ...data.rate_limit!, request_amount: Number(v) } })} style={{ width: '100%' }} />
          </Field>
          <Field label={t('maintenance.config.service.windowSeconds')}>
            <InputNumber value={data.rate_limit.window_seconds} onChange={(v) => setData({ ...data, rate_limit: { ...data.rate_limit!, window_seconds: Number(v) } })} style={{ width: '100%' }} />
          </Field>
        </ConfigSection>
      )}

      <ConfigSection title={t('maintenance.config.service.session')}>
        <Field label={t('maintenance.config.service.expire')}>
          <InputNumber value={data.session.expire} onChange={(v) => setData({ ...data, session: { expire: Number(v) } })} style={{ width: '100%' }} />
        </Field>
      </ConfigSection>

      <ConfigSection title={t('maintenance.config.service.webApi')}>
        <Field label={t('maintenance.config.service.maxCountPerQuery')}>
          <InputNumber value={data.web_api.max_count_per_query} onChange={(v) => setData({ ...data, web_api: { ...data.web_api, max_count_per_query: Number(v) } })} style={{ width: '100%' }} />
        </Field>
        <Field label={t('maintenance.config.service.encrypt')}>
          <Switch checked={data.web_api.encrypt} onChange={(c) => setData({ ...data, web_api: { ...data.web_api, encrypt: c } })} />
        </Field>
        <Field label={t('maintenance.config.service.forbidExtraFields')}>
          <Switch checked={data.web_api.forbid_extra_fields} onChange={(c) => setData({ ...data, web_api: { ...data.web_api, forbid_extra_fields: c } })} />
        </Field>
      </ConfigSection>

      {advanced && (
        <>
          <ConfigSection title={t('maintenance.config.service.responseHeaders')}>
            <Field label={t('maintenance.config.service.responseHeaders')} full>
              <DictEditor value={data.response_headers} onChange={(v) => setData({ ...data, response_headers: v })} />
            </Field>
          </ConfigSection>

          <ConfigSection title={t('maintenance.config.service.openApi')}>
            <Field label={t('maintenance.config.service.enabled')}>
              <Switch checked={data.open_api.enabled} onChange={(c) => setData({ ...data, open_api: { ...data.open_api, enabled: c } })} />
            </Field>
            <Field label={t('maintenance.config.service.expire')}>
              <InputNumber value={data.open_api.expire} onChange={(v) => setData({ ...data, open_api: { ...data.open_api, expire: Number(v) } })} style={{ width: '100%' }} />
            </Field>
            <Field label="Max Body Length">
              <InputNumber value={data.open_api.max_body_length} onChange={(v) => setData({ ...data, open_api: { ...data.open_api, max_body_length: Number(v) } })} style={{ width: '100%' }} />
            </Field>
            <Field label="Hash Count">
              <InputNumber value={data.open_api.hash_count} onChange={(v) => setData({ ...data, open_api: { ...data.open_api, hash_count: Number(v) } })} style={{ width: '100%' }} />
            </Field>
          </ConfigSection>
        </>
      )}
    </div>
  );
};

export default ServiceParamsTab;
