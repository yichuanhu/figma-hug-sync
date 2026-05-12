import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal, Form, Upload, Toast, Typography, Button,
} from '@douyinfe/semi-ui';
import { Inbox, X, Image as ImageIcon } from 'lucide-react';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import {
  createAnnouncement,
  updateAnnouncement,
  type PlatformAnnouncement,
  type AnnouncementPriority,
} from '../../mockData';
import './index.less';

const { Text } = Typography;

const MAX_IMG = 5 * 1024 * 1024;
const ALLOWED_IMG = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

interface Props {
  visible: boolean;
  editing: PlatformAnnouncement | null;
  onClose: () => void;
}

interface FormValues {
  title: string;
  summary?: string;
  priority: AnnouncementPriority;
  isBanner: boolean;
  bannerVersion?: string;
  content: string;
}

const AnnouncementFormModal = ({ visible, editing, onClose }: Props) => {
  const { t } = useTranslation();
  const [isBanner, setIsBanner] = useState(false);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | undefined>();
  const [bannerImageKey, setBannerImageKey] = useState<string | undefined>();
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [imgError, setImgError] = useState<string | null>(null);
  const [formApi, setFormApi] = useState<any>(null);

  useEffect(() => {
    if (!visible) return;
    setIsBanner(editing?.isBanner ?? false);
    setBannerImageUrl(editing?.bannerImageUrl);
    setBannerImageKey(editing?.bannerImageKey);
    setFileList([]);
    setImgError(null);
  }, [visible, editing]);

  const handleImageChange = useCallback((info: { fileList: FileItem[] }) => {
    const last = info.fileList[info.fileList.length - 1];
    if (last?.fileInstance) {
      const f = last.fileInstance;
      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ALLOWED_IMG.includes(ext)) {
        setImgError(t('operations.platformOperations.announcements.validation.imageInvalid'));
        setFileList([]);
        return;
      }
      if (f.size > MAX_IMG) {
        setImgError(t('operations.platformOperations.announcements.validation.imageTooLarge'));
        setFileList([]);
        return;
      }
      setImgError(null);
      const url = URL.createObjectURL(f);
      setBannerImageUrl(url);
      setBannerImageKey(undefined);
    }
    setFileList(info.fileList.slice(-1));
  }, [t]);

  const handleSubmit = async (values: FormValues) => {
    if (values.isBanner && !bannerImageUrl && !bannerImageKey) {
      setImgError(t('operations.platformOperations.announcements.validation.bannerImageRequired'));
      return;
    }
    const payload = {
      title: values.title.trim(),
      summary: values.summary?.trim() ?? '',
      content: values.content.trim(),
      priority: values.priority,
      isBanner: values.isBanner,
      bannerImageUrl: values.isBanner ? bannerImageUrl : undefined,
      bannerImageKey: values.isBanner ? bannerImageKey : undefined,
      bannerGradient: editing?.bannerGradient,
      bannerIcon: editing?.bannerIcon,
      bannerVersion: values.isBanner ? values.bannerVersion?.trim() : undefined,
    };
    if (editing) {
      updateAnnouncement(editing.id, payload);
      Toast.success(t('operations.platformOperations.announcements.toast.updated'));
    } else {
      createAnnouncement(payload);
      Toast.success(t('operations.platformOperations.announcements.toast.created'));
    }
    onClose();
  };

  const initValues: FormValues = {
    title: editing?.title ?? '',
    summary: editing?.summary ?? '',
    priority: editing?.priority ?? 'normal',
    isBanner: editing?.isBanner ?? false,
    bannerVersion: editing?.bannerVersion ?? '',
    content: editing?.content ?? '',
  };

  return (
    <Modal
      title={editing
        ? t('operations.platformOperations.announcements.edit')
        : t('operations.platformOperations.announcements.create')}
      visible={visible}
      onCancel={onClose}
      onOk={() => formApi?.submitForm()}
      width={520}
      maskClosable={false}
      className="platform-ops-announcement-modal"
    >
      <Form<FormValues>
        initValues={initValues}
        onSubmit={handleSubmit}
        getFormApi={setFormApi}
        labelPosition="top"
      >
        <Form.Input
          field="title"
          label={t('operations.platformOperations.announcements.form.title')}
          placeholder={t('operations.platformOperations.announcements.form.titlePlaceholder')}
          maxLength={200}
          showClear
          trigger={['blur', 'change']}
          rules={[{ required: true, message: t('operations.platformOperations.announcements.validation.titleRequired') }]}
        />
        <Form.Input
          field="summary"
          label={t('operations.platformOperations.announcements.form.summary')}
          placeholder={t('operations.platformOperations.announcements.form.summaryPlaceholder')}
          maxLength={200}
          showClear
        />
        <Form.Select
          field="priority"
          label={t('operations.platformOperations.announcements.form.priority')}
          style={{ width: '100%' }}
          optionList={[
            { label: t('operations.platformOperations.announcements.form.priorityOptions.urgent'), value: 'urgent' },
            { label: t('operations.platformOperations.announcements.form.priorityOptions.important'), value: 'important' },
            { label: t('operations.platformOperations.announcements.form.priorityOptions.normal'), value: 'normal' },
          ]}
        />
        <Form.Switch
          field="isBanner"
          label={t('operations.platformOperations.announcements.form.isBanner')}
          onChange={(v) => setIsBanner(!!v)}
        />

        {isBanner && (
          <>
            <Form.Slot label={t('operations.platformOperations.announcements.form.bannerImage')}>
              {bannerImageUrl || bannerImageKey ? (
                <div className="banner-image-preview">
                  {bannerImageUrl ? (
                    <img src={bannerImageUrl} alt="banner" />
                  ) : (
                    <div className="banner-image-key">
                      <ImageIcon size={16} strokeWidth={2} />
                      <span>{bannerImageKey}</span>
                    </div>
                  )}
                  <Button
                    icon={<X size={14} strokeWidth={2} />}
                    type="tertiary"
                    theme="borderless"
                    size="small"
                    onClick={() => {
                      setBannerImageUrl(undefined);
                      setBannerImageKey(undefined);
                      setFileList([]);
                    }}
                  />
                </div>
              ) : (
                <Upload
                  action=""
                  customRequest={() => ({ abort: () => {} })}
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  limit={1}
                  draggable
                  dragIcon={<Inbox size={32} strokeWidth={2} />}
                  dragMainText={t('operations.platformOperations.announcements.form.bannerImage')}
                  dragSubText={t('operations.platformOperations.announcements.form.bannerImageHint')}
                  fileList={fileList}
                  onChange={handleImageChange}
                  showUploadList={false}
                  className="banner-image-upload"
                />
              )}
              {imgError && <div className="form-error-tip">{imgError}</div>}
            </Form.Slot>
            <Form.Input
              field="bannerVersion"
              label={t('operations.platformOperations.announcements.form.bannerVersion')}
              maxLength={20}
              showClear
            />
          </>
        )}

        <Form.TextArea
          field="content"
          label={t('operations.platformOperations.announcements.form.content')}
          placeholder={t('operations.platformOperations.announcements.form.contentPlaceholder')}
          rows={6}
          maxLength={2000}
          maxCount={2000}
          trigger={['blur', 'change']}
          rules={[{ required: true, message: t('operations.platformOperations.announcements.validation.contentRequired') }]}
        />
      </Form>
    </Modal>
  );
};

export default AnnouncementFormModal;
