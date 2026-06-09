import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography, Button, Form, Toast, Tooltip, Space, Banner, Upload,
} from '@douyinfe/semi-ui';
import { IconImage, IconVideoListStroked } from '@douyinfe/semi-icons';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  findMarketAsset, getMarketAssets, subscribe, isOwner, updateDisplayInfo,
} from '@/pages/SharingCenter/MyShared/store';
import RichTextEditor from '@/components/RichTextEditor';
import EmptyState from '@/components/EmptyState';
import './index.less';

const { Title, Text } = Typography;

const typeRouteMap: Record<string, string> = {
  workflow: 'WORKFLOW', knowledge: 'KNOWLEDGE',
};

const COVER_MAX_KB = 2 * 1024;
const VIDEO_MAX_KB = 100 * 1024;
const COVER_ACCEPT = ['image/jpeg', 'image/png'];
const VIDEO_ACCEPT = ['video/mp4'];

const fmtSize = (kb: number) => (kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`);

const EditDisplay = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { type, id } = useParams<{ type: string; id: string }>();
  const version = useSyncExternalStore(subscribe, () => getMarketAssets().length);
  const asset = useMemo(() => (id ? findMarketAsset(id) : undefined), [id, version]);
  const formApi = useRef<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [coverFile, setCoverFile] = useState<{ name: string; size: number; url?: string } | null>(
    asset?.coverImage ? { name: t('sharing.market.editDisplay.existingCover'), size: 0, url: asset.coverImage } : null,
  );
  const [videoFile, setVideoFile] = useState<{ name: string; size: number } | null>(
    asset?.videoUrl ? { name: asset.videoUrl, size: 0 } : null,
  );
  const [overview, setOverview] = useState<string>(asset?.overview ?? '');

  if (!type || !typeRouteMap[type]) {
    return (
      <div className="edit-display-empty">
        <EmptyState variant="notFound" description={t('sharing.market.detail.notFound')} actions={['goBack']} />
      </div>
    );
  }

  if (!asset || typeRouteMap[type] !== asset.type) {
    return (
      <div className="edit-display-empty">
        <EmptyState variant="notFound" description={t('sharing.market.detail.notFound')} actions={['goBack']} />
      </div>
    );
  }

  if (!isOwner(asset.id)) {
    setTimeout(() => {
      Toast.warning(t('sharing.market.editDisplay.noPermission'));
      navigate(`/sharing-center/market/${type}/${asset.id}`, { replace: true });
    }, 0);
    return null;
  }

  const initialValues = {
    displayName: asset.displayName ?? asset.name,
    displayDesc: asset.displayDesc ?? asset.description,
    categoryTags: asset.categoryTags ?? [],
  };

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

  const handleSubmit = async (values: typeof initialValues) => {
    const dn = (values.displayName ?? '').trim();
    if (!dn) { Toast.warning(t('sharing.market.editDisplay.displayNameRequired')); return; }
    const dd = (values.displayDesc ?? '').trim();
    if (!dd || dd.length < 10) { Toast.warning(t('sharing.assetSupply.publish.displayDescRequired')); return; }
    const ov = overview.replace(/<[^>]+>/g, '').trim();
    if (ov.length < 20) { Toast.warning(t('sharing.assetSupply.publish.overviewRequired')); return; }

    setSubmitting(true);
    try {
      const ok = updateDisplayInfo(asset.id, {
        coverImage: coverFile?.url || undefined,
        displayName: dn || undefined,
        displayDesc: dd || undefined,
        categoryTags: values.categoryTags,
        overview: overview || undefined,
        videoUrl: videoFile?.name || undefined,
      });
      if (!ok) {
        Toast.error(t('sharing.market.editDisplay.saveFailed'));
        return;
      }
      Toast.success(t('sharing.market.editDisplay.saveSuccess'));
      navigate(`/sharing-center/market/${type}/${asset.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="edit-display">
      <div className="edit-display-back">
        <Tooltip content={t('common.back')}>
          <Button
            type="tertiary"
            theme="borderless"
            icon={<ChevronLeft size={18} strokeWidth={2} />}
            onClick={() => navigate(-1)}
          />
        </Tooltip>
        <Title heading={3} style={{ margin: 0 }}>{t('sharing.market.editDisplay.title')}</Title>
      </div>

      <Banner
        type="info"
        fullMode={false}
        closeIcon={null}
        description={t('sharing.market.editDisplay.tip')}
        style={{ marginBottom: 16 }}
      />

      <div className="edit-display-card">
        <Form
          getFormApi={(api) => { formApi.current = api; }}
          initValues={initialValues}
          onSubmit={handleSubmit}
          labelPosition="top"
        >
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
                  <img
                    src={coverFile.url}
                    alt=""
                    style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--semi-color-border)' }}
                  />
                )}
                <div style={{ fontSize: 12, color: 'var(--semi-color-text-1)' }}>
                  <div>{coverFile.name}</div>
                  {coverFile.size > 0 && (
                    <div style={{ color: 'var(--semi-color-text-2)' }}>{fmtSize(coverFile.size)}</div>
                  )}
                </div>
                <Button size="small" theme="borderless" type="danger" onClick={() => setCoverFile(null)}>
                  {t('common.remove')}
                </Button>
              </div>
            ) : (
              <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 4 }}>
                {t('sharing.assetSupply.publish.coverImageHint')}
              </div>
            )}
          </Form.Slot>

          <Form.Input
            field="displayName"
            label={{ text: t('sharing.assetSupply.publish.displayName'), required: true } as any}
            placeholder={t('sharing.assetSupply.publish.displayNamePh')}
            maxLength={100}
            trigger={['blur', 'change']}
            showClear
          />
          <Form.TextArea
            field="displayDesc"
            label={{ text: t('sharing.assetSupply.publish.displayDesc'), required: true } as any}
            placeholder={t('sharing.assetSupply.publish.displayDescPh')}
            maxLength={500}
            rows={3}
          />
          <Form.TagInput
            field="categoryTags"
            label={t('sharing.assetSupply.publish.categoryTags')}
            placeholder={t('sharing.assetSupply.publish.categoryTagsPh')}
            maxTagCount={10}
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
                {videoFile.size > 0 && (
                  <span style={{ color: 'var(--semi-color-text-2)' }}>{fmtSize(videoFile.size)}</span>
                )}
                <Button size="small" theme="borderless" type="danger" onClick={() => setVideoFile(null)}>
                  {t('common.remove')}
                </Button>
              </div>
            ) : (
              <div style={{ color: 'var(--semi-color-text-2)', fontSize: 12, marginTop: 4 }}>
                {t('sharing.assetSupply.publish.videoUrlHint')}
              </div>
            )}
          </Form.Slot>

          <div className="edit-display-actions">
            <Space>
              <Button onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
              <Button type="primary" theme="solid" htmlType="submit" loading={submitting}>
                {t('common.save')}
              </Button>
            </Space>
            <Text type="tertiary" size="small" style={{ marginTop: 8 }}>
              {t('sharing.market.editDisplay.noVersionTip')}
            </Text>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default EditDisplay;
