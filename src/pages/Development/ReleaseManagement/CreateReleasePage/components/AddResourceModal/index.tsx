import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Tabs,
  TabPane,
  Table,
  Input,
  Empty as SemiEmpty,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';
import type { ResourceType } from '@/api';
import type { ResourceConfig } from '../../index';

import './index.less';

const { Text } = Typography;

interface AvailableResource {
  id: string;
  name: string;
  type: ResourceType;
  test_value?: string;
  is_published?: boolean;
  original_name?: string;
}

interface AddResourceModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (resources: ResourceConfig[]) => void;
  existingResourceIds: string[];
}

const AddResourceModal: React.FC<AddResourceModalProps> = ({
  visible,
  onClose,
  onConfirm,
  existingResourceIds,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ResourceType>('PARAMETER');
  const [searchTexts, setSearchTexts] = useState<Record<ResourceType, string>>({
    PARAMETER: '',
    CREDENTIAL: '',
    QUEUE: '',
    FILE: '',
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // Mock 可用资源数据
  const mockAvailableResources: AvailableResource[] = useMemo(() => [
    // 参数
    { id: 'param-1', name: 'API_ENDPOINT', type: 'PARAMETER', test_value: 'https://api.test.com', is_published: true },
    { id: 'param-2', name: 'MAX_RETRIES', type: 'PARAMETER', test_value: '3', is_published: false },
    { id: 'param-3', name: 'TIMEOUT_SECONDS', type: 'PARAMETER', test_value: '30', is_published: false },
    { id: 'param-4', name: 'DEBUG_MODE', type: 'PARAMETER', test_value: 'true', is_published: true },
    { id: 'param-5', name: 'LOG_LEVEL', type: 'PARAMETER', test_value: 'INFO', is_published: false },
    // 凭据
    { id: 'cred-1', name: 'Database Credential', type: 'CREDENTIAL', test_value: '******', is_published: true },
    { id: 'cred-2', name: 'API Token', type: 'CREDENTIAL', test_value: '******', is_published: false },
    { id: 'cred-3', name: 'OAuth Client', type: 'CREDENTIAL', test_value: '******', is_published: false },
    { id: 'cred-4', name: 'SFTP Credential', type: 'CREDENTIAL', test_value: '******', is_published: true },
    // 队列
    { id: 'queue-1', name: 'Task Queue', type: 'QUEUE', is_published: true },
    { id: 'queue-2', name: 'Email Queue', type: 'QUEUE', is_published: false },
    { id: 'queue-3', name: 'Notification Queue', type: 'QUEUE', is_published: false },
    // 文件
    { id: 'file-1', name: '订单模板.xlsx', type: 'FILE', is_published: true },
    { id: 'file-2', name: '报表配置.json', type: 'FILE', is_published: false },
    { id: 'file-3', name: '数据映射.xml', type: 'FILE', is_published: false },
  ], []);

  // 过滤已添加的资源和按类型分组
  const getFilteredResources = (type: ResourceType) => {
    const searchText = searchTexts[type];
    return mockAvailableResources
      .filter((r) => r.type === type)
      .filter((r) => !existingResourceIds.includes(r.id))
      .filter((r) =>
        searchText
          ? r.name.toLowerCase().includes(searchText.toLowerCase())
          : true
      );
  };

  const handleSearchChange = (type: ResourceType, value: string) => {
    setSearchTexts((prev) => ({ ...prev, [type]: value }));
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key as ResourceType);
    setSelectedRowKeys([]);
  };

  const handleConfirm = () => {
    const selectedResources = mockAvailableResources
      .filter((r) => selectedRowKeys.includes(r.id))
      .map((r): ResourceConfig => ({
        resource_id: r.id,
        resource_name: r.name,
        resource_type: r.type,
        test_value: r.test_value,
        production_value: '',
        is_previously_published: r.is_published || false,
        use_test_as_production: false,
        used_by_processes: [],
        is_manual: true,
        original_name: r.original_name,
      }));

    onConfirm(selectedResources);
    handleClose();
  };

  const handleClose = () => {
    setSelectedRowKeys([]);
    setSearchTexts({
      PARAMETER: '',
      CREDENTIAL: '',
      QUEUE: '',
        FILE: '',
    });
    setActiveTab('PARAMETER');
    onClose();
  };

  const columns = [
    {
      title: t('release.create.addResource.resourceName'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: AvailableResource) => (
        <div className="add-resource-modal-name-cell">
          <Text strong>{name}</Text>
          {record.is_published && (
            <Tag color="green" size="small">
              {t('release.create.alreadyPublished')}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: t('release.create.testValue'),
      dataIndex: 'test_value',
      key: 'test_value',
      render: (value: string) => value || '-',
    },
  ];

  const fileColumns = [
    {
      title: t('release.create.addResource.resourceName'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: AvailableResource) => (
        <div className="add-resource-modal-name-cell">
          <Text strong>{name}</Text>
          {record.is_published && (
            <Tag color="green" size="small">
              {t('release.create.alreadyPublished')}
            </Tag>
          )}
        </div>
      ),
    },
  ];

  const queueColumns = [
    {
      title: t('release.create.addResource.resourceName'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: AvailableResource) => (
        <div className="add-resource-modal-name-cell">
          <Text strong>{name}</Text>
          {record.is_published && (
            <Tag color="green" size="small">
              {t('release.create.alreadyPublished')}
            </Tag>
          )}
        </div>
      ),
    },
  ];

  const tabLabels: Record<ResourceType, string> = {
    PARAMETER: t('release.create.resourceTypes.parameter'),
    CREDENTIAL: t('release.create.resourceTypes.credential'),
    QUEUE: t('release.create.resourceTypes.queue'),
    FILE: t('release.create.resourceTypes.file'),
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: (string | number)[]) => {
      setSelectedRowKeys(keys as string[]);
    },
  };

  return (
    <Modal
      title={t('release.create.addResource.title')}
      visible={visible}
      onCancel={handleClose}
      onOk={handleConfirm}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      okButtonProps={{ disabled: selectedRowKeys.length === 0 }}
      width={700}
      className="add-resource-modal"
    >
      <div className="add-resource-modal-content">
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          {(['PARAMETER', 'CREDENTIAL', 'QUEUE', 'FILE'] as ResourceType[]).map((type) => (
            <TabPane
              tab={tabLabels[type]}
              itemKey={type}
              key={type}
            >
              <div className="add-resource-modal-tab-search">
                <Input
                  prefix={<IconSearch />}
                  placeholder={t('release.create.addResource.searchPlaceholder')}
                  value={searchTexts[type]}
                  onChange={(value) => handleSearchChange(type, value)}
                  showClear
                  style={{ width: 320 }}
                />
              </div>
              <Table
                columns={type === 'QUEUE' ? queueColumns : type === 'FILE' ? fileColumns : columns}
                dataSource={getFilteredResources(type)}
                rowKey="id"
                rowSelection={rowSelection}
                pagination={false}
                size="small"
                empty={
                  <SemiEmpty
                    description={t('release.create.addResource.noResources')}
                  />
                }
              />
            </TabPane>
          ))}
        </Tabs>

        {selectedRowKeys.length > 0 && (
          <div className="add-resource-modal-selected-count">
            <Text type="tertiary">
              {t('release.create.addResource.selectedCount', { count: selectedRowKeys.length })}
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddResourceModal;
