import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, TextArea, Toast, Typography, Upload, Button } from '@douyinfe/semi-ui';
import { Inbox, File as FileIcon, X } from 'lucide-react';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import { uploadDevSchemeDoc } from '../../mockData';
import './index.less';

const { Text } = Typography;

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXT = ['pdf', 'docx', 'md'];

interface Props {
  visible: boolean;
  requirementId: string;
  ownerName?: string;
  creatorName?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const errorMsgKey: Record<string, string> = {
  DEV_SCHEME_DOC_INVALID_STATE: 'requirements.devScheme.error.invalidState',
  DEV_SCHEME_DOC_UNSUPPORTED_TYPE: 'requirements.devScheme.error.unsupportedType',
  DEV_SCHEME_DOC_FILE_TOO_LARGE: 'requirements.devScheme.error.fileTooLarge',
  DEV_SCHEME_DOC_NOT_WORKSPACE_MEMBER: 'requirements.devScheme.error.notMember',
};

const DevSchemeDocUploadModal = ({
  visible,
  requirementId,
  ownerName,
  creatorName,
  onCancel,
  onSuccess,
}: Props) => {
  const { t } = useTranslation();
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const recipients = useMemo(() => {
    const set = new Set<string>();
    if (ownerName) set.add(ownerName);
    if (creatorName) set.add(creatorName);
    return Array.from(set).join('、');
  }, [ownerName, creatorName]);

  const reset = () => {
    setFileList([]);
    setNote('');
    setClientError(null);
  };

  const handleFileChange = useCallback(
    (info: { fileList: FileItem[] }) => {
      const files = info.fileList;
      const last = files[files.length - 1];
      if (last?.fileInstance) {
        const f = last.fileInstance;
        const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
        if (!ALLOWED_EXT.includes(ext)) {
          setClientError(t('requirements.devScheme.error.unsupportedType'));
          setFileList([]);
          return;
        }
        if (f.size > MAX_SIZE) {
          setClientError(t('requirements.devScheme.error.fileTooLarge'));
          setFileList([]);
          return;
        }
      }
      setClientError(null);
      setFileList(files.slice(-1));
    },
    [t],
  );

  const customRequest = useCallback(() => ({ abort: () => {} }), []);

  const file = fileList[0]?.fileInstance ?? null;

  const handleConfirm = async () => {
    if (!file) {
      setClientError(t('requirements.devScheme.error.fileRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await uploadDevSchemeDoc({ requirementId, file, note });
      Toast.success(t('requirements.devScheme.upload.success'));
      reset();
      onSuccess();
    } catch (e) {
      const code = (e as Error).message;
      const key = errorMsgKey[code] ?? 'requirements.devScheme.error.generic';
      Toast.error(t(key));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={t('requirements.devScheme.upload.title')}
      visible={visible}
      onCancel={() => { reset(); onCancel(); }}
      onOk={handleConfirm}
      confirmLoading={submitting}
      okText={t('requirements.devScheme.upload.confirm')}
      cancelText={t('common.cancel')}
      width={520}
      className="dev-scheme-upload-modal"
      maskClosable={false}
    >
      <div className="dev-scheme-upload-content">
        <Upload
          action=""
          customRequest={customRequest}
          accept=".pdf,.docx,.md"
          limit={1}
          draggable
          dragIcon={<Inbox size={36} strokeWidth={2} />}
          dragMainText={t('requirements.devScheme.upload.dragHint')}
          dragSubText={t('requirements.devScheme.upload.formatHint')}
          fileList={fileList}
          onChange={handleFileChange}
          onRemove={() => { setFileList([]); return true; }}
          className="dev-scheme-upload-uploader"
        />

        {file && (
          <div className="dev-scheme-upload-file-info">
            <div className="file-info-left">
              <FileIcon size={16} strokeWidth={2} />
              <span className="file-name">{file.name}</span>
            </div>
            <Button
              icon={<X size={14} strokeWidth={2} />}
              type="tertiary"
              theme="borderless"
              size="small"
              onClick={() => setFileList([])}
            />
          </div>
        )}

        {clientError && (
          <div style={{ color: 'var(--semi-color-danger)', fontSize: 12, marginTop: 8 }}>
            {clientError}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 6 }}>
            {t('requirements.devScheme.upload.noteLabel')}
          </Text>
          <TextArea
            value={note}
            onChange={setNote}
            maxCount={500}
            maxLength={500}
            rows={3}
            placeholder={t('requirements.devScheme.upload.notePlaceholder')}
          />
        </div>

        <div className="overwrite-hint">
          {t('requirements.devScheme.upload.overwriteHint')}
        </div>

        {recipients && (
          <div className="notify-recipients">
            {t('requirements.devScheme.upload.notifyRecipients', { names: recipients })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DevSchemeDocUploadModal;
