import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Upload,
  Typography,
  Banner,
  Table,
  Tag,
  Toast,
  Button,
} from '@douyinfe/semi-ui';
import { Inbox, X } from 'lucide-react';

import './index.less';

const { Text } = Typography;

interface RequirementBatchImportModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface ImportPreviewRow {
  key: number;
  title: string;
  department: string;
  priority: string;
  contact: string;
  valid: boolean;
  error?: string;
}

const mockParseFile = (): ImportPreviewRow[] => {
  return [
    { key: 1, title: 'Quarterly Budget Consolidation', department: 'Finance', priority: 'HIGH', contact: 'John Smith', valid: true },
    { key: 2, title: 'Vendor Onboarding Automation', department: 'Procurement', priority: 'MEDIUM', contact: 'Sarah Chen', valid: true },
    { key: 3, title: 'Customer Churn Analysis Pipeline', department: 'Marketing', priority: 'HIGH', contact: 'Emily Zhang', valid: true },
    { key: 4, title: '', department: 'IT', priority: 'LOW', contact: 'David Lee', valid: false, error: 'Title is required' },
    { key: 5, title: 'Payroll Processing Optimization', department: 'HR', priority: 'MEDIUM', contact: 'Lisa Wang', valid: true },
    { key: 6, title: 'Inventory Cycle Count Automation', department: 'Operations', priority: 'HIGH', contact: '', valid: false, error: 'Contact is required' },
    { key: 7, title: 'Contract Expiry Notification Bot', department: 'Legal', priority: 'LOW', contact: 'Tom Harris', valid: true },
  ];
};

const RequirementBatchImportModal: React.FC<RequirementBatchImportModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewRow[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (info: any) => {
    const uploaded = info.fileList?.[0]?.fileInstance;
    if (uploaded) {
      setFile(uploaded);
      setPreviewData(mockParseFile());
    }
    return false;
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewData([]);
  };

  const handleImport = async () => {
    setImporting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setImporting(false);
    const validCount = previewData.filter(r => r.valid).length;
    Toast.success(t('requirement.batchImport.importSuccess', { count: validCount }));
    handleClose();
    onSuccess();
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setImporting(false);
    onCancel();
  };

  const validCount = previewData.filter(r => r.valid).length;
  const invalidCount = previewData.filter(r => !r.valid).length;

  const columns = [
    { title: '#', dataIndex: 'key', width: 50 },
    {
      title: t('requirement.list.columns.title'),
      dataIndex: 'title',
      ellipsis: true,
      render: (text: string, record: ImportPreviewRow) => (
        <Text type={!record.valid ? 'danger' : undefined}>{text || '-'}</Text>
      ),
    },
    { title: t('requirement.list.columns.department'), dataIndex: 'department', width: 100 },
    {
      title: t('requirement.list.columns.priority'),
      dataIndex: 'priority',
      width: 80,
      render: (p: string) => {
        const colors: Record<string, 'red' | 'orange' | 'grey'> = { HIGH: 'red', MEDIUM: 'orange', LOW: 'grey' };
        return <Tag color={colors[p] || 'grey'}>{t(`requirement.priority.${p}`)}</Tag>;
      },
    },
    {
      title: t('requirement.form.fields.contactName'),
      dataIndex: 'contact',
      width: 120,
      render: (text: string) => text || <Text type="danger">-</Text>,
    },
    {
      title: t('common.status'),
      width: 100,
      render: (_: unknown, record: ImportPreviewRow) => (
        record.valid
          ? <Tag color="green">{t('requirement.batchImport.valid')}</Tag>
          : <Tag color="red">{t('requirement.batchImport.invalid')}</Tag>
      ),
    },
  ];

  return (
    <Modal
      title={t('requirement.batchImport.title')}
      visible={visible}
      onCancel={handleClose}
      width={900}
      footer={
        <div className="batch-import-modal-footer">
          <Button theme="light" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button
            theme="solid"
            type="primary"
            onClick={handleImport}
            loading={importing}
            disabled={!file || validCount === 0}
          >
            {t('requirement.batchImport.importBtn', { count: validCount })}
          </Button>
        </div>
      }
      closeOnEsc
      className="batch-import-modal"
    >
      <div className="batch-import-modal-content">
        {/* Upload Area */}
        {!file ? (
          <Upload
            draggable
            accept=".xlsx,.xls,.csv"
            limit={1}
            dragMainText={t('requirement.batchImport.dragText')}
            dragSubText={t('requirement.batchImport.dragSubText')}
            dragIcon={<Inbox size={36} strokeWidth={2} />}
            onChange={handleFileChange}
            showUploadList={false}
            className="batch-import-modal-upload"
          />
        ) : (
          <>
            {/* File info */}
            <div className="batch-import-modal-file-info">
              <div className="batch-import-modal-file-detail">
                <Inbox size={18} strokeWidth={2} />
                <Text>{file.name}</Text>
                <Text type="tertiary" size="small">
                  ({(file.size / 1024).toFixed(1)} KB)
                </Text>
              </div>
              <Button
                icon={<X size={14} />}
                theme="borderless"
                type="tertiary"
                size="small"
                onClick={handleRemoveFile}
              />
            </div>

            {/* Validation Summary */}
            {previewData.length > 0 && (
              <div className="batch-import-modal-summary">
                <Text size="small">
                  {t('requirement.batchImport.summary', {
                    total: previewData.length,
                    valid: validCount,
                    invalid: invalidCount,
                  })}
                </Text>
                {invalidCount > 0 && (
                  <Banner
                    type="warning"
                    description={t('requirement.batchImport.invalidWarning', { count: invalidCount })}
                    closeIcon={null}
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>
            )}

            {/* Preview Table */}
            {previewData.length > 0 && (
              <Table
                columns={columns}
                dataSource={previewData}
                pagination={false}
                size="small"
                rowKey="key"
                scroll={{ y: 300 }}
                className="batch-import-modal-table"
              />
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default RequirementBatchImportModal;
