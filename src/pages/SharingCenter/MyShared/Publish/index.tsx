import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Form, Toast, Typography, Space, Banner, Tag, Upload } from '@douyinfe/semi-ui';
import { IconChevronLeft, IconImage, IconVideoListStroked } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { findAsset, submitDevCenterPublish } from '@/pages/SharingCenter/MyShared/store';
import RichTextEditor from '@/components/RichTextEditor';
import '../Create/Knowledge/index.less';

const { Title, Text } = Typography;

const COVER_MAX_KB = 2 * 1024;       // 2MB
const VIDEO_MAX_KB = 100 * 1024;     // 100MB
const COVER_ACCEPT = ['image/jpeg', 'image/png'];
const VIDEO_ACCEPT = ['video/mp4'];

const DevCenterPublishPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const asset = findAsset(id);
  const [submitting, setSubmitting] = useState(false);
  const [overview, setOverview] = useState<string>('');
  const [coverFile, setCoverFile] = useState<{ name: string; size: number; url?: string } | null>(null);
  const [videoFile, setVideoFile] = useState<{ name: string; size: number } | null>(null);

  if (!asset) {
    return <div style={{ padding: 64 }}><Text>资产不存在</Text></div>;
  }
  if (asset.source !== 'DEV_CENTER') {
    navigate('/sharing-center/my-published');
    return null;
  }

  const submit = async (values: any) => {
    // 必填校验：封面、展示描述、概览
    // 知识资产封面非必填，缺省时详情页使用默认占位
    if (asset.type !== 'KNOWLEDGE' && !coverFile) {
      Toast.warning(t('sharing.assetSupply.publish.coverRequired'));
      return;
    }
    const displayDesc = (values.displayDesc ?? '').trim();
    if (!displayDesc || displayDesc.length < 10) {
      Toast.warning(t('sharing.assetSupply.publish.displayDescRequired'));
      return;
    }
    const overviewText = overview.replace(/<[^>]+>/g, '').trim();
    if (overviewText.length < 20) {
      Toast.warning(t('sharing.assetSupply.publish.overviewRequired'));
      return;
    }
    setSubmitting(true);
    submitDevCenterPublish(id, {
      coverImage: coverFile.url,
      displayName: (values.displayName ?? '').trim() || undefined,
      displayDesc,
      categoryTags: Array.isArray(values.categoryTags) ? values.categoryTags : undefined,
      overview,
      videoUrl: videoFile?.name,
    });
    Toast.success(t('sharing.assetSupply.toast.published'));
    setSubmitting(false);
    navigate('/sharing-center/my-published');
  };

  const beforeCover = (file: File) => {
    if (!COVER_ACCEPT.includes(file.type)) {
      Toast.error(t('sharing.assetSupply.publish.coverTypeError'));
      return false;
    }
    if (file.size / 1024 > COVER_MAX_KB) {
      Toast.error(t('sharing.assetSupply.publish.coverSizeError'));
      return false;
    }
    return true;
  };

  const beforeVideo = (file: File) => {
    if (!VIDEO_ACCEPT.includes(file.type) && !file.name.toLowerCase().endsWith('.mp4')) {
      Toast.error(t('sharing.assetSupply.publish.videoTypeError'));
      return false;
    }
    if (file.size / 1024 > VIDEO_MAX_KB) {
      Toast.error(t('sharing.assetSupply.publish.videoSizeError'));
      return false;
    }
    return true;
  };

  const fmtSize = (kb: number) => kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;

  return (
    <div className="ms-create-page">
      <div className="ms-create-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<IconChevronLeft />} theme="borderless" onClick={() => navigate(-1)} />
          <Title heading={3} style={{ margin: 0 }}>
            {t('sharing.assetSupply.publish.pageTitle', { name: asset.name })}
          </Title>
        </Space>
      </div>
      <div className="ms-create-body" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* 左：只读元信息 */}
        <div style={{ background: 'var(--semi-color-fill-0)', padding: 16, borderRadius: 6 }}>
          <Title heading={6}>{t('sharing.assetSupply.publish.metaTitle')}</Title>
          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            <Field label={t('sharing.assetSupply.publish.metaName')} value={asset.name} />
            <Field label={t('sharing.assetSupply.publish.metaDescription')} value={asset.description} />
            {asset.resourceDeps && asset.resourceDeps.length > 0 && (
              <Field label={t('sharing.assetSupply.publish.metaResourceDeps')} value={
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {asset.resourceDeps.map((d) => <li key={d}>{d}</li>)}
                </ul>
              } />
            )}
            <Field label={t('sharing.assetSupply.publish.metaVersion')} value={asset.currentVersion} />
            <Field label={t('sharing.assetSupply.publish.metaDept')} value={asset.departmentName} />
            <Field label={t('sharing.assetSupply.publish.metaSource')} value={<Tag size="small" color="blue">{t('sharing.common.source.devCenter')}</Tag>} />
          </div>
        </div>
        {/* 右：展示信息可编辑 */}
        <div>
          <Title heading={6} style={{ marginBottom: 12 }}>{t('sharing.assetSupply.publish.displayTitle')}</Title>
          <Form labelPosition="top" onSubmit={submit} getFormApi={(api) => ((window as any).__pubForm = api)}>
            <Form.Slot label={{ text: t('sharing.assetSupply.publish.coverImage'), required: asset.type !== 'KNOWLEDGE' } as any}>
              <Upload
                action="" accept=".jpg,.jpeg,.png" maxSize={COVER_MAX_KB} showUploadList={false}
                beforeUpload={({ file }: any) => beforeCover(file.fileInstance as File)}
                customRequest={({ file, onSuccess }: any) => {
                  const f = file.fileInstance as File;
                  const url = URL.createObjectURL(f);
                  setCoverFile({ name: f.name, size: f.size / 1024, url });
                  setTimeout(() => onSuccess?.({}), 100);
                }}
              >
                <Button icon={<IconImage />}>{coverFile ? t('sharing.assetSupply.publish.coverReplace') : t('sharing.assetSupply.publish.coverImage')}</Button>
              </Upload>
              {coverFile ? (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  {coverFile.url && <img src={coverFile.url} alt="" style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--semi-color-border)' }} />}
                  <div style={{ fontSize: 12, color: 'var(--semi-color-text-1)' }}>
                    <div>{coverFile.name}</div>
                    <div style={{ color: 'var(--semi-color-text-2)' }}>{fmtSize(coverFile.size)}</div>
                  </div>
                  <Button size="small" theme="borderless" type="danger" onClick={() => setCoverFile(null)}>{t('common.remove')}</Button>
                </div>
              ) : (
                <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 4 }}>{t('sharing.assetSupply.publish.coverImageHint')}</div>
              )}
            </Form.Slot>
            <Form.Input field="displayName" label={t('sharing.assetSupply.publish.displayName')} placeholder={t('sharing.assetSupply.publish.displayNamePh')} maxLength={100} />
            <Form.TextArea field="displayDesc" label={t('sharing.assetSupply.publish.displayDesc')} placeholder={t('sharing.assetSupply.publish.displayDescPh')} maxLength={500} rows={3} rules={[{ required: true, min: 10, max: 500, message: t('sharing.assetSupply.publish.displayDescRequired') }]} trigger={['blur', 'change']} />
            <Form.TagInput field="categoryTags" label={t('sharing.assetSupply.publish.categoryTags')} placeholder={t('sharing.assetSupply.publish.categoryTagsPh')} />
            <Form.Slot label={{ text: t('sharing.assetSupply.publish.overview'), required: true } as any}>
              <RichTextEditor value={overview} onChange={setOverview} placeholder={t('sharing.assetSupply.publish.overviewPh')} maxLength={5000} minHeight={240} />
            </Form.Slot>
            <Form.Slot label={t('sharing.assetSupply.publish.videoUrl')}>
              <Upload
                action="" accept=".mp4" maxSize={VIDEO_MAX_KB} showUploadList={false}
                beforeUpload={({ file }: any) => beforeVideo(file.fileInstance as File)}
                customRequest={({ file, onSuccess }: any) => {
                  const f = file.fileInstance as File;
                  setVideoFile({ name: f.name, size: f.size / 1024 });
                  setTimeout(() => onSuccess?.({}), 100);
                }}
              >
                <Button icon={<IconVideoListStroked />}>{videoFile ? t('sharing.assetSupply.publish.videoReplace') : t('sharing.assetSupply.publish.videoUrl')}</Button>
              </Upload>
              {videoFile ? (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                  <span style={{ color: 'var(--semi-color-text-1)' }}>{videoFile.name}</span>
                  <span style={{ color: 'var(--semi-color-text-2)' }}>{fmtSize(videoFile.size)}</span>
                  <Button size="small" theme="borderless" type="danger" onClick={() => setVideoFile(null)}>{t('common.remove')}</Button>
                </div>
              ) : (
                <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 4 }}>{t('sharing.assetSupply.publish.videoUrlHint')}</div>
              )}
            </Form.Slot>
          </Form>
        </div>
      </div>
      <div className="ms-create-footer">
        <Space>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button theme="solid" type="primary" loading={submitting}
            onClick={() => { const v = (window as any).__pubForm?.getValues(); submit(v || {}); }}>
            {t('sharing.assetSupply.publish.submit')}
          </Button>
        </Space>
      </div>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div style={{ fontSize: 12, color: 'var(--semi-color-text-2)', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 13 }}>{value}</div>
  </div>
);

export default DevCenterPublishPage;
