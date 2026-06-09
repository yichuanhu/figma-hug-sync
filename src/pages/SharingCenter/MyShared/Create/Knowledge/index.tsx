import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Toast, Typography, Space, Upload, Divider, Modal } from '@douyinfe/semi-ui';
import { IconChevronLeft, IconUpload, IconImage, IconVideoListStroked } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import {
  addAsset, makeNativeKnowledge, buildAssetId, publishNewVersion, type ShareAsset,
} from '@/pages/SharingCenter/MyShared/store';
import RichTextEditor from '@/components/RichTextEditor';
import './index.less';

const { Title, Text } = Typography;

const COVER_MAX_KB = 2 * 1024;       // 2MB
const VIDEO_MAX_KB = 100 * 1024;     // 100MB
const ATTACHMENT_MAX_KB = 50 * 1024; // 50MB
const COVER_ACCEPT = ['image/jpeg', 'image/png'];
const VIDEO_ACCEPT = ['video/mp4'];
const ATTACHMENT_ACCEPT = '.pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.md,.txt,.zip';

const KnowledgeCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [overview, setOverview] = useState('');
  const [coverFile, setCoverFile] = useState<{ name: string; size: number; url?: string } | null>(null);
  const [videoFile, setVideoFile] = useState<{ name: string; size: number } | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<{ name: string; size: number; url?: string } | null>(null);

  const fmtSize = (kb: number) => kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;

  const beforeCover = (file: File) => {
    if (!COVER_ACCEPT.includes(file.type)) { Toast.error(t('sharing.assetSupply.publish.coverTypeError')); return false; }
    if (file.size / 1024 > COVER_MAX_KB) { Toast.error(t('sharing.assetSupply.publish.coverSizeError')); return false; }
    return true;
  };
  const beforeVideo = (file: File) => {
    if (!VIDEO_ACCEPT.includes(file.type) && !file.name.toLowerCase().endsWith('.mp4')) {
      Toast.error(t('sharing.assetSupply.publish.videoTypeError')); return false;
    }
    if (file.size / 1024 > VIDEO_MAX_KB) { Toast.error(t('sharing.assetSupply.publish.videoSizeError')); return false; }
    return true;
  };

  const submit = async (values: any, publish: boolean) => {
    // 基础校验（草稿 + 上架共需）
    if (!values?.name || values.name.length < 2) {
      Toast.warning(t('sharing.assetSupply.create.fields.namePh'));
      return;
    }
    if (!attachmentFile) {
      Toast.warning(t('sharing.assetSupply.create.fields.attachmentRequired'));
      return;
    }
    const description = (values.description ?? '').trim();
    if (!description || description.length < 10) {
      Toast.warning(t('sharing.assetSupply.create.fields.descPh'));
      return;
    }

    // 上架专属校验：展示描述 / 概览（封面非必填，缺省时详情页使用默认占位）
    if (publish) {
      const dd = (values.displayDesc ?? '').trim();
      if (!dd || dd.length < 10) { Toast.warning(t('sharing.assetSupply.publish.displayDescRequired')); return; }
      const ov = overview.replace(/<[^>]+>/g, '').trim();
      if (ov.length < 20) { Toast.warning(t('sharing.assetSupply.publish.overviewRequired')); return; }
    }

    setSubmitting(true);
    const id = buildAssetId('kn');
    const today = new Date().toISOString().slice(0, 10);
    const asset: ShareAsset = makeNativeKnowledge(id, values.name, description, 'DRAFT', today, {
      contentHtml: content || `<p>${description}</p>`,
      attachments: [{
        name: attachmentFile.name,
        size: `${attachmentFile.size.toFixed(0)} KB`,
        url: attachmentFile.url ?? '#',
      }],
    });
    asset.tags = [];

    // 写入上架展示信息
    if (publish) {
      asset.coverImage = coverFile?.url;
      asset.displayName = (values.displayName ?? '').trim() || undefined;
      asset.displayDesc = (values.displayDesc ?? '').trim() || undefined;
      asset.categoryTags = Array.isArray(values.categoryTags) ? values.categoryTags : undefined;
      asset.overview = overview || undefined;
      asset.videoUrl = videoFile?.name;
    }

    addAsset(asset);
    if (publish) publishNewVersion(id, { changeLog: '首发版本' });
    Toast.success(publish ? t('sharing.assetSupply.toast.published') : t('sharing.assetSupply.toast.saved'));
    setSubmitting(false);
    navigate('/sharing-center/my-published');
  };

  return (
    <div className="ms-create-page">
      <div className="ms-create-header">
        <Button icon={<IconChevronLeft />} theme="borderless" onClick={() => navigate(-1)} />
        <Title heading={3} style={{ margin: 0 }}>{t('sharing.assetSupply.create.knowledgeTitle')}</Title>
      </div>
      <div className="ms-create-body">
        <Form labelPosition="top" labelAlign="left" onSubmit={(v) => submit(v, true)} getFormApi={(api) => ((window as any).__knForm = api)}>
          {/* —— 第 1 段：基础信息（草稿即可保存） —— */}
          <Title heading={6} style={{ marginBottom: 12 }}>{t('sharing.assetSupply.create.sectionBasic')}</Title>
          <Form.Input
            field="name" label={t('sharing.assetSupply.create.fields.name')}
            placeholder={t('sharing.assetSupply.create.fields.namePh')}
            rules={[{ required: true, message: t('sharing.assetSupply.create.fields.namePh') }, { min: 2, max: 100 }]}
            trigger={['blur', 'change']}
          />
          <Form.TextArea
            field="description" label={t('sharing.assetSupply.create.fields.description')}
            placeholder={t('sharing.assetSupply.create.fields.descPh')}
            maxLength={500} maxCount={500} rows={3}
            rules={[{ required: true, min: 10, max: 500, message: t('sharing.assetSupply.create.fields.descPh') }]}
            trigger={['blur', 'change']}
          />
          <Form.Slot label={{ text: t('sharing.assetSupply.create.fields.attachment'), required: true } as any}>
            <Upload
              action="" accept={ATTACHMENT_ACCEPT} maxSize={ATTACHMENT_MAX_KB} showUploadList={false}
              beforeUpload={({ file }: any) => {
                const f = file.fileInstance as File;
                if (f.size / 1024 > ATTACHMENT_MAX_KB) {
                  Toast.error(t('sharing.assetSupply.create.fields.attachmentHint'));
                  return false;
                }
                return true;
              }}
              customRequest={({ file, onSuccess }: any) => {
                const f = file.fileInstance as File;
                const url = URL.createObjectURL(f);
                setAttachmentFile({ name: f.name, size: f.size / 1024, url });
                setTimeout(() => onSuccess?.({}), 100);
              }}
            >
              <Button icon={<IconUpload />}>
                {attachmentFile ? t('sharing.assetSupply.create.fields.attachmentReplace') : t('sharing.assetSupply.create.selectAttachment')}
              </Button>
            </Upload>
            {attachmentFile ? (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                <span style={{ color: 'var(--semi-color-text-1)' }}>{attachmentFile.name}</span>
                <span style={{ color: 'var(--semi-color-text-2)' }}>{fmtSize(attachmentFile.size)}</span>
                <Button size="small" theme="borderless" type="danger" onClick={() => setAttachmentFile(null)}>{t('common.remove')}</Button>
              </div>
            ) : (
              <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 4 }}>
                {t('sharing.assetSupply.create.fields.attachmentHint')}
              </div>
            )}
          </Form.Slot>
          <Form.Slot label={t('sharing.assetSupply.create.fields.content')}>
            <RichTextEditor value={content} onChange={setContent} placeholder={t('sharing.assetSupply.create.fields.descPh')} maxLength={5000} />
            <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 4 }}>
              {t('sharing.assetSupply.create.fields.contentOptionalHint')}
            </div>
          </Form.Slot>

          <Divider style={{ margin: '24px 0' }} />

          {/* —— 第 2 段：上架展示信息（仅"立即上架"必填） —— */}
          <Title heading={6} style={{ marginBottom: 4 }}>{t('sharing.assetSupply.create.sectionDisplay')}</Title>
          <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 12 }}>
            {t('sharing.assetSupply.create.sectionDisplayHint')}
          </Text>

          <Form.Slot label={t('sharing.assetSupply.publish.coverImage')}>
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
          <Form.TextArea
            field="displayDesc" label={t('sharing.assetSupply.publish.displayDesc')}
            placeholder={t('sharing.assetSupply.publish.displayDescPh')} maxLength={500} rows={3}
          />
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
      <div className="ms-create-footer">
        <Space>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button onClick={() => { const v = (window as any).__knForm?.getValues(); submit(v, false); }} loading={submitting}>
            {t('sharing.assetSupply.create.saveDraft')}
          </Button>
          <Button theme="solid" type="primary" loading={submitting}
            onClick={() => {
              const v = (window as any).__knForm?.getValues();
              Modal.confirm({
                title: t('sharing.assetSupply.create.confirmTitle'),
                content: t('sharing.assetSupply.create.confirmContent'),
                okText: t('sharing.assetSupply.create.confirmOk'),
                cancelText: t('common.cancel'),
                onOk: () => submit(v, true),
              });
            }}>
            {t('sharing.assetSupply.create.publish')}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default KnowledgeCreatePage;
