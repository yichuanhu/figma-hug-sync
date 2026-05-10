import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Toast, Typography, Space, Upload } from '@douyinfe/semi-ui';
import { IconChevronLeft, IconUpload } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import {
  addAsset, makeNativeKnowledge, buildAssetId, publishNewVersion, type ShareAsset,
} from '@/pages/SharingCenter/MyShared/store';
import RichTextEditor, { stripHtml } from '@/components/RichTextEditor';
import './index.less';

const { Title } = Typography;

const KnowledgeCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (values: any, publish: boolean) => {
    if (!values?.name || values.name.length < 2) {
      Toast.warning(t('sharing.myShared.create.fields.namePh'));
      return;
    }
    setSubmitting(true);
    const id = buildAssetId('kn');
    const today = new Date().toISOString().slice(0, 10);
    const asset: ShareAsset = makeNativeKnowledge(id, values.name, values.description || '', 'DRAFT', today, {
      knowledgeType: values.knowledgeType,
      contentHtml: values.content || `<p>${values.description || ''}</p>`,
    });
    asset.tags = Array.isArray(values.tags) ? values.tags : [];
    addAsset(asset);
    if (publish) publishNewVersion(id, { changeLog: '首发版本' });
    Toast.success(publish ? t('sharing.myShared.toast.published') : t('sharing.myShared.toast.saved'));
    setSubmitting(false);
    navigate('/sharing-center/my-shared');
  };

  return (
    <div className="ms-create-page">
      <div className="ms-create-header">
        <Button icon={<IconChevronLeft />} theme="borderless" onClick={() => navigate(-1)} />
        <Title heading={3} style={{ margin: 0 }}>{t('sharing.myShared.create.knowledgeTitle')}</Title>
      </div>
      <div className="ms-create-body">
        <Form labelPosition="top" labelAlign="left" onSubmit={(v) => submit(v, true)} getFormApi={(api) => ((window as any).__knForm = api)}>
          <Form.Input
            field="name" label={t('sharing.myShared.create.fields.name')}
            placeholder={t('sharing.myShared.create.fields.namePh')}
            rules={[{ required: true, message: t('sharing.myShared.create.fields.namePh') }, { min: 2, max: 100 }]}
            trigger={['blur', 'change']}
          />
          <Form.Select
            field="knowledgeType" label={t('sharing.myShared.create.fields.knowledgeType')} initValue="manual"
            optionList={[
              { value: 'manual', label: t('sharing.myShared.create.knowledgeTypes.manual') },
              { value: 'errorCode', label: t('sharing.myShared.create.knowledgeTypes.errorCode') },
              { value: 'bestPractice', label: t('sharing.myShared.create.knowledgeTypes.bestPractice') },
              { value: 'faq', label: t('sharing.myShared.create.knowledgeTypes.faq') },
            ]}
          />
          <Form.Input
            field="category" label={t('sharing.myShared.create.fields.category')}
            placeholder={t('sharing.myShared.create.fields.categoryPh')}
          />
          <Form.TagInput
            field="tags" label={t('sharing.myShared.create.fields.tags')}
            placeholder={t('sharing.myShared.create.fields.tagsPh')}
          />
          <Form.TextArea
            field="description" label={t('sharing.myShared.create.fields.description')}
            placeholder={t('sharing.myShared.create.fields.descPh')}
            maxLength={500} maxCount={500} rows={3}
            rules={[{ required: true, min: 10, max: 500, message: t('sharing.myShared.create.fields.descPh') }]}
            trigger={['blur', 'change']}
          />
          <Form.Slot label={t('sharing.myShared.create.fields.content')}>
            <Form.Slot.ErrorMessage />
            <RichTextField field="content" />
          </Form.Slot>
          <Form.Slot label={t('sharing.myShared.create.fields.attachments')}>
            <Upload
              action="" customRequest={({ onSuccess }: any) => setTimeout(() => onSuccess?.({}), 200)}
              accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
              maxSize={10240}
            >
              <Button icon={<IconUpload />}>选择附件</Button>
            </Upload>
            <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 6 }}>
              {t('sharing.myShared.create.fields.attachmentsHint')}
            </div>
          </Form.Slot>
        </Form>
      </div>
      <div className="ms-create-footer">
        <Space>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button onClick={() => { const v = (window as any).__knForm?.getValues(); submit(v, false); }} loading={submitting}>
            {t('sharing.myShared.create.saveDraft')}
          </Button>
          <Button theme="solid" type="primary" loading={submitting}
            onClick={() => { const v = (window as any).__knForm?.getValues(); submit(v, true); }}>
            {t('sharing.myShared.create.publish')}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default KnowledgeCreatePage;
