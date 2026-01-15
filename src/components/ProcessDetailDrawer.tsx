import { useState, useMemo } from 'react';
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
  Divider,
  Tooltip,
  DatePicker,
  Select
} from '@douyinfe/semi-ui';
import { IconEditStroked, IconPlay, IconDeleteStroked, IconExternalOpenStroked } from '@douyinfe/semi-icons';

const { Title, Text } = Typography;

// 变更历史模拟数据 (移到组件外部)
const allChangeData = [
  { key: 1, changeTime: '2024-01-15 10:30', changeType: '发布', changer: '姜鹏志', changeContent: '发布版本 1.2.0' },
  { key: 2, changeTime: '2024-01-14 16:00', changeType: '编辑', changer: '李明', changeContent: '修改流程描述' },
  { key: 3, changeTime: '2024-01-10 14:20', changeType: '发布', changer: '姜鹏志', changeContent: '发布版本 1.1.0' },
  { key: 4, changeTime: '2024-01-05 09:00', changeType: '创建', changer: '王芳', changeContent: '创建流程' },
  { key: 5, changeTime: '2023-12-28 14:30', changeType: '编辑', changer: '李明', changeContent: '修改流程配置' },
];

// 从数据中提取变更人选项
const changerOptions = [...new Set(allChangeData.map(item => item.changer))].map(changer => ({
  value: changer,
  label: changer
}));

// 运行记录模拟数据 (移到组件外部)
const allRunData = [
  { key: 1, runId: 'RUN-001', startTime: '2024-01-15 10:30:00', endTime: '2024-01-15 10:30:45', status: '成功' },
  { key: 2, runId: 'RUN-002', startTime: '2024-01-14 15:20:00', endTime: '2024-01-14 15:21:30', status: '失败' },
  { key: 3, runId: 'RUN-003', startTime: '2024-01-13 09:00:00', endTime: '2024-01-13 09:00:30', status: '成功' },
  { key: 4, runId: 'RUN-004', startTime: '2024-01-12 14:00:00', endTime: '2024-01-12 14:01:15', status: '运行中' },
  { key: 5, runId: 'RUN-005', startTime: '2024-01-11 08:30:00', endTime: '2024-01-11 08:31:00', status: '成功' },
];

// 运行状态选项
const runStatusOptions = [
  { value: '成功', label: '成功' },
  { value: '失败', label: '失败' },
  { value: '运行中', label: '运行中' },
];

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
  onOpen,
  onEdit,
  onRun,
  onDelete 
}: ProcessDetailDrawerProps) => {
  const [activeTab, setActiveTab] = useState('detail');
  const [changeTimeRange, setChangeTimeRange] = useState<[Date, Date] | null>(null);
  const [selectedChangers, setSelectedChangers] = useState<string[]>([]);
  const [runTimeRange, setRunTimeRange] = useState<[Date, Date] | null>(null);
  const [selectedRunStatuses, setSelectedRunStatuses] = useState<string[]>([]);

  // 根据时间范围和变更人筛选变更历史 (必须在 early return 之前)
  const filteredChangeData = useMemo(() => {
    return allChangeData.filter(item => {
      // 时间范围筛选
      if (changeTimeRange && changeTimeRange[0] && changeTimeRange[1]) {
        const [startDate, endDate] = changeTimeRange;
        const itemDate = new Date(item.changeTime.replace(' ', 'T'));
        if (itemDate < startDate || itemDate > endDate) {
          return false;
        }
      }
      // 变更人筛选
      if (selectedChangers.length > 0 && !selectedChangers.includes(item.changer)) {
        return false;
      }
      return true;
    });
  }, [changeTimeRange, selectedChangers]);

  // 根据时间范围和状态筛选运行记录 (必须在 early return 之前)
  const filteredRunData = useMemo(() => {
    return allRunData.filter(item => {
      // 时间范围筛选
      if (runTimeRange && runTimeRange[0] && runTimeRange[1]) {
        const [startDate, endDate] = runTimeRange;
        const itemDate = new Date(item.startTime.replace(' ', 'T'));
        if (itemDate < startDate || itemDate > endDate) {
          return false;
        }
      }
      // 状态筛选
      if (selectedRunStatuses.length > 0 && !selectedRunStatuses.includes(item.status)) {
        return false;
      }
      return true;
    });
  }, [runTimeRange, selectedRunStatuses]);

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

  // 运行记录列定义
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

  // 变更历史模拟数据
  const changeColumns = [
    { title: '变更时间', dataIndex: 'changeTime', key: 'changeTime' },
    { title: '变更类型', dataIndex: 'changeType', key: 'changeType' },
    { title: '变更人', dataIndex: 'changer', key: 'changer' },
    { title: '变更内容', dataIndex: 'changeContent', key: 'changeContent' },
  ];


  return (
    <SideSheet
      title={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%',
          paddingRight: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Title heading={5} style={{ margin: 0 }}>{processData.name}</Title>
            <Text type="tertiary" size="small">{processData.id}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tooltip content="打开流程">
              <Button 
                icon={<IconExternalOpenStroked />} 
                theme="borderless"
                size="small"
                onClick={onOpen}
              />
            </Tooltip>
            <Tooltip content="编辑">
              <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={onEdit} />
            </Tooltip>
            <Tooltip content="运行">
              <Button icon={<IconPlay />} theme="borderless" size="small" onClick={onRun} />
            </Tooltip>
            <Tooltip content="删除">
              <Button 
                icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />} 
                theme="borderless"
                size="small"
                onClick={onDelete}
              />
            </Tooltip>
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
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <DatePicker
                type="dateTimeRange"
                value={runTimeRange as [Date, Date] | undefined}
                onChange={(value) => setRunTimeRange(value as [Date, Date] | null)}
                placeholder={['开始时间', '结束时间']}
                style={{ flex: 1 }}
                showClear
              />
              <Select
                placeholder="状态"
                multiple
                value={selectedRunStatuses}
                onChange={(value) => setSelectedRunStatuses(value as string[])}
                optionList={runStatusOptions}
                style={{ width: 140 }}
                showClear
              />
            </div>
            {filteredRunData.length > 0 ? (
              <Table 
                columns={runColumns} 
                dataSource={filteredRunData} 
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
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <DatePicker
                type="dateTimeRange"
                value={changeTimeRange as [Date, Date] | undefined}
                onChange={(value) => setChangeTimeRange(value as [Date, Date] | null)}
                placeholder={['开始时间', '结束时间']}
                style={{ flex: 1 }}
                showClear
              />
              <Select
                placeholder="变更人"
                multiple
                value={selectedChangers}
                onChange={(value) => setSelectedChangers(value as string[])}
                optionList={changerOptions}
                style={{ width: 160 }}
                showClear
              />
            </div>
            {filteredChangeData.length > 0 ? (
              <Table 
                columns={changeColumns} 
                dataSource={filteredChangeData} 
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
