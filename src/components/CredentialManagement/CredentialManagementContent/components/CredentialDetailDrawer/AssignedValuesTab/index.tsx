import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Table, Modal, Toast, Typography, Pagination, Dropdown } from '@douyinfe/semi-ui';
import { Plus, Upload, Pencil, Trash2, Ellipsis } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import {
  listAssignedValues,
  deleteAssignedValue,
  type AssignedValue,
} from '../../../assignedValueMock';
import AssignedValueFormModal from '../AssignedValueFormModal';
import ImportAssignedValueModal from '../../ImportAssignedValueModal';
import './index.less';

const { Text } = Typography;

interface AssignedValuesTabProps {
  credentialId: string;
}



const AssignedValuesTab = ({ credentialId }: AssignedValuesTabProps) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<AssignedValue | null>(null);
  const [importVisible, setImportVisible] = useState(false);

  const all = useMemo(() => listAssignedValues(credentialId), [credentialId, refreshKey]);
  const total = all.length;
  const data = all.slice((page - 1) * pageSize, page * pageSize);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleDelete = (record: AssignedValue) => {
    Modal.confirm({
      title: t('credential.assignedValue.deleteConfirmTitle'),
      content: t('credential.assignedValue.deleteConfirmContent', { name: record.user_name }),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      icon: <Trash2 size={20} strokeWidth={2} color="var(--semi-color-danger)" />,
      okButtonProps: { type: 'danger', theme: 'solid' },
      onOk: () => {
        deleteAssignedValue(credentialId, record.id);
        Toast.success(t('credential.assignedValue.deleteSuccess'));
        refresh();
      },
    });
  };

  const columns = [
    {
      title: t('credential.assignedValue.columns.user'),
      dataIndex: 'user_name',
      key: 'user_name',
      width: 140,
      render: (text: string, record: AssignedValue) => (
        <UserNameWithCard name={text} userId={record.user_id} />
      ),
    },
    {
      title: t('credential.assignedValue.columns.account'),
      dataIndex: 'account',
      key: 'account',
      ellipsis: { showTitle: true },
    },
    {
      title: t('credential.assignedValue.columns.password'),
      dataIndex: 'password_display',
      key: 'password_display',
      width: 100,
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: { showTitle: true },
      render: (text?: string) => text || '-',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 80,
      render: (_: unknown, record: AssignedValue) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                icon={<Pencil size={14} strokeWidth={2} />}
                onClick={() => { setEditing(record); setFormVisible(true); }}
              >
                {t('common.edit')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<Trash2 size={14} strokeWidth={2} />}
                type="danger"
                onClick={() => handleDelete(record)}
              >
                {t('common.delete')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button
            icon={<Ellipsis size={16} strokeWidth={2} />}
            theme="borderless"
            type="tertiary"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="assigned-values-tab">
      <div className="assigned-values-tab-header">
        <Text type="tertiary">
          {t('credential.assignedValue.totalCount', { count: total })}
        </Text>
        <div className="assigned-values-tab-header-actions">
          <Button
            icon={<Upload size={14} strokeWidth={2} />}
            onClick={() => setImportVisible(true)}
          >
            {t('credential.actions.import')}
          </Button>
          <Button
            icon={<Plus size={14} strokeWidth={2} />}
            theme="solid"
            type="primary"
            onClick={() => { setEditing(null); setFormVisible(true); }}
          >
            {t('credential.assignedValue.create')}
          </Button>
        </div>
      </div>

      <Table
        size="small"
        columns={columns}
        dataSource={data}
        rowKey="id"
        empty={
          <EmptyState
            variant="noData"
            description={t('credential.assignedValue.empty')}
          />
        }
        pagination={false}
      />
      {total > 0 && (
        <div className="list-pagination">
          <Text type="tertiary">
            {t('common.showingRecords', {
              start: (page - 1) * pageSize + 1,
              end: Math.min(page * pageSize, total),
              total,
            })}
          </Text>
          <div className="list-pagination-right">
            <Text type="tertiary">{t('common.totalPages', { total: Math.ceil(total / pageSize) })}</Text>
            <Pagination
              currentPage={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              onPageChange={setPage}
              onPageSizeChange={(size: number) => { setPage(1); setPageSize(size); }}
            />
          </div>
        </div>
      )}

      <AssignedValueFormModal
        visible={formVisible}
        credentialId={credentialId}
        editing={editing}
        onCancel={() => setFormVisible(false)}
        onSuccess={() => { setFormVisible(false); refresh(); }}
      />

      <ImportAssignedValueModal
        visible={importVisible}
        credentialId={credentialId}
        onCancel={() => setImportVisible(false)}
        onComplete={() => { setImportVisible(false); refresh(); }}
      />
    </div>
  );
};

export default AssignedValuesTab;
