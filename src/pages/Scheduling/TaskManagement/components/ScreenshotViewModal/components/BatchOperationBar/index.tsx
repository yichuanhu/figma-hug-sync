import { useTranslation } from 'react-i18next';
import { Button, Typography, Space, Modal, Toast } from '@douyinfe/semi-ui';
import { IconDeleteStroked } from '@douyinfe/semi-icons';
import './index.less';

const { Text } = Typography;

interface BatchOperationBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete: () => void;
  isAllSelected: boolean;
}

const BatchOperationBar = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDelete,
  isAllSelected,
}: BatchOperationBarProps) => {
  const { t } = useTranslation();

  // 确认删除
  const handleDeleteClick = () => {
    Modal.confirm({
      title: t('screenshot.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('screenshot.deleteModal.confirmMessage', { count: selectedCount }),
      okType: 'danger',
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      onOk: () => {
        onDelete();
        Toast.success(t('screenshot.deleteModal.success', { count: selectedCount }));
      },
    });
  };

  return (
    <div className="batch-operation-bar">
      <Space>
        <Text>
          {t('screenshot.batchOperation.selected', { count: selectedCount })}
        </Text>
        <Button
          theme="borderless"
          size="small"
          onClick={isAllSelected ? onClearSelection : onSelectAll}
        >
          {isAllSelected
            ? t('screenshot.batchOperation.clearSelection')
            : t('screenshot.batchOperation.selectAll', { count: totalCount })}
        </Button>
      </Space>
      <Space>
        <Button
          icon={<IconDeleteStroked />}
          theme="light"
          type="danger"
          size="small"
          onClick={handleDeleteClick}
        >
          {t('screenshot.batchOperation.delete')}
        </Button>
      </Space>
    </div>
  );
};

export default BatchOperationBar;
