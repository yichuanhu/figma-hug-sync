import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Toast, Typography } from '@douyinfe/semi-ui';
import { Inbox, Download, FileText, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  mockImport,
  validateImportRows,
  type ImportSummary,
  type ParsedRow,
  type ValidationResult,
} from '../../assignedValueMock';
import ImportPreviewModal from '../ImportPreviewModal';
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
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [resultValidation, setResultValidation] = useState<ValidationResult | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setFile(null);
    setParsing(false);
    setImporting(false);
    setValidation(null);
  };

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

  const parseFile = async (f: File): Promise<ParsedRow[]> => {
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return [];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: '',
      raw: false,
    });
    // 跳过模板示例提示行（第一行如果是中文说明，header 名为 "用户名（站内登录名，必填）" 这种则跳过）
    const parsed: ParsedRow[] = [];
    rows.forEach((row, idx) => {
      const username = String(row['username'] ?? '').trim();
      const account = String(row['account'] ?? '').trim();
      const password = String(row['password'] ?? '').trim();
      const description = String(row['description'] ?? '').trim();
      // 跳过纯说明行（包含中文括号的占位文本）
      if (
        username.includes('（') ||
        account.includes('（') ||
        password.includes('（')
      ) {
        return;
      }
      // 整行全空则跳过
      if (!username && !account && !password && !description) return;
      parsed.push({
        row_number: idx + 2, // Excel 行号：表头是 1
        username,
        account,
        password,
        description: description || undefined,
      });
    });
    return parsed;
  };

  const handlePreview = async () => {
    if (!file) return;
    setParsing(true);
    try {
      const rawRows = await parseFile(file);
      if (rawRows.length === 0) {
        Toast.warning(t('credential.import.errors.empty'));
        setParsing(false);
        return;
      }
      const v = validateImportRows(rawRows);
      setValidation(v);
    } catch {
      Toast.error(t('credential.import.errors.parse'));
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!validation || !file) return;
    setImporting(true);
    await new Promise((r) => setTimeout(r, 600));
    const summary = mockImport(credentialId, file.name, validation.valid_rows);
    setImporting(false);
    setResultValidation(validation);
    setResultFileName(file.name);
    setValidation(null);
    setResult(summary);
  };

  return (
    <>
      <Modal
        title={t('credential.import.title')}
        visible={visible && !validation && !result}
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
              loading={parsing}
              onClick={handlePreview}
            >
              {t('credential.import.nextButton')}
            </Button>
          </div>
        </div>
      </Modal>

      <ImportPreviewModal
        visible={!!validation}
        fileName={file?.name || ''}
        validation={validation}
        loading={importing}
        onCancel={() => setValidation(null)}
        onConfirm={handleConfirmImport}
      />

      <ImportResultModal
        visible={!!result}
        result={result}
        validation={resultValidation}
        fileName={resultFileName}
        onClose={() => { setResult(null); setResultValidation(null); reset(); onComplete(); }}
      />
    </>
  );
};

export default ImportAssignedValueModal;
