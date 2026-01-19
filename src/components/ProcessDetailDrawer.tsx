import { 
  SideSheet, 
  Typography, 
  Button, 
  Tag,
  Descriptions,
  Table
} from '@douyinfe/semi-ui';
import { IconPlay } from '@douyinfe/semi-icons';

const { Title, Text } = Typography;

interface ProcessData {
  id: string;
  name: string;
  description: string;
  status: string;
  organization: string;
  creator: string;
  createdAt: string;
  language?: string;
  version?: string;
}

interface ProcessDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  processData: ProcessData | null;
  onOpen?: () => void;
  onEdit?: () => void;
  onRun?: () => void;
  onDelete?: () => void;
}

const ProcessDetailDrawer = ({ 
  visible, 
  onClose, 
  processData,
}: ProcessDetailDrawerProps) => {
  if (!processData) return null;

  // 基本信息数据
  const basicInfoData = [
    { key: '流程ID', value: processData.id },
    { key: '归属组织', value: processData.organization },
    { key: '创建者', value: processData.creator },
    { key: '创建时间', value: processData.createdAt },
    { 
      key: '语言', 
      value: processData.language ? (
        <Tag 
          color={processData.language === 'python' ? 'blue' : 'cyan'} 
          type="light"
        >
          {processData.language}
        </Tag>
      ) : '-'
    },
    { 
      key: '版本', 
      value: processData.version ? (
        <Tag color="grey" type="ghost">
          {processData.version}
        </Tag>
      ) : '-'
    },
  ];

  // 版本列表模拟数据
  const versionColumns = [
    { title: '版本号', dataIndex: 'version', key: 'version', width: 80 },
    { title: '发布时间', dataIndex: 'publishedAt', key: 'publishedAt', width: 140 },
    { title: '发布人', dataIndex: 'publisher', key: 'publisher', width: 80 },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
  ];

  const versionData = [
    { key: 1, version: '1.2.0', publishedAt: '2024-01-15 10:30', publisher: '姜鹏志', remark: '修复审批逻辑' },
    { key: 2, version: '1.1.0', publishedAt: '2024-01-10 14:20', publisher: '姜鹏志', remark: '新增通知功能' },
    { key: 3, version: '1.0.0', publishedAt: '2024-01-05 09:00', publisher: '姜鹏志', remark: '初始版本' },
  ];

  return (
    <SideSheet
      title={<Title heading={5} style={{ margin: 0 }}>流程详情</Title>}
      visible={visible}
      onCancel={onClose}
      width={520}
      footer={null}
      headerStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
      bodyStyle={{ padding: 0, overflowY: 'auto' }}
    >
      {/* 流程头部信息区 */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--semi-color-border)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* 流程图标 */}
          <div style={{ 
            width: 72, 
            height: 72, 
            borderRadius: 8, 
            border: '1px solid var(--semi-color-border)',
            backgroundColor: 'var(--semi-color-bg-0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconPlay style={{ fontSize: 32, color: 'var(--semi-color-primary)' }} />
          </div>
          {/* 流程基本信息 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Title heading={5} style={{ margin: 0 }}>{processData.name}</Title>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: 'var(--semi-color-text-2)' }}>
              <Text type="tertiary" size="small">来自</Text>
              <Text type="tertiary" size="small" style={{ color: 'var(--semi-color-text-0)' }}>{processData.creator}</Text>
              <Text type="tertiary" size="small">{processData.createdAt}</Text>
              {processData.version && (
                <>
                  <Text type="tertiary" size="small">|</Text>
                  <Text type="tertiary" size="small">版本数量：{versionData.length}</Text>
                </>
              )}
            </div>
          </div>
          {/* 状态标签 */}
          <Tag 
            color={processData.status === '已发布' ? 'green' : 'grey'} 
            type="light"
            style={{ flexShrink: 0 }}
          >
            {processData.status}
          </Tag>
        </div>
      </div>

      {/* 流程描述 */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--semi-color-border)' }}>
        <Title heading={6} style={{ margin: '0 0 12px 0', color: 'var(--semi-color-text-0)' }}>流程描述</Title>
        <Text type="secondary" style={{ lineHeight: 1.6 }}>{processData.description || '暂无描述'}</Text>
      </div>

      {/* 基本信息 */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--semi-color-border)' }}>
        <Title heading={6} style={{ margin: '0 0 16px 0', color: 'var(--semi-color-text-0)' }}>基本信息</Title>
        <Descriptions data={basicInfoData} />
      </div>

      {/* 版本信息 */}
      <div style={{ padding: '20px 24px' }}>
        <Title heading={6} style={{ margin: '0 0 16px 0', color: 'var(--semi-color-text-0)' }}>版本信息</Title>
        <Table 
          columns={versionColumns} 
          dataSource={versionData} 
          pagination={false}
          size="small"
        />
      </div>
    </SideSheet>
  );
};

export default ProcessDetailDrawer;
