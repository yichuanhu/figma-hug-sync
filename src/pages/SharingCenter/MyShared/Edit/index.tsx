import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, Form, Toast, Typography, Space, Tag, Banner, Upload, Divider,
} from '@douyinfe/semi-ui';
import { IconChevronLeft, IconImage, IconVideoListStroked, IconUpload } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import {
  findAsset, updateMeta, updateNativeContent, updateDisplayInfo, CURRENT_USER_ID,
  type ShareAsset,
} from '@/pages/SharingCenter/MyShared/store';
import RichTextEditor from '@/components/RichTextEditor';
import EmptyState from '@/components/EmptyState';
import '../Create/Knowledge/index.less';
import '../Create/Workflow/index.less';

const { Title, Text } = Typography;

const COVER_MAX_KB = 2 * 1024;
const VIDEO_MAX_KB = 100 * 1024;
const ATTACHMENT_MAX_KB = 50 * 1024;
const COVER_ACCEPT = ['image/jpeg', 'image/png'];
const VIDEO_ACCEPT = ['video/mp4'];
const ATTACHMENT_ACCEPT = '.pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.md,.txt,.zip';

const fmtSize = (kb: number) => (kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`);

interface FileInfo { name: string; size: number; url?: string }

/** 通用：封面/视频上传 + 展示字段表单段 */
const useDisplayMedia = (asset: ShareAsset, t: (k: string) => string) => {
  const [coverFile, setCoverFile] = useState<FileInfo | null>(
    asset.coverImage ? { name: t('sharing.market.editDisplay.existingCover'), size: 0, url: asset.coverImage } : null,
  );
  const [videoFile, setVideoFile] = useState<FileInfo | null>(
    asset.videoUrl ? { name: asset.videoUrl, size: 0 } : null,
  );
  const [overview, setOverview] = useState<string>(asset.overview ?? '');

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

  return { coverFile, setCoverFile, videoFile, setVideoFile, overview, setOverview, beforeCover, beforeVideo };
};

/** 公共：展示信息表单段（封面/展示名称/描述/分类标签/概览/视频） */
const DisplaySection = (props: {
  coverFile: FileInfo | null;
  setCoverFile: (f: FileInfo | null) => void;
  videoFile: FileInfo | null;
  setVideoFile: (f: FileInfo | null) => void;
  overview: string;
  setOverview: (v: string) => void;
  beforeCover: (f: File) => boolean;
  beforeVideo: (f: File) => boolean;
}) => {
  const { t } = useTranslation();
  const { coverFile, setCoverFile, videoFile, setVideoFile, overview, setOverview, beforeCover, beforeVideo } = props;
  return (
    <>
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
          <Button icon={<IconImage />}>
            {coverFile ? t('sharing.assetSupply.publish.coverReplace') : t('sharing.assetSupply.publish.coverImage')}
          </Button>
        </Upload>
        {coverFile ? (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            {coverFile.url && (
              <img src={coverFile.url} alt="" style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--semi-color-border)' }} />
            )}
            <div style={{ fontSize: 12, color: 'var(--semi-color-text-1)' }}>
              <div>{coverFile.name}</div>
              {coverFile.size > 0 && <div style={{ color: 'var(--semi-color-text-2)' }}>{fmtSize(coverFile.size)}</div>}
            </div>
            <Button size="small" theme="borderless" type="danger" onClick={() => setCoverFile(null)}>{t('common.remove')}</Button>
          </div>
        ) : (
          <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 4 }}>{t('sharing.assetSupply.publish.coverImageHint')}</div>
        )}
      </Form.Slot>
      <Form.Input
        field="displayName"
        label={{ text: t('sharing.assetSupply.publish.displayName'), required: true } as any}
        placeholder={t('sharing.assetSupply.publish.displayNamePh')}
        maxLength={100}
        trigger={['blur', 'change']}
      />
      <Form.TextArea
        field="displayDesc"
        label={{ text: t('sharing.assetSupply.publish.displayDesc'), required: true } as any}
        placeholder={t('sharing.assetSupply.publish.displayDescPh')}
        maxLength={500} rows={3}
      />
      <Form.TagInput
        field="categoryTags"
        label={t('sharing.assetSupply.publish.categoryTags')}
        placeholder={t('sharing.assetSupply.publish.categoryTagsPh')}
      />
      <Form.Slot label={{ text: t('sharing.assetSupply.publish.overview'), required: true } as any}>
        <RichTextEditor
          value={overview}
          onChange={setOverview}
          placeholder={t('sharing.assetSupply.publish.overviewPh')}
          maxLength={5000}
          minHeight={240}
        />
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
          <Button icon={<IconVideoListStroked />}>
            {videoFile ? t('sharing.assetSupply.publish.videoReplace') : t('sharing.assetSupply.publish.videoUrl')}
          </Button>
        </Upload>
        {videoFile ? (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
            <span style={{ color: 'var(--semi-color-text-1)' }}>{videoFile.name}</span>
            {videoFile.size > 0 && <span style={{ color: 'var(--semi-color-text-2)' }}>{fmtSize(videoFile.size)}</span>}
            <Button size="small" theme="borderless" type="danger" onClick={() => setVideoFile(null)}>{t('common.remove')}</Button>
          </div>
        ) : (
          <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 4 }}>{t('sharing.assetSupply.publish.videoUrlHint')}</div>
        )}
      </Form.Slot>
    </>
  );
};

/** 共享流程编辑：元信息只读 + 仅展示信息可编 */
const WorkflowEditView = ({ asset }: { asset: ShareAsset }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const formApi = useRef<any>(null);
  const media = useDisplayMedia(asset, t);
  const [submitting, setSubmitting] = useState(false);

  const initValues = {
    displayName: asset.displayName ?? asset.name,
    displayDesc: asset.displayDesc ?? asset.description,
    categoryTags: asset.categoryTags ?? [],
  };

  const onSubmit = (values: typeof initValues) => {
    const dn = (values.displayName ?? '').trim();
    if (!dn) { Toast.warning(t('sharing.assetSupply.publish.displayNamePh')); return; }
    const dd = (values.displayDesc ?? '').trim();
    if (!dd || dd.length < 10) { Toast.warning(t('sharing.assetSupply.publish.displayDescRequired')); return; }
    const ov = media.overview.replace(/<[^>]+>/g, '').trim();
    if (ov.length < 20) { Toast.warning(t('sharing.assetSupply.publish.overviewRequired')); return; }

    setSubmitting(true);
    updateDisplayInfo(asset.id, {
      coverImage: media.coverFile?.url || undefined,
      displayName: dn,
      displayDesc: dd,
      categoryTags: values.categoryTags,
      overview: media.overview || undefined,
      videoUrl: media.videoFile?.name || undefined,
    });
    Toast.success(t('sharing.assetSupply.toast.saved'));
    setSubmitting(false);
    navigate('/sharing-center/my-shared');
  };

  return (
    <div className="ms-create-page">
      <div className="ms-create-header">
        <Button icon={<IconChevronLeft />} theme="borderless" onClick={() => navigate(-1)} />
        <Title heading={3} style={{ margin: 0 }}>{t('sharing.assetSupply.edit.workflowTitle')}</Title>
        <Tag size="small" color="blue" style={{ marginLeft: 8 }}>{asset.currentVersion}</Tag>
      </div>
      <div className="ms-create-body">
        <Banner
          type="info"
          fullMode={false}
          closeIcon={null}
          description={t('sharing.assetSupply.edit.processMetaReadonly')}
          style={{ marginBottom: 16 }}
        />
        <Title heading={6} style={{ marginBottom: 12 }}>{t('sharing.assetSupply.edit.sectionProcess')}</Title>
        <div className="process-info-card">
          <div className="info-row">
            <span className="info-label">{t('sharing.assetSupply.create.fields.processName')}</span>
            <span className="info-value">{asset.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('sharing.assetSupply.create.fields.processDesc')}</span>
            <span className="info-value">{asset.description}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('sharing.assetSupply.create.fields.processDept')}</span>
            <span className="info-value">{asset.departmentName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('sharing.assetSupply.create.fields.selectVersion')}</span>
            <span className="info-value">{asset.currentVersion}</span>
          </div>
          {asset.resourceDeps && asset.resourceDeps.length > 0 && (
            <div className="info-row">
              <span className="info-label">{t('sharing.assetSupply.create.fields.processDeps')}</span>
              <span className="info-value">{asset.resourceDeps.join('、')}</span>
            </div>
          )}
        </div>

        <Divider style={{ margin: '24px 0' }} />

        <Title heading={6} style={{ marginBottom: 4 }}>{t('sharing.assetSupply.create.sectionDisplay')}</Title>
        <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 12 }}>
          {t('sharing.assetSupply.create.sectionDisplayHint')}
        </Text>
        <Form
          getFormApi={(api) => { formApi.current = api; }}
          initValues={initValues}
          onSubmit={onSubmit as any}
          labelPosition="top"
        >
          <DisplaySection {...media} />
        </Form>
      </div>
      <div className="ms-create-footer">
        <Space>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button theme="solid" type="primary" loading={submitting} onClick={() => formApi.current?.submitForm()}>
            {t('sharing.assetSupply.edit.saveChanges')}
          </Button>
        </Space>
      </div>
    </div>
  );
};

/** 共享知识编辑：元信息 + 展示信息全可编（不支持发布新版本） */
const KnowledgeEditView = ({ asset }: { asset: ShareAsset }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const formApi = useRef<any>(null);
  const media = useDisplayMedia(asset, t);
  const [content, setContent] = useState<string>(asset.knowledge?.contentHtml ?? '');
  const initAtt = asset.knowledge?.attachments?.[0];
  const [attachmentFile, setAttachmentFile] = useState<{ name: string; size: number; url?: string } | null>(
    initAtt ? { name: initAtt.name, size: 0, url: initAtt.url } : null,
  );
  const [submitting, setSubmitting] = useState(false);

  const initValues = {
    name: asset.name,
    
    description: asset.description,
    displayName: asset.displayName ?? asset.name,
    displayDesc: asset.displayDesc ?? asset.description,
    categoryTags: asset.categoryTags ?? [],
  };

  const onSubmit = (values: typeof initValues) => {
    const name = (values.name ?? '').trim();
    if (name.length < 2) { Toast.warning(t('sharing.assetSupply.create.fields.namePh')); return; }
    if (!attachmentFile) { Toast.warning(t('sharing.assetSupply.create.fields.attachmentRequired')); return; }
    const description = (values.description ?? '').trim();
    if (description.length < 10) { Toast.warning(t('sharing.assetSupply.create.fields.descPh')); return; }
    const dn = (values.displayName ?? '').trim();
    if (!dn) { Toast.warning(t('sharing.assetSupply.publish.displayNamePh')); return; }
    const dd = (values.displayDesc ?? '').trim();
    if (!dd || dd.length < 10) { Toast.warning(t('sharing.assetSupply.publish.displayDescRequired')); return; }
    const ov = media.overview.replace(/<[^>]+>/g, '').trim();
    if (ov.length < 20) { Toast.warning(t('sharing.assetSupply.publish.overviewRequired')); return; }

    setSubmitting(true);
    updateMeta(asset.id, { name, description });
    updateNativeContent(asset.id, {
      knowledge: {
        contentHtml: content || `<p>${description}</p>`,
        attachments: [{
          name: attachmentFile.name,
          size: attachmentFile.size > 0 ? `${attachmentFile.size.toFixed(0)} KB` : (initAtt?.size ?? '—'),
          url: attachmentFile.url ?? '#',
        }],
      },
    });
    updateDisplayInfo(asset.id, {
      coverImage: media.coverFile?.url || undefined,
      displayName: dn,
      displayDesc: dd,
      categoryTags: values.categoryTags,
      overview: media.overview || undefined,
      videoUrl: media.videoFile?.name || undefined,
    });
    Toast.success(t('sharing.assetSupply.toast.saved'));
    setSubmitting(false);
    navigate('/sharing-center/my-shared');
  };

  return (
    <div className="ms-create-page">
      <div className="ms-create-header">
        <Button icon={<IconChevronLeft />} theme="borderless" onClick={() => navigate(-1)} />
        <Title heading={3} style={{ margin: 0 }}>{t('sharing.assetSupply.edit.knowledgeTitle')}</Title>
        <Tag size="small" color="blue" style={{ marginLeft: 8 }}>{asset.currentVersion}</Tag>
      </div>
      <div className="ms-create-body">
        <Form
          getFormApi={(api) => { formApi.current = api; }}
          initValues={initValues}
          onSubmit={onSubmit as any}
          labelPosition="top"
        >
          <Title heading={6} style={{ marginBottom: 12 }}>{t('sharing.assetSupply.create.sectionBasic')}</Title>
          <Form.Input
            field="name"
            label={t('sharing.assetSupply.create.fields.name')}
            placeholder={t('sharing.assetSupply.create.fields.namePh')}
            rules={[{ required: true, min: 2, max: 100, message: t('sharing.assetSupply.create.fields.namePh') }]}
            trigger={['blur', 'change']}
          />
          <Form.TextArea
            field="description"
            label={t('sharing.assetSupply.create.fields.description')}
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
                {attachmentFile.size > 0 && (
                  <span style={{ color: 'var(--semi-color-text-2)' }}>{fmtSize(attachmentFile.size)}</span>
                )}
                <Button size="small" theme="borderless" type="danger" onClick={() => setAttachmentFile(null)}>{t('common.remove')}</Button>
              </div>
            ) : (
              <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 4 }}>
                {t('sharing.assetSupply.create.fields.attachmentHint')}
              </div>
            )}
          </Form.Slot>
          <Form.Slot label={t('sharing.assetSupply.create.fields.content')}>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder={t('sharing.assetSupply.create.fields.descPh')}
              maxLength={5000}
            />
            <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 4 }}>
              {t('sharing.assetSupply.create.fields.contentOptionalHint')}
            </div>
          </Form.Slot>

          <Divider style={{ margin: '24px 0' }} />

          <Title heading={6} style={{ marginBottom: 4 }}>{t('sharing.assetSupply.create.sectionDisplay')}</Title>
          <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 12 }}>
            {t('sharing.assetSupply.create.sectionDisplayHint')}
          </Text>
          <DisplaySection {...media} />
        </Form>
      </div>
      <div className="ms-create-footer">
        <Space>
          <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
          <Button theme="solid" type="primary" loading={submitting} onClick={() => formApi.current?.submitForm()}>
            {t('sharing.assetSupply.edit.saveChanges')}
          </Button>
        </Space>
      </div>
    </div>
  );
};

const EditPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const asset = findAsset(id);

  useEffect(() => {
    if (asset && asset.creatorId !== CURRENT_USER_ID && asset.source === 'NATIVE') {
      Toast.warning(t('sharing.assetSupply.edit.noPermission'));
      navigate('/sharing-center/my-shared');
    }
  }, [asset, navigate, t]);

  if (!asset) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState variant="notFound" description={t('sharing.assetSupply.edit.notFound')} actions={['goBack']} />
      </div>
    );
  }

  return asset.type === 'WORKFLOW'
    ? <WorkflowEditView asset={asset} />
    : <KnowledgeEditView asset={asset} />;
};

export default EditPage;
