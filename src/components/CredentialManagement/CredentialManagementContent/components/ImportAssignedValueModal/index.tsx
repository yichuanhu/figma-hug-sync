import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Toast, Typography } from '@douyinfe/semi-ui';
import { Inbox, Download, FileText, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { mockImport, type ImportSummary } from '../../assignedValueMock';
import ImportResultModal from '../ImportResultModal';
import './index.less';

const { Text } = Typography;

interface ImportAssignedValueModalProps {
  visible: boolean;
  credentialId: string;
  onCancel: () => void;
  onComplete: () => void;
}

const MAX_SIZE = 5 * 1024 * 1024;

const ImportAssignedValueModal = ({
  visible,
  credentialId,
  onCancel,
  onComplete,
}: ImportAssignedValueModalProps) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => { setFile(null); setLoading(false); };

  const handleClose = () => { reset(); onCancel(); };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['username', 'account', 'password', 'description'],
      ['用户名（站内登录名，必填）', '账号（必填）', '密码（明文，必填）', '描述（选填）'],
      ['zhangsan', 'erp_zhangsan', 'P@ssw0rd', '张三的ERP账号'],
    ]);
    ws['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'AssignedValues');
    XLSX.writeFile(wb, '分配值批量导入模板.xlsx');
  };

  const validateFile = (f: File): boolean => {
    if (!f.name.toLowerCase().endsWith('.xlsx')) {
      Toast.error(t('credential.import.errors.format'));
      return false;
    }
    if (f.size > MAX_SIZE) {
      Toast.error(t('credential.import.errors.size'));
      return false;
    }
    return true;
  };

  const handleFile = (f: File) => {
    if (validateFile(f)) setFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const summary = mockImport(credentialId, file.name);
    setLoading(false);
    setResult(summary);
  };

  return (
    <>
      <Modal
        title={t('credential.import.title')}
        visible={visible && !result}
        onCancel={handleClose}
        footer={null}
        closeOnEsc
        maskClosable={false}
        width={520}
      >
        <div className="import-assigned-value-modal-body">
          <div className="import-assigned-value-modal-section">
            <Text strong>{t('credential.import.downloadSection')}</Text>
            <Button
              icon={<Download size={14} strokeWidth={2} />}
              onClick={handleDownloadTemplate}
              style={{ marginTop: 8 }}
            >
              {t('credential.import.downloadTemplate')}
            </Button>
          </div>

          <div className="import-assigned-value-modal-tips">
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              {t('credential.import.tipsTitle')}
            </Text>
            <ol>
              <li>{t('credential.import.tip1')}</li>
              <li>{t('credential.import.tip2')}</li>
              <li>{t('credential.import.tip3')}</li>
              <li>{t('credential.import.tip4')}</li>
              <li>{t('credential.import.tip5')}</li>
            </ol>
          </div>

          <div
            className={`import-assigned-value-modal-dropzone${dragOver ? ' is-drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
          >
            <Inbox size={32} strokeWidth={1.5} />
            <div className="import-assigned-value-modal-dropzone-hint">
              {t('credential.import.dropzoneHint')}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
          </div>

          {file && (
            <div className="import-assigned-value-modal-file">
              <FileText size={14} strokeWidth={2} />
              <Text ellipsis={{ showTooltip: true }} style={{ flex: 1 }}>{file.name}</Text>
              <Button
                icon={<X size={14} strokeWidth={2} />}
                theme="borderless"
                type="tertiary"
                size="small"
                onClick={() => setFile(null)}
              />
            </div>
          )}

          <div className="import-assigned-value-modal-footer">
            <Button theme="light" onClick={handleClose}>{t('common.cancel')}</Button>
            <Button
              theme="solid"
              type="primary"
              disabled={!file}
              loading={loading}
              onClick={handleImport}
            >
              {t('credential.import.importButton')}
            </Button>
          </div>
        </div>
      </Modal>

      <ImportResultModal
        visible={!!result}
        result={result}
        onClose={() => { setResult(null); reset(); onComplete(); }}
      />
    </>
  );
};

export default ImportAssignedValueModal;
