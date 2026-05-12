import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, TextArea, Toast, Typography } from '@douyinfe/semi-ui';
import { Inbox, FileText, X } from 'lucide-react';
import { uploadDevSchemeDoc } from '../../mockData';
import './index.less';

const { Text } = Typography;

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXT = ['pdf', 'docx', 'md'];

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

interface Props {
  visible: boolean;
  requirementId: string;
  ownerName?: string;
  creatorName?: string;
  nextVersion: number;
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
  nextVersion,
  onCancel,
  onSuccess,
}: Props) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
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
    setFile(null);
    setNote('');
    setClientError(null);
  };

  const handleFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXT.includes(ext)) {
      setClientError(t('requirements.devScheme.error.unsupportedType'));
      return;
    }
    if (f.size > MAX_SIZE) {
      setClientError(t('requirements.devScheme.error.fileTooLarge'));
      return;
    }
    setClientError(null);
    setFile(f);
  };

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
      <label
        className="semi-upload-drag-area"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
      >
        <input
          type="file"
          accept=".pdf,.docx,.md"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Inbox size={36} strokeWidth={1.5} color="var(--semi-color-primary)" />
        <Text style={{ marginTop: 8 }}>{t('requirements.devScheme.upload.dragHint')}</Text>
        <div className="upload-hint">{t('requirements.devScheme.upload.formatHint')}</div>
      </label>

      {file && (
        <div className="selected-file">
          <FileText size={16} strokeWidth={2} />
          <span>{file.name}</span>
          <span className="file-meta">({formatSize(file.size)})</span>
          <X className="file-remove" size={14} onClick={() => setFile(null)} />
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

      <div className="next-version-hint">
        {t('requirements.devScheme.upload.nextVersion', { version: nextVersion })}
      </div>

      {recipients && (
        <div className="notify-recipients">
          {t('requirements.devScheme.upload.notifyRecipients', { names: recipients })}
        </div>
      )}
    </Modal>
  );
};

export default DevSchemeDocUploadModal;
