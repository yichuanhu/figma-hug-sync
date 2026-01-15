import { useState } from 'react';
import { 
  SideSheet, 
  Typography, 
  Button, 
  Tag,
  Descriptions,
  Tabs,
  TabPane,
  Table,
  Empty,
  Divider
} from '@douyinfe/semi-ui';
import { IconEditStroked, IconPlay, IconDeleteStroked } from '@douyinfe/semi-icons';

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
  const [activeTab, setActiveTab] = useState('detail');

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

  // 版本列表模拟数据
  const versionColumns = [
    { title: '版本号', dataIndex: 'version', key: 'version' },
    { title: '发布时间', dataIndex: 'publishedAt', key: 'publishedAt' },
    { title: '发布人', dataIndex: 'publisher', key: 'publisher' },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
  ];

  const versionData = [
    { key: 1, version: '1.2.0', publishedAt: '2024-01-15 10:30', publisher: '姜鹏志', remark: '修复审批逻辑' },
    { key: 2, version: '1.1.0', publishedAt: '2024-01-10 14:20', publisher: '姜鹏志', remark: '新增通知功能' },
    { key: 3, version: '1.0.0', publishedAt: '2024-01-05 09:00', publisher: '姜鹏志', remark: '初始版本' },
  ];

  // 运行记录模拟数据
  const runColumns = [
    { title: '运行ID', dataIndex: 'runId', key: 'runId' },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '成功' ? 'green' : status === '失败' ? 'red' : 'blue'} type="light">
          {status}
        </Tag>
      )
    },
  ];

  const runData = [
    { key: 1, runId: 'RUN-001', startTime: '2024-01-15 10:30:00', endTime: '2024-01-15 10:30:45', status: '成功' },
    { key: 2, runId: 'RUN-002', startTime: '2024-01-14 15:20:00', endTime: '2024-01-14 15:21:30', status: '失败' },
    { key: 3, runId: 'RUN-003', startTime: '2024-01-13 09:00:00', endTime: '2024-01-13 09:00:30', status: '成功' },
  ];

  // 变更历史模拟数据
  const changeColumns = [
    { title: '变更时间', dataIndex: 'changeTime', key: 'changeTime' },
    { title: '变更类型', dataIndex: 'changeType', key: 'changeType' },
    { title: '变更人', dataIndex: 'changer', key: 'changer' },
    { title: '变更内容', dataIndex: 'changeContent', key: 'changeContent' },
  ];

  const changeData = [
    { key: 1, changeTime: '2024-01-15 10:30', changeType: '发布', changer: '姜鹏志', changeContent: '发布版本 1.2.0' },
    { key: 2, changeTime: '2024-01-14 16:00', changeType: '编辑', changer: '姜鹏志', changeContent: '修改流程描述' },
    { key: 3, changeTime: '2024-01-10 14:20', changeType: '发布', changer: '姜鹏志', changeContent: '发布版本 1.1.0' },
  ];

  return (
    <SideSheet
      title={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%',
          paddingRight: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Title heading={5} style={{ margin: 0 }}>{processData.name}</Title>
            <Text type="tertiary" size="small">{processData.id}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Button 
              icon={<IconDeleteStroked />} 
              theme="borderless"
              size="small"
              onClick={onDelete}
            />
            <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={onEdit} />
            <Button icon={<IconPlay />} theme="borderless" size="small" onClick={onRun} />
            <Divider layout="vertical" style={{ height: 16, margin: '0 8px 0 8px', marginRight: 24 }} />
          </div>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      width={560}
      footer={null}
      headerStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
      bodyStyle={{ padding: 0 }}
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        style={{ height: '100%' }}
        tabBarStyle={{ padding: '0 24px' }}
      >
        <TabPane tab="流程详情" itemKey="detail">
          <div style={{ padding: '16px 24px' }}>
            <Descriptions data={descriptionData} />
          </div>
        </TabPane>
        
        <TabPane tab="版本列表" itemKey="versions">
          <div style={{ padding: '16px 24px' }}>
            {versionData.length > 0 ? (
              <Table 
                columns={versionColumns} 
                dataSource={versionData} 
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无版本记录" />
            )}
          </div>
        </TabPane>
        
        <TabPane tab="运行记录" itemKey="runs">
          <div style={{ padding: '16px 24px' }}>
            {runData.length > 0 ? (
              <Table 
                columns={runColumns} 
                dataSource={runData} 
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无运行记录" />
            )}
          </div>
        </TabPane>
        
        <TabPane tab="变更历史" itemKey="changes">
          <div style={{ padding: '16px 24px' }}>
            {changeData.length > 0 ? (
              <Table 
                columns={changeColumns} 
                dataSource={changeData} 
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无变更历史" />
            )}
          </div>
        </TabPane>
      </Tabs>
    </SideSheet>
  );
};

export default ProcessDetailDrawer;
