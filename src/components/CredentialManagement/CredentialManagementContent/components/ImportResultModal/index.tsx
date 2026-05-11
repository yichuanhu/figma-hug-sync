import { useTranslation } from 'react-i18next';
import { Modal, Button, Table, Tag, Typography } from '@douyinfe/semi-ui';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { ImportSummary, ImportRowResult, ValidationResult, ImportRowError, ParsedRow } from '../../assignedValueMock';
import './index.less';

const { Text } = Typography;

interface ImportResultModalProps {
  visible: boolean;
  result: ImportSummary | null;
  validation?: ValidationResult | null;
  fileName?: string;
  rawRows?: ParsedRow[];
  onClose: () => void;
}

const ImportResultModal = ({ visible, result, validation, fileName, rawRows, onClose }: ImportResultModalProps) => {
  const { t } = useTranslation();

  if (!result) return null;

  const frontendErrors: ImportRowError[] = validation?.errors ?? [];
  const serverFailed = result.details.filter((r) => r.status === 'FAILED');
  const totalFailed = frontendErrors.length + serverFailed.length;

  const summary = [
    { key: 'total', label: t('credential.import.summary.total'), value: result.total, color: 'var(--semi-color-text-0)' },
    { key: 'success', label: t('credential.import.summary.success'), value: result.success, color: 'var(--semi-color-success)' },
    { key: 'created', label: t('credential.import.summary.created'), value: result.created, color: 'var(--semi-color-primary)' },
    { key: 'updated', label: t('credential.import.summary.updated'), value: result.updated, color: 'var(--semi-color-warning)' },
    { key: 'failed', label: t('credential.import.summary.failed'), value: result.failed, color: 'var(--semi-color-danger)' },
  ];

  const statusTag = (row: ImportRowResult) => {
    if (row.status === 'SUCCESS') {
      return <Tag color="green" type="light">{t('credential.import.status.success')}</Tag>;
    }
    if (row.status === 'FAILED') {
      return <Tag color="red" type="light">{t('credential.import.status.failed')}</Tag>;
    }
    return <Tag color="grey" type="light">{t('credential.import.status.skipped')}</Tag>;
  };

  const subStatusText = (row: ImportRowResult) => {
    if (row.sub_status === 'CREATED') return t('credential.import.subStatus.created');
    if (row.sub_status === 'UPDATED') return t('credential.import.subStatus.updated');
    return '-';
  };

  const columns = [
    { title: t('credential.import.cols.row'), dataIndex: 'row_number', key: 'row_number', width: 60 },
    { title: t('credential.import.cols.username'), dataIndex: 'username', key: 'username', width: 140, render: (v: string) => v || '-' },
    { title: t('credential.import.cols.status'), key: 'status', width: 80, render: (_: unknown, row: ImportRowResult) => statusTag(row) },
    { title: t('credential.import.cols.subStatus'), key: 'subStatus', width: 80, render: (_: unknown, row: ImportRowResult) => subStatusText(row) },
    { title: t('credential.import.cols.reason'), dataIndex: 'reason', key: 'reason', ellipsis: { showTitle: true }, render: (v?: string) => v || '-' },
  ];

  const errorTypeLabel = (type: ImportRowError['type']): string => {
    if (type === 'EMPTY_FIELD') return t('credential.import.preview.errorType.emptyField');
    if (type === 'DUPLICATE_USERNAME') return t('credential.import.preview.errorType.duplicate');
    return t('credential.import.preview.errorType.exceedLimit');
  };

  const handleDownloadFailed = () => {
    const rowMap = new Map<number, ParsedRow>();
    (rawRows ?? []).forEach((r) => rowMap.set(r.row_number, r));

    // 与导入模板列保持一致，仅追加 errorType / reason 两列
    const rows: (string | number)[][] = [
      ['username', 'account', 'password', 'description',
        t('credential.import.failedExport.cols.errorType'),
        t('credential.import.cols.reason')],
    ];

    frontendErrors.forEach((e) => {
      const src = e.row_number != null ? rowMap.get(e.row_number) : undefined;
      rows.push([
        src?.username ?? e.username ?? '',
        src?.account ?? '',
        src?.password ?? '',
        src?.description ?? '',
        errorTypeLabel(e.type),
        e.reason,
      ]);
    });
    serverFailed.forEach((r) => {
      const src = rowMap.get(r.row_number);
      rows.push([
        src?.username ?? r.username ?? '',
        src?.account ?? '',
        src?.password ?? '',
        src?.description ?? '',
        t('credential.import.failedExport.serverFailed'),
        r.reason || '',
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 30 }, { wch: 16 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws, 'FailedRows');
    const base = (fileName || 'import').replace(/\.xlsx$/i, '');
    XLSX.writeFile(wb, `${base}_失败数据.xlsx`);
  };

  return (
    <Modal
      title={t('credential.import.resultTitle')}
      visible={visible}
      onCancel={onClose}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={680}
    >
      <div className="import-result-modal-body">
        <div className="import-result-modal-summary">
          {summary.map((s) => (
            <div key={s.key} className="import-result-modal-summary-cell">
              <div className="import-result-modal-summary-value" style={{ color: s.color }}>
                {s.value}
              </div>
              <Text type="tertiary" size="small">{s.label}</Text>
            </div>
          ))}
        </div>

        {totalFailed > 0 && (
          <div className="import-result-modal-failed-bar">
            <Text type="tertiary">
              {t('credential.import.failedExport.summary', {
                frontend: frontendErrors.length,
                server: serverFailed.length,
              })}
            </Text>
            <Button
              icon={<Download size={14} strokeWidth={2} />}
              onClick={handleDownloadFailed}
              size="small"
            >
              {t('credential.import.failedExport.download')}
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

        <div className="import-result-modal-footer">
          <Button theme="solid" type="primary" onClick={onClose}>{t('common.confirm')}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportResultModal;
