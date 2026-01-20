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
import './index.less';

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
      <div className="process-detail-empty">
        <Text>流程数据不存在</Text>
        <Button onClick={() => navigate('/process-development')} className="process-detail-empty-button">
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
    <div className="process-detail">
      {/* 固定面包屑 */}
      <div className="process-detail-breadcrumb">
        <Breadcrumb>
          <Breadcrumb.Item onClick={() => navigate('/')} className="process-detail-breadcrumb-item">首页</Breadcrumb.Item>
          <Breadcrumb.Item>开发中心</Breadcrumb.Item>
          <Breadcrumb.Item onClick={() => navigate('/process-development')} className="process-detail-breadcrumb-item">自动化流程</Breadcrumb.Item>
          <Breadcrumb.Item>流程详情</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* 标题区域 */}
      <div className="process-detail-header">
        <div className="process-detail-header-content">
          <div className="process-detail-title-section">
            <Button 
              icon={<IconArrowLeft />} 
              theme="borderless"
              onClick={() => navigate('/process-development')}
            />
            <div className="process-detail-title-info">
              <Title heading={3} className="title">{processData.name}</Title>
              <Text type="tertiary">{processData.id}</Text>
            </div>
          </div>
          <div className="process-detail-actions">
            <Button icon={<IconEdit />} theme="light">
              编辑流程
            </Button>
            <Button icon={<IconPlay />} theme="solid" type="primary">
              运行流程
            </Button>
          </div>
        </div>
      </div>

      {/* 可滚动内容区域 */}
      <div className="process-detail-body">
        {/* 基本信息卡片 */}
        <Card title="基本信息" className="process-detail-card">
          <Descriptions data={descriptionData} />
        </Card>

        {/* 流程设计区域占位 */}
        <Card title="流程设计">
          <div className="process-detail-designer-placeholder">
            <Text type="tertiary">流程设计器区域</Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProcessDetail;
