import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Breadcrumb, 
  Typography, 
  Button, 
  Tag,
  Card,
  Descriptions
} from '@douyinfe/semi-ui';
import { IconArrowLeft, IconEdit, IconPlay } from '@douyinfe/semi-icons';

const { Title, Text } = Typography;

interface ProcessData {
  id: string;
  name: string;
  description: string;
  type: string;
  relatedRequirement: string;
  organization: string;
  status: string;
  creator: string;
  createdAt: string;
}

const ProcessDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const processData = location.state?.processData as ProcessData;

  if (!processData) {
    return (
      <div style={{ padding: '20px 24px', textAlign: 'center' }}>
        <Text>流程数据不存在</Text>
        <Button onClick={() => navigate('/process-development')} style={{ marginTop: 16 }}>
          返回流程列表
        </Button>
      </div>
    );
  }

  const descriptionData = [
    { key: '流程ID', value: processData.id },
    { key: '流程名称', value: processData.name },
    { key: '流程描述', value: processData.description },
    { key: '流程类型', value: processData.type },
    { key: '关联需求', value: processData.relatedRequirement || '无' },
    { key: '归属组织', value: processData.organization },
    { key: '创建者', value: processData.creator },
    { key: '创建时间', value: processData.createdAt },
    { key: '状态', value: <Tag color="grey" type="light">{processData.status}</Tag> },
  ];

  return (
    <div style={{ padding: '20px 24px', minHeight: '100%' }}>
      {/* 面包屑 */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
        <Breadcrumb.Item>开发中心</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/process-development')} style={{ cursor: 'pointer' }}>自动化流程</Breadcrumb.Item>
        <Breadcrumb.Item>流程详情</Breadcrumb.Item>
      </Breadcrumb>

      {/* 标题区域 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 24 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button 
            icon={<IconArrowLeft />} 
            theme="borderless"
            onClick={() => navigate('/process-development')}
          />
          <div>
            <Title heading={3} style={{ marginBottom: 4 }}>{processData.name}</Title>
            <Text type="tertiary">{processData.id}</Text>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button icon={<IconEdit />} theme="light">
            编辑流程
          </Button>
          <Button icon={<IconPlay />} theme="solid" type="primary">
            运行流程
          </Button>
        </div>
      </div>

      {/* 基本信息卡片 */}
      <Card title="基本信息" style={{ marginBottom: 24 }}>
        <Descriptions data={descriptionData} />
      </Card>

      {/* 流程设计区域占位 */}
      <Card title="流程设计">
        <div style={{ 
          height: 400, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'var(--semi-color-fill-0)',
          borderRadius: 8
        }}>
          <Text type="tertiary">流程设计器区域</Text>
        </div>
      </Card>
    </div>
  );
};

export default ProcessDetail;
