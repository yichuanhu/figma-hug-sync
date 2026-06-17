import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Toast, Typography, Form } from '@douyinfe/semi-ui';
import { Inbox, Download, FileText, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import DepartmentSearchSelect from '@/components/DepartmentSearchSelect';
import OwnerSearchSelect from '@/components/OwnerSearchSelect';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import {
  mockImportParameters,
  validateParameterImportRows,
  type ParamImportSummary,
  type ParsedParameterRow,
  type ParamValidationResult,
} from '../../parameterImportMock';
import ImportParameterPreviewModal from '../ImportParameterPreviewModal';
import ImportParameterResultModal from '../ImportParameterResultModal';
import './index.less';

const { Text } = Typography;

interface ImportParameterModalProps {
  visible: boolean;
  existingNames?: string[];
  onCancel: () => void;
  onComplete: () => void;
}

const MAX_SIZE = 5 * 1024 * 1024;

const ImportParameterModal = ({
  visible,
  existingNames = [],
  onCancel,
  onComplete,
}: ImportParameterModalProps) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validation, setValidation] = useState<ParamValidationResult | null>(null);
  const [result, setResult] = useState<ParamImportSummary | null>(null);
  const [resultValidation, setResultValidation] = useState<ParamValidationResult | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');
  const [rawRows, setRawRows] = useState<ParsedParameterRow[]>([]);
  const [resultRawRows, setResultRawRows] = useState<ParsedParameterRow[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // 新建参数默认归属设置（仅作用于本次导入中新建的参数）
  const [defaultDepartmentId, setDefaultDepartmentId] = useState<string>(MOCK_CURRENT_USER.department_id);
  const [defaultOwnerId, setDefaultOwnerId] = useState<string>(MOCK_CURRENT_USER.id);

  const existingNameSet = new Set(existingNames.map((n) => n.trim().toLowerCase()));

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
      ['parameter_name', 'parameter_type', 'parameter_value', 'parameter_description'],
      ['HeartbeatInterval', 'NUMBER', '30', '心跳检测间隔（秒）'],
      ['EnableDebug', 'BOOLEAN', 'True', '是否开启调试模式'],
      ['DefaultLanguage', 'TEXT', 'zh-CN', '默认语言'],
    ]);
    ws['!cols'] = [{ wch: 24 }, { wch: 18 }, { wch: 24 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Parameters');
    XLSX.writeFile(wb, 'parameter_import_template.xlsx');
  };

  const validateFile = (f: File): boolean => {
    if (!f.name.toLowerCase().endsWith('.xlsx')) {
      Toast.error(t('parameter.import.errors.format'));
      return false;
    }
    if (f.size > MAX_SIZE) {
      Toast.error(t('parameter.import.errors.size'));
      return false;
    }
    return true;
  };

  const handleFile = (f: File) => { if (validateFile(f)) setFile(f); };

  const parseFile = async (f: File): Promise<ParsedParameterRow[]> => {
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return [];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: '',
      raw: false,
    });
    const parsed: ParsedParameterRow[] = [];
    rows.forEach((row, idx) => {
      const parameter_name = String(row['parameter_name'] ?? '').trim();
      const parameter_type_raw = String(row['parameter_type'] ?? '').trim();
      const parameter_value = String(row['parameter_value'] ?? '').trim();
      const parameter_description = String(row['parameter_description'] ?? '').trim();
      if (!parameter_name && !parameter_type_raw && !parameter_value && !parameter_description) return;
      parsed.push({
        row_number: idx + 2,
        parameter_name,
        parameter_type_raw,
        parameter_value,
        parameter_description: parameter_description || undefined,
      });
    });
    return parsed;
  };

  const handlePreview = async () => {
    if (!file) return;
    if (!defaultDepartmentId) {
      Toast.warning(t('parameter.import.errors.deptRequired'));
      return;
    }
    if (!defaultOwnerId) {
      Toast.warning(t('parameter.import.errors.ownerRequired'));
      return;
    }
    setParsing(true);
    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) {
        Toast.warning(t('parameter.import.errors.empty'));
        setParsing(false);
        return;
      }
      setRawRows(parsed);
      const v = validateParameterImportRows(parsed, existingNameSet);
      setValidation(v);
    } catch {
      Toast.error(t('parameter.import.errors.parse'));
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!validation || !file) return;
    setImporting(true);
    await new Promise((r) => setTimeout(r, 600));
    const summary = mockImportParameters(validation.valid_rows, existingNameSet);
    setImporting(false);
    setResultValidation(validation);
    setResultFileName(file.name);
    setResultRawRows(rawRows);
    setValidation(null);
    setResult(summary);
  };

  return (
    <>
      <Modal
        title={t('parameter.import.title')}
        visible={visible && !validation && !result}
        onCancel={handleClose}
        footer={null}
        closeOnEsc
        maskClosable={false}
        width={560}
      >
        <div className="import-parameter-modal-body">
          <div className="import-parameter-modal-section">
            <Text strong>{t('parameter.import.downloadSection')}</Text>
            <Button
              icon={<Download size={14} strokeWidth={2} />}
              onClick={handleDownloadTemplate}
              style={{ marginTop: 8, alignSelf: 'flex-start' }}
            >
              {t('parameter.import.downloadTemplate')}
            </Button>
          </div>

          <div className="import-parameter-modal-tips">
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              {t('parameter.import.tipsTitle')}
            </Text>
            <ol>
              <li>{t('parameter.import.tip1')}</li>
              <li>{t('parameter.import.tip2')}</li>
              <li>{t('parameter.import.tip3')}</li>
              <li>{t('parameter.import.tip4')}</li>
              <li>{t('parameter.import.tip5')}</li>
            </ol>
          </div>

          <div className="import-parameter-modal-section">
            <Text strong style={{ marginBottom: 8 }}>
              {t('parameter.import.defaultsTitle')}
            </Text>
            <Text type="tertiary" size="small" style={{ marginBottom: 10 }}>
              {t('parameter.import.defaultsHint')}
            </Text>
            <Form labelPosition="left" labelWidth={96} className="import-parameter-modal-defaults">
              <Form.Slot label={t('common.owningDepartment')}>
                <DepartmentSearchSelect
                  value={defaultDepartmentId}
                  onChange={(v) => setDefaultDepartmentId(v as string)}
                  style={{ width: '100%' }}
                />
              </Form.Slot>
              <Form.Slot label={t('common.owner')}>
                <OwnerSearchSelect
                  value={defaultOwnerId}
                  onChange={(v) => setDefaultOwnerId(v as string)}
                  departmentId={defaultDepartmentId}
                  style={{ width: '100%' }}
                />
              </Form.Slot>
            </Form>
          </div>

          <div
            className={`import-parameter-modal-dropzone${dragOver ? ' is-drag-over' : ''}`}
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
            <div className="import-parameter-modal-dropzone-hint">
              {t('parameter.import.dropzoneHint')}
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
            <div className="import-parameter-modal-file">
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

          <div className="import-parameter-modal-footer">
            <Button theme="light" onClick={handleClose}>{t('common.cancel')}</Button>
            <Button
              theme="solid"
              type="primary"
              disabled={!file}
              loading={parsing}
              onClick={handlePreview}
            >
              {t('parameter.import.nextButton')}
            </Button>
          </div>
        </div>
      </Modal>

      <ImportParameterPreviewModal
        visible={!!validation}
        fileName={file?.name || ''}
        validation={validation}
        existingNames={existingNameSet}
        loading={importing}
        onCancel={() => setValidation(null)}
        onConfirm={handleConfirmImport}
      />

      <ImportParameterResultModal
        visible={!!result}
        result={result}
        validation={resultValidation}
        fileName={resultFileName}
        rawRows={resultRawRows}
        onClose={() => {
          setResult(null);
          setResultValidation(null);
          setResultRawRows([]);
          reset();
          onComplete();
        }}
      />
    </>
  );
};

export default ImportParameterModal;
