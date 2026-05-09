import { useTranslation } from 'react-i18next';
import { Modal, Button, Table, Tag, Typography } from '@douyinfe/semi-ui';
import { AlertTriangle } from 'lucide-react';
import type { ValidationResult, ImportRowError } from '../../assignedValueMock';
import './index.less';

const { Text } = Typography;

interface ImportPreviewModalProps {
  visible: boolean;
  fileName: string;
  validation: ValidationResult | null;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ImportPreviewModal = ({
  visible,
  fileName,
  validation,
  loading,
  onCancel,
  onConfirm,
}: ImportPreviewModalProps) => {
  const { t } = useTranslation();
  if (!validation) return null;

  const validCount = validation.valid_rows.length;
  const errorCount = validation.errors.filter((e) => e.row_number !== null).length;
  const totalParsed = validation.total_parsed;

  const summary = [
    { key: 'total', label: t('credential.import.preview.totalParsed'), value: totalParsed, color: 'var(--semi-color-text-0)' },
    { key: 'valid', label: t('credential.import.preview.validCount'), value: validCount, color: 'var(--semi-color-success)' },
    { key: 'error', label: t('credential.import.preview.errorCount'), value: errorCount, color: 'var(--semi-color-danger)' },
  ];

  const typeTag = (row: ImportRowError) => {
    if (row.type === 'EMPTY_FIELD') {
      return <Tag color="red" type="light">{t('credential.import.preview.errorType.emptyField')}</Tag>;
    }
    if (row.type === 'DUPLICATE_USERNAME') {
      return <Tag color="orange" type="light">{t('credential.import.preview.errorType.duplicate')}</Tag>;
    }
    return <Tag color="amber" type="light">{t('credential.import.preview.errorType.exceedLimit')}</Tag>;
  };

  const rowErrors = validation.errors.filter((e) => e.row_number !== null);

  const errorColumns = [
    { title: t('credential.import.cols.row'), dataIndex: 'row_number', key: 'row_number', width: 70 },
    { title: t('credential.import.cols.username'), dataIndex: 'username', key: 'username', width: 160, render: (v?: string) => v || '-' },
    { title: t('credential.import.preview.errorTypeCol'), key: 'type', width: 100, render: (_: unknown, row: ImportRowError) => typeTag(row) },
    { title: t('credential.import.cols.reason'), dataIndex: 'reason', key: 'reason', ellipsis: { showTitle: true } },
  ];

  return (
    <Modal
      title={t('credential.import.preview.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={680}
    >
      <div className="import-preview-modal-body">
        <Text type="tertiary">{t('credential.import.preview.fileLabel')}：{fileName}</Text>

        <div className="import-preview-modal-summary">
          {summary.map((s) => (
            <div key={s.key} className="import-preview-modal-summary-cell">
              <div className="import-preview-modal-summary-value" style={{ color: s.color }}>
                {s.value}
              </div>
              <Text type="tertiary" size="small">{s.label}</Text>
            </div>
          ))}
        </div>

        {validation.exceeded_limit && (
          <div className="import-preview-modal-error-banner">
            <AlertTriangle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              {validation.errors.find((e) => e.type === 'EXCEED_LIMIT')?.reason}
            </span>
          </div>
        )}

        {rowErrors.length > 0 ? (
          <div className="import-preview-modal-error-section">
            <Text strong>{t('credential.import.preview.errorListTitle', { count: rowErrors.length })}</Text>
            <Table
              size="small"
              columns={errorColumns}
              dataSource={rowErrors}
              rowKey={(r: ImportRowError) => `${r.row_number}-${r.type}`}
              pagination={false}
              scroll={{ y: 280 }}
            />
          </div>
        ) : (
          <Text type="success">{t('credential.import.preview.allValid')}</Text>
        )}

        <div className="import-preview-modal-footer">
          <Button theme="light" onClick={onCancel}>{t('common.cancel')}</Button>
          <Button
            theme="solid"
            type="primary"
            disabled={validCount === 0}
            loading={loading}
            onClick={onConfirm}
          >
            {t('credential.import.preview.confirm', { count: validCount })}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportPreviewModal;
