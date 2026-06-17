import { useTranslation } from 'react-i18next';
import { Modal, Button, Table, Tag, Tabs, TabPane, Typography } from '@douyinfe/semi-ui';
import { AlertTriangle } from 'lucide-react';
import type {
  ParamValidationResult,
  ParamImportRowError,
  ParsedParameterRow,
  ParamImportErrorType,
} from '../../parameterImportMock';
import './index.less';

const { Text } = Typography;

interface Props {
  visible: boolean;
  fileName: string;
  validation: ParamValidationResult | null;
  existingNames?: Set<string>;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const typeLabel = (type?: number) => {
  if (type === 1) return '文本';
  if (type === 2) return '布尔';
  if (type === 3) return '数值';
  return '-';
};

const ImportParameterPreviewModal = ({
  visible,
  fileName,
  validation,
  existingNames,
  loading,
  onCancel,
  onConfirm,
}: Props) => {
  const { t } = useTranslation();
  if (!validation) return null;

  const validCount = validation.valid_rows.length;
  const errorCount = validation.errors.filter((e) => e.row_number !== null).length;
  const totalParsed = validation.total_parsed;

  const summary = [
    { key: 'total', label: t('parameter.import.preview.totalParsed'), value: totalParsed, color: 'var(--semi-color-text-0)' },
    { key: 'valid', label: t('parameter.import.preview.validCount'), value: validCount, color: 'var(--semi-color-success)' },
    { key: 'error', label: t('parameter.import.preview.errorCount'), value: errorCount, color: 'var(--semi-color-danger)' },
  ];

  const errorTypeTag = (type: ParamImportErrorType) => {
    const map: Record<ParamImportErrorType, { color: 'red' | 'orange' | 'amber'; key: string }> = {
      EMPTY_FIELD: { color: 'red', key: 'emptyField' },
      NAME_TOO_LONG: { color: 'red', key: 'nameTooLong' },
      INVALID_TYPE: { color: 'red', key: 'invalidType' },
      INVALID_VALUE: { color: 'red', key: 'invalidValue' },
      DESC_TOO_LONG: { color: 'orange', key: 'descTooLong' },
      DUPLICATE_NAME: { color: 'orange', key: 'duplicateName' },
      EXCEED_LIMIT: { color: 'amber', key: 'exceedLimit' },
    };
    const cfg = map[type];
    return <Tag color={cfg.color} type="light">{t(`parameter.import.preview.errorType.${cfg.key}`)}</Tag>;
  };

  const rowErrors = validation.errors.filter((e) => e.row_number !== null);

  const errorColumns = [
    { title: t('parameter.import.cols.row'), dataIndex: 'row_number', key: 'row_number', width: 70 },
    { title: t('parameter.import.cols.name'), dataIndex: 'parameter_name', key: 'parameter_name', width: 160, render: (v?: string) => v || '-' },
    { title: t('parameter.import.preview.errorTypeCol'), key: 'type', width: 110, render: (_: unknown, row: ParamImportRowError) => errorTypeTag(row.type) },
    { title: t('parameter.import.cols.reason'), dataIndex: 'reason', key: 'reason', ellipsis: { showTitle: true } },
  ];

  const validColumns = [
    { title: t('parameter.import.cols.row'), dataIndex: 'row_number', key: 'row_number', width: 70 },
    { title: t('parameter.import.cols.name'), dataIndex: 'parameter_name', key: 'parameter_name', width: 160, ellipsis: { showTitle: true } },
    { title: t('parameter.import.cols.type'), dataIndex: 'parameter_type', key: 'parameter_type', width: 90, render: (v: number) => <Tag color="blue" type="light">{typeLabel(v)}</Tag> },
    { title: t('parameter.import.cols.value'), dataIndex: 'parameter_value', key: 'parameter_value', width: 160, ellipsis: { showTitle: true } },
    { title: t('common.description'), dataIndex: 'parameter_description', key: 'parameter_description', ellipsis: { showTitle: true }, render: (v?: string) => v || '-' },
  ];

  return (
    <Modal
      title={t('parameter.import.preview.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={820}
    >
      <div className="import-parameter-preview-modal-body">
        <Text type="tertiary">{t('parameter.import.preview.fileLabel')}：{fileName}</Text>

        <div className="import-parameter-preview-modal-summary">
          {summary.map((s) => (
            <div key={s.key} className="import-parameter-preview-modal-summary-cell">
              <div className="import-parameter-preview-modal-summary-value" style={{ color: s.color }}>
                {s.value}
              </div>
              <Text type="tertiary" size="small">{s.label}</Text>
            </div>
          ))}
        </div>

        {validation.exceeded_limit && (
          <div className="import-parameter-preview-modal-error-banner">
            <AlertTriangle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{validation.errors.find((e) => e.type === 'EXCEED_LIMIT')?.reason}</span>
          </div>
        )}

        <Tabs type="line" defaultActiveKey={errorCount > 0 ? 'error' : 'valid'}>
          <TabPane tab={`${t('parameter.import.preview.tabs.valid')} (${validCount})`} itemKey="valid">
            <Table
              size="small"
              columns={validColumns}
              dataSource={validation.valid_rows}
              rowKey={(r: ParsedParameterRow) => `valid-${r.row_number}`}
              pagination={false}
              scroll={{ y: 280 }}
              empty={<Text type="tertiary">{t('parameter.import.preview.noValidRows')}</Text>}
            />
          </TabPane>
          <TabPane tab={`${t('parameter.import.preview.tabs.error')} (${errorCount})`} itemKey="error">
            <Table
              size="small"
              columns={errorColumns}
              dataSource={rowErrors}
              rowKey={(r: ParamImportRowError) => `${r.row_number}-${r.type}`}
              pagination={false}
              scroll={{ y: 280 }}
              empty={<Text type="success">{t('parameter.import.preview.allValid')}</Text>}
            />
          </TabPane>
        </Tabs>

        <div className="import-parameter-preview-modal-footer">
          <Button theme="light" onClick={onCancel}>{t('common.cancel')}</Button>
          <Button
            theme="solid"
            type="primary"
            disabled={validCount === 0}
            loading={loading}
            onClick={onConfirm}
          >
            {t('parameter.import.preview.confirm', { count: validCount })}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportParameterPreviewModal;
