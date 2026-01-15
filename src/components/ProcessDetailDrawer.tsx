import { 
  SideSheet, 
  Typography, 
  Button, 
  Tag,
  Descriptions,
  Divider
} from '@douyinfe/semi-ui';
import { IconEdit, IconPlay, IconDelete } from '@douyinfe/semi-icons';

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
  onEdit?: () => void;
  onRun?: () => void;
  onDelete?: () => void;
}

const ProcessDetailDrawer = ({ 
  visible, 
  onClose, 
  processData,
  onEdit,
  onRun,
  onDelete 
}: ProcessDetailDrawerProps) => {
  if (!processData) return null;

  const descriptionData = [
    { key: '流程ID', value: processData.id },
    { key: '流程名称', value: processData.name },
    { key: '流程描述', value: processData.description || '-' },
    { key: '归属组织', value: processData.organization },
    { key: '创建者', value: processData.creator },
    { key: '创建时间', value: processData.createdAt },
    { 
      key: '状态', 
      value: (
        <Tag 
          color={processData.status === '已发布' ? 'green' : 'grey'} 
          type="light"
        >
          {processData.status}
        </Tag>
      ) 
    },
  ];

  if (processData.language) {
    descriptionData.splice(3, 0, { 
      key: '语言', 
      value: (
        <Tag 
          color={processData.language === 'python' ? 'blue' : 'cyan'} 
          type="light"
        >
          {processData.language}
        </Tag>
      ) as unknown as string
    });
  }

  if (processData.version) {
    descriptionData.splice(4, 0, { 
      key: '版本', 
      value: (
        <Tag color="grey" type="ghost">
          {processData.version}
        </Tag>
      ) as unknown as string
    });
  }

  return (
    <SideSheet
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Title heading={5} style={{ margin: 0 }}>{processData.name}</Title>
          <Text type="tertiary" size="small">{processData.id}</Text>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      width={480}
      footer={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          padding: '12px 0'
        }}>
          <Button 
            icon={<IconDelete />} 
            type="danger" 
            theme="borderless"
            onClick={onDelete}
          >
            删除
          </Button>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button icon={<IconEdit />} theme="light" onClick={onEdit}>
              编辑
            </Button>
            <Button icon={<IconPlay />} theme="solid" type="primary" onClick={onRun}>
              运行
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ padding: '8px 0' }}>
        <Descriptions data={descriptionData} />
      </div>
    </SideSheet>
  );
};

export default ProcessDetailDrawer;
