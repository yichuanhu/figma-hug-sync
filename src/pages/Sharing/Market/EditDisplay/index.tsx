import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography, Button, Form, Toast, Tooltip, Space, TagInput, Banner,
} from '@douyinfe/semi-ui';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  findMarketAsset, getMarketAssets, subscribe, isOwner, updateDisplayInfo,
} from '@/pages/SharingCenter/MyShared/store';
import EmptyState from '@/components/EmptyState';
import './index.less';

const { Title, Text } = Typography;

const typeRouteMap: Record<string, string> = {
  workflow: 'WORKFLOW', knowledge: 'KNOWLEDGE',
};

const EditDisplay = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { type, id } = useParams<{ type: string; id: string }>();
  const version = useSyncExternalStore(subscribe, () => getMarketAssets().length);
  const asset = useMemo(() => (id ? findMarketAsset(id) : undefined), [id, version]);
  const formApi = useRef<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // 类型不支持
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

  // 权限校验：仅上架者可编辑
  if (!isOwner(asset.id)) {
    setTimeout(() => {
      Toast.warning(t('sharing.market.editDisplay.noPermission'));
      navigate(`/sharing-center/market/${type}/${asset.id}`, { replace: true });
    }, 0);
    return null;
  }

  const initialValues = {
    coverImage: asset.coverImage ?? '',
    displayName: asset.displayName ?? asset.name,
    displayDesc: asset.displayDesc ?? asset.description,
    categoryTags: asset.categoryTags ?? [],
    overview: asset.overview ?? '',
    videoUrl: asset.videoUrl ?? '',
  };

  const handleSubmit = async (values: typeof initialValues) => {
    setSubmitting(true);
    try {
      const ok = updateDisplayInfo(asset.id, {
        coverImage: values.coverImage || undefined,
        displayName: values.displayName?.trim() || undefined,
        displayDesc: values.displayDesc?.trim() || undefined,
        categoryTags: values.categoryTags,
        overview: values.overview || undefined,
        videoUrl: values.videoUrl || undefined,
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
          <Form.Input
            field="coverImage"
            label={t('sharing.market.editDisplay.coverImage')}
            placeholder="https://..."
            trigger={['blur', 'change']}
          />
          <Form.Input
            field="displayName"
            label={t('sharing.market.editDisplay.displayName')}
            rules={[
              { required: true, message: t('sharing.market.editDisplay.displayNameRequired') },
              { max: 60, message: t('sharing.market.editDisplay.displayNameMax') },
            ]}
            trigger={['blur', 'change']}
            maxLength={60}
            showClear
          />
          <Form.TextArea
            field="displayDesc"
            label={t('sharing.market.editDisplay.displayDesc')}
            maxCount={200}
            maxLength={200}
            autosize={{ minRows: 2, maxRows: 4 }}
          />
          <Form.Slot label={t('sharing.market.editDisplay.categoryTags')}>
            <TagInput
              defaultValue={initialValues.categoryTags}
              onChange={(v) => formApi.current?.setValue('categoryTags', v)}
              placeholder={t('sharing.market.editDisplay.categoryTagsPlaceholder')}
              max={10}
              maxTagCount={10}
            />
          </Form.Slot>
          <Form.TextArea
            field="overview"
            label={t('sharing.market.editDisplay.overview')}
            placeholder={t('sharing.market.editDisplay.overviewPlaceholder')}
            maxCount={2000}
            maxLength={2000}
            autosize={{ minRows: 4, maxRows: 10 }}
          />
          <Form.Input
            field="videoUrl"
            label={t('sharing.market.editDisplay.videoUrl')}
            placeholder="https://..."
            trigger={['blur', 'change']}
          />

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
