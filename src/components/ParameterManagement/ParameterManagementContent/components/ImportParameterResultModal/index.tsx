import { useTranslation } from 'react-i18next';
import { Modal, Button, Table, Tag, Typography } from '@douyinfe/semi-ui';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import type {
  ParamImportSummary,
  ParamImportRowResult,
  ParamValidationResult,
  ParamImportRowError,
  ParsedParameterRow,
  ParamImportErrorType,
} from '../../parameterImportMock';
import './index.less';

const { Text } = Typography;

interface Props {
  visible: boolean;
  result: ParamImportSummary | null;
  validation?: ParamValidationResult | null;
  fileName?: string;
  rawRows?: ParsedParameterRow[];
  onClose: () => void;
}

const errorTypeLabel = (t: (k: string) => string, type: ParamImportErrorType): string => {
  const map: Record<ParamImportErrorType, string> = {
    EMPTY_FIELD: 'emptyField',
    NAME_TOO_LONG: 'nameTooLong',
    DUPLICATE_NAME: 'duplicateName',
    INVALID_TYPE: 'invalidType',
    INVALID_VALUE: 'invalidValue',
    DESC_TOO_LONG: 'descTooLong',
    EXCEED_LIMIT: 'exceedLimit',
  };
  return t(`parameter.import.preview.errorType.${map[type]}`);
};

const ImportParameterResultModal = ({ visible, result, validation, fileName, rawRows, onClose }: Props) => {
  const { t } = useTranslation();
  if (!result) return null;

  const frontendErrors: ParamImportRowError[] = (validation?.errors ?? []).filter((e) => e.row_number !== null);
  const serverFailed = result.details.filter((r) => r.status === 'FAILED');
  const totalFailed = frontendErrors.length + serverFailed.length;

  const summary = [
    { key: 'total', label: t('parameter.import.summary.total'), value: result.total, color: 'var(--semi-color-text-0)' },
    { key: 'success', label: t('parameter.import.summary.success'), value: result.success, color: 'var(--semi-color-success)' },
    { key: 'created', label: t('parameter.import.summary.created'), value: result.created, color: 'var(--semi-color-primary)' },
    { key: 'updated', label: t('parameter.import.summary.updated'), value: result.updated, color: 'var(--semi-color-warning)' },
    { key: 'failed', label: t('parameter.import.summary.failed'), value: result.failed, color: 'var(--semi-color-danger)' },
  ];

  const statusTag = (row: ParamImportRowResult) =>
    row.status === 'SUCCESS'
      ? <Tag color="green" type="light">{t('parameter.import.status.success')}</Tag>
      : <Tag color="red" type="light">{t('parameter.import.status.failed')}</Tag>;

  const subStatusText = (row: ParamImportRowResult) => {
    if (row.sub_status === 'CREATED') return t('parameter.import.subStatus.created');
    if (row.sub_status === 'UPDATED') return t('parameter.import.subStatus.updated');
    return '-';
  };

  const columns = [
    { title: t('parameter.import.cols.row'), dataIndex: 'row_number', key: 'row_number', width: 60 },
    { title: t('parameter.import.cols.name'), dataIndex: 'parameter_name', key: 'parameter_name', width: 180, render: (v: string) => v || '-' },
    { title: t('parameter.import.cols.status'), key: 'status', width: 80, render: (_: unknown, row: ParamImportRowResult) => statusTag(row) },
    { title: t('parameter.import.cols.subStatus'), key: 'subStatus', width: 80, render: (_: unknown, row: ParamImportRowResult) => subStatusText(row) },
    { title: t('parameter.import.cols.reason'), dataIndex: 'reason', key: 'reason', ellipsis: { showTitle: true }, render: (v?: string) => v || '-' },
  ];

  const handleDownloadFailed = () => {
    const rowMap = new Map<number, ParsedParameterRow>();
    (rawRows ?? []).forEach((r) => rowMap.set(r.row_number, r));

    const rows: (string | number)[][] = [
      ['parameter_name', 'parameter_type', 'dev_value', 'description',
        t('parameter.import.failedExport.cols.errorType'),
        t('parameter.import.cols.reason')],
    ];

    frontendErrors.forEach((e) => {
      const src = e.row_number != null ? rowMap.get(e.row_number) : undefined;
      rows.push([
        src?.parameter_name ?? e.parameter_name ?? '',
        src?.parameter_type_raw ?? '',
        src?.dev_value ?? '',
        src?.description ?? '',
        errorTypeLabel(t, e.type),
        e.reason,
      ]);
    });
    serverFailed.forEach((r) => {
      const src = rowMap.get(r.row_number);
      rows.push([
        src?.parameter_name ?? r.parameter_name ?? '',
        src?.parameter_type_raw ?? '',
        src?.dev_value ?? '',
        src?.description ?? '',
        t('parameter.import.failedExport.serverFailed'),
        r.reason || '',
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 24 }, { wch: 40 }, { wch: 16 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws, 'FailedRows');
    const base = (fileName || 'import').replace(/\.xlsx$/i, '');
    XLSX.writeFile(wb, `${base}_失败数据.xlsx`);
  };

  return (
    <Modal
      title={t('parameter.import.resultTitle')}
      visible={visible}
      onCancel={onClose}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={720}
    >
      <div className="import-parameter-result-modal-body">
        <div className="import-parameter-result-modal-summary">
          {summary.map((s) => (
            <div key={s.key} className="import-parameter-result-modal-summary-cell">
              <div className="import-parameter-result-modal-summary-value" style={{ color: s.color }}>
                {s.value}
              </div>
              <Text type="tertiary" size="small">{s.label}</Text>
            </div>
          ))}
        </div>

        {totalFailed > 0 && (
          <div className="import-parameter-result-modal-failed-bar">
            <Text type="tertiary">
              {t('parameter.import.failedExport.summary', {
                frontend: frontendErrors.length,
                server: serverFailed.length,
              })}
            </Text>
            <Button icon={<Download size={14} strokeWidth={2} />} onClick={handleDownloadFailed} size="small">
              {t('parameter.import.failedExport.download')}
            </Button>
          </div>
        )}

        <Table
          size="small"
          columns={columns}
          dataSource={result.details}
          rowKey="row_number"
          pagination={false}
          scroll={{ y: 320 }}
        />

        <div className="import-parameter-result-modal-footer">
          <Button theme="solid" type="primary" onClick={onClose}>{t('common.confirm')}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportParameterResultModal;
