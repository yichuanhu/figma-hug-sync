import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Form, Toast, Typography, Space, Input, TagInput, Empty } from '@douyinfe/semi-ui';
import { IconChevronLeft, IconExternalOpen } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import {
  findAsset, updateMeta, updateNativeContent, publishNewVersion, CURRENT_USER_ID,
} from '@/pages/SharingCenter/MyShared/store';
import SemverDialog from '@/pages/SharingCenter/MyShared/components/SemverDialog';
import RichTextEditor from '@/components/RichTextEditor';
import '../Create/Knowledge/index.less';

const { Title, Text } = Typography;

const EditPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const asset = findAsset(id);

  const [name, setName] = useState(asset?.name ?? '');
  const [description, setDescription] = useState(asset?.description ?? '');
  const [tags, setTags] = useState<string[]>(asset?.tags ?? []);
  const [content, setContent] = useState(asset?.knowledge?.contentHtml ?? '');
  const [semverOpen, setSemverOpen] = useState(false);

  useEffect(() => {
    if (asset && asset.creatorId !== CURRENT_USER_ID && asset.source === 'NATIVE') {
      Toast.warning(t('sharing.assetSupply.edit.noPermission'));
      navigate('/sharing-center/my-shared');
    }
  }, [asset]);

  if (!asset) {
    return <Empty title="资产不存在" style={{ padding: 64 }} />;
  }

  const isDev = asset.source === 'DEV_CENTER';
  const isFirst = asset.shareStatus === 'DRAFT';

  const saveMeta = () => {
    updateMeta(id, { name, description, tags });
    if (!isDev) updateNativeContent(id, { knowledge: { contentHtml: content } });
    Toast.success(t('sharing.assetSupply.toast.saved'));
    navigate('/sharing-center/my-shared');
  };

  const onPublishOk = (params: { bump?: any; changeLog: string }) => {
    updateMeta(id, { name, description, tags });
    if (!isDev) updateNativeContent(id, { knowledge: { contentHtml: content } });
    publishNewVersion(id, params);
    Toast.success(t('sharing.assetSupply.toast.published'));
    setSemverOpen(false);
    navigate('/sharing-center/my-shared');
  };

  return (
    <div className="ms-create-page">
      <div className="ms-create-header">
        <Button icon={<IconChevronLeft />} theme="borderless" onClick={() => navigate(-1)} />
        <Title heading={3} style={{ margin: 0 }}>
          {isDev ? t('sharing.assetSupply.edit.devCenterTitle') : t('sharing.assetSupply.edit.nativeTitle')}
        </Title>
      </div>
      <div className="ms-create-body">
        <Form labelPosition="top" labelAlign="left">
          <Form.Slot label={t('sharing.assetSupply.create.fields.name')}>
            <Input value={name} onChange={setName} maxLength={100} />
          </Form.Slot>
          <Form.Slot label={t('sharing.assetSupply.create.fields.description')}>
            <Input value={description} onChange={setDescription} />
          </Form.Slot>
          <Form.Slot label={t('sharing.assetSupply.create.fields.tags')}>
            <TagInput value={tags} onChange={setTags as any} />
          </Form.Slot>
          {isDev ? (
            <Form.Slot label={t('sharing.assetSupply.create.fields.content')}>
              <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginBottom: 8 }}>
                {t('sharing.assetSupply.edit.readonlyHint')}
              </div>
              {asset.originUrl && (
                <Button
                  icon={<IconExternalOpen />} theme="light" type="primary" size="small"
                  onClick={() => window.open(asset.originUrl, '_blank')} style={{ marginBottom: 8 }}>
                  {t('sharing.assetSupply.edit.openInDevCenter')}
                </Button>
              )}
              <pre style={{
                background: 'var(--semi-color-fill-0)', padding: 12, borderRadius: 6,
                fontSize: 12, maxHeight: 280, overflow: 'auto', margin: 0,
              }}>
                {asset.workflow?.yaml || asset.snippet?.yaml || asset.description}
              </pre>
            </Form.Slot>
          ) : (
            <Form.Slot label={t('sharing.assetSupply.create.fields.content')}>
              <RichTextEditor value={content} onChange={setContent} maxLength={5000} />
            </Form.Slot>
          )}
        </Form>
      </div>
      <div className="ms-create-footer">
        <Space>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button onClick={saveMeta}>{t('sharing.assetSupply.edit.save')}</Button>
          {!isDev && (
            <Button theme="solid" type="primary" onClick={() => setSemverOpen(true)}>
              {t('sharing.assetSupply.edit.publishNew')}
            </Button>
          )}
        </Space>
      </div>
      <SemverDialog
        visible={semverOpen}
        onCancel={() => setSemverOpen(false)}
        onOk={onPublishOk}
        currentVersion={asset.currentVersion}
        isFirstRelease={isFirst}
      />
    </div>
  );
};

export default EditPage;
