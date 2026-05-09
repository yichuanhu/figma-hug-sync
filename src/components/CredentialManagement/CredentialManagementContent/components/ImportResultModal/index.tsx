import { useTranslation } from 'react-i18next';
import { Modal, Button, Table, Tag, Typography } from '@douyinfe/semi-ui';
import type { ImportSummary, ImportRowResult } from '../../assignedValueMock';
import './index.less';

const { Text } = Typography;

interface ImportResultModalProps {
  visible: boolean;
  result: ImportSummary | null;
  onClose: () => void;
}

const ImportResultModal = ({ visible, result, onClose }: ImportResultModalProps) => {
  const { t } = useTranslation();

  if (!result) return null;

  const summary = [
    { key: 'total', label: t('credential.import.summary.total'), value: result.total, color: 'var(--semi-color-text-0)' },
    { key: 'success', label: t('credential.import.summary.success'), value: result.success, color: 'var(--semi-color-success)' },
    { key: 'created', label: t('credential.import.summary.created'), value: result.created, color: 'var(--semi-color-primary)' },
    { key: 'updated', label: t('credential.import.summary.updated'), value: result.updated, color: 'var(--semi-color-warning)' },
    { key: 'skipped', label: t('credential.import.summary.skipped'), value: result.skipped, color: 'var(--semi-color-text-2)' },
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
