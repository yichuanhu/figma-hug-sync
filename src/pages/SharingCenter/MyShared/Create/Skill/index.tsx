import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Toast, Typography, Space, Input, Select, Switch, Tabs, TagInput } from '@douyinfe/semi-ui';
import { IconChevronLeft, IconPlusCircle, IconDelete } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import {
  addAsset, makeNativeSkill, buildAssetId, publishNewVersion, type ShareAsset,
} from '@/pages/SharingCenter/MyShared/store';
import type { ParameterDef } from '@/pages/Sharing/Market/types';
import '../Knowledge/index.less';

const { Title } = Typography;
const TabPane = Tabs.TabPane;

const PARAM_TYPES = ['string', 'number', 'boolean', 'object', 'array'] as const;

const ParamTable = ({ value, onChange, t }: { value: ParameterDef[]; onChange: (v: ParameterDef[]) => void; t: any }) => {
  const update = (idx: number, patch: Partial<ParameterDef>) => {
    const next = value.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    onChange(next);
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const add = () => onChange([...value, { name: '', type: 'string', required: false, description: '' }]);
  return (
    <>
      <table className="params-table">
        <thead>
          <tr>
            <th style={{ width: 140 }}>{t('sharing.myShared.create.fields.paramName')}</th>
            <th style={{ width: 110 }}>{t('sharing.myShared.create.fields.paramType')}</th>
            <th style={{ width: 70 }}>{t('sharing.myShared.create.fields.paramRequired')}</th>
            <th>{t('sharing.myShared.create.fields.paramDesc')}</th>
            <th style={{ width: 120 }}>{t('sharing.myShared.create.fields.paramDefault')}</th>
            <th style={{ width: 50 }} />
          </tr>
        </thead>
        <tbody>
          {value.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--semi-color-text-2)' }}>—</td></tr>
          )}
          {value.map((p, idx) => (
            <tr key={idx}>
              <td><Input size="small" value={p.name} onChange={(v) => update(idx, { name: v })} /></td>
              <td>
                <Select size="small" value={p.type} onChange={(v) => update(idx, { type: String(v) })} style={{ width: '100%' }}
                  optionList={PARAM_TYPES.map((tp) => ({ value: tp, label: tp }))} />
              </td>
              <td style={{ textAlign: 'center' }}>
                <Switch size="small" checked={p.required} onChange={(v) => update(idx, { required: v })} />
              </td>
              <td><Input size="small" value={p.description} onChange={(v) => update(idx, { description: v })} /></td>
              <td><Input size="small" value={p.defaultValue ?? ''} onChange={(v) => update(idx, { defaultValue: v })} /></td>
              <td style={{ textAlign: 'center' }}>
                <Button size="small" theme="borderless" type="danger" icon={<IconDelete />} onClick={() => remove(idx)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button className="add-param-btn" size="small" icon={<IconPlusCircle />} theme="borderless" onClick={add}>
        {t('sharing.myShared.create.fields.addParam')}
      </Button>
    </>
  );
};

const SkillCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'document' | 'data' | 'content' | 'retrieval' | 'tool' | 'other'>('tool');
  const [tags, setTags] = useState<string[]>([]);
  const [inputs, setInputs] = useState<ParameterDef[]>([{ name: 'input', type: 'string', required: true, description: '' }]);
  const [outputs, setOutputs] = useState<ParameterDef[]>([{ name: 'output', type: 'string', required: true, description: '' }]);
  const [timeout, setTimeoutSec] = useState(30);
  const [retry, setRetry] = useState<'none' | 'fixed' | 'exponential'>('none');
  const [exampleTab, setExampleTab] = useState('json');
  const [example, setExample] = useState('{\n  "input": "demo"\n}');

  const submit = (publish: boolean) => {
    if (name.trim().length < 2) { Toast.warning(t('sharing.myShared.create.fields.namePh')); return; }
    if (description.trim().length < 10) { Toast.warning(t('sharing.myShared.create.fields.descPh')); return; }
    const id = buildAssetId('sk');
    const today = new Date().toISOString().slice(0, 10);
    const asset: ShareAsset = makeNativeSkill(id, name, description, 'DRAFT', today, {
      category, inputParams: inputs, outputParams: outputs, timeoutSec: timeout, retryPolicy: retry, callExample: example,
    });
    asset.tags = tags;
    addAsset(asset);
    if (publish) publishNewVersion(id, { changeLog: '首发版本' });
    Toast.success(publish ? t('sharing.myShared.toast.published') : t('sharing.myShared.toast.saved'));
    navigate('/sharing-center/my-shared');
  };

  return (
    <div className="ms-create-page">
      <div className="ms-create-header">
        <Button icon={<IconChevronLeft />} theme="borderless" onClick={() => navigate(-1)} />
        <Title heading={3} style={{ margin: 0 }}>{t('sharing.myShared.create.skillTitle')}</Title>
      </div>
      <div className="ms-create-body">
        <Form labelPosition="top" labelAlign="left">
          <Form.Slot label={t('sharing.myShared.create.fields.name')}>
            <Input value={name} onChange={setName} placeholder={t('sharing.myShared.create.fields.namePh')} maxLength={100} />
          </Form.Slot>
          <Form.Slot label={t('sharing.myShared.create.fields.skillType')}>
            <Select value={category} onChange={(v) => setCategory(v as any)} style={{ width: 220 }}
              optionList={(['document', 'data', 'content', 'retrieval', 'tool', 'other'] as const).map((k) => ({
                value: k, label: t(`sharing.myShared.create.skillTypes.${k}`),
              }))} />
          </Form.Slot>
          <Form.Slot label={t('sharing.myShared.create.fields.tags')}>
            <TagInput value={tags} onChange={setTags as any} placeholder={t('sharing.myShared.create.fields.tagsPh')} />
          </Form.Slot>
          <Form.Slot label={t('sharing.myShared.create.fields.description')}>
            <Input value={description} onChange={setDescription} placeholder={t('sharing.myShared.create.fields.descPh')} />
          </Form.Slot>

          <Form.Slot label={t('sharing.myShared.create.fields.inputParams')}>
            <ParamTable value={inputs} onChange={setInputs} t={t} />
          </Form.Slot>
          <Form.Slot label={t('sharing.myShared.create.fields.outputParams')}>
            <ParamTable value={outputs} onChange={setOutputs} t={t} />
          </Form.Slot>

          <Form.Slot label={t('sharing.myShared.create.fields.timeout')}>
            <Input type="number" value={String(timeout)} onChange={(v) => setTimeoutSec(Number(v) || 30)} style={{ width: 160 }} />
          </Form.Slot>
          <Form.Slot label={t('sharing.myShared.create.fields.retry')}>
            <Select value={retry} onChange={(v) => setRetry(v as any)} style={{ width: 220 }}
              optionList={(['none', 'fixed', 'exponential'] as const).map((k) => ({
                value: k, label: t(`sharing.myShared.create.retry.${k}`),
              }))} />
          </Form.Slot>
          <Form.Slot label={t('sharing.myShared.create.fields.callExample')}>
            <Tabs activeKey={exampleTab} onChange={setExampleTab} type="line">
              <TabPane itemKey="json" tab="JSON" />
              <TabPane itemKey="curl" tab="curl" />
              <TabPane itemKey="python" tab="Python" />
            </Tabs>
            <textarea
              value={example} onChange={(e) => setExample(e.target.value)}
              style={{
                width: '100%', minHeight: 160, fontFamily: 'Menlo, Consolas, monospace', fontSize: 13,
                padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 6, resize: 'vertical',
              }}
            />
          </Form.Slot>
        </Form>
      </div>
      <div className="ms-create-footer">
        <Space>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button onClick={() => submit(false)}>{t('sharing.myShared.create.saveDraft')}</Button>
          <Button theme="solid" type="primary" onClick={() => submit(true)}>{t('sharing.myShared.create.publish')}</Button>
        </Space>
      </div>
    </div>
  );
};

export default SkillCreatePage;
