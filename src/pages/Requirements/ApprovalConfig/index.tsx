/**
 * 审批与评估配置 - 多方案管理（卡片列表）
 *
 * - 列表样式与「需求模版」保持一致：搜索 + 新建按钮 + 卡片网格
 * - 点击卡片 / 编辑跳转独立编辑页（双卡片布局）
 * - 系统预设方案：可复制不可编辑/删除/停用
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Toast,
  Space,
  Spin,
  Tag,
  Modal,
  Input,
  TextArea,
  Dropdown,
  Row,
  Col,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import {
  Copy,
  Trash2,
  Plus,
  Ellipsis,
  Eye,
  Pencil,
  CheckCircle,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import {
  fetchSchemes,
  subscribeConfigChange,
  createScheme,
  deleteScheme,
  activateScheme,
  type ApprovalAssessmentScheme,
} from './mockData';
import './index.less';

const { Title, Text } = Typography;

const ApprovalAssessmentConfigPage = () => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<ApprovalAssessmentScheme[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm, setCreateForm] = useState<{ name: string; description: string; sourceId: string }>({
    name: '',
    description: '',
    sourceId: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchSchemes();
      setSchemes(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeConfigChange(() => load()), [load]);

  const filteredSchemes = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return schemes;
    return schemes.filter(
      (s) => s.name.toLowerCase().includes(k) || (s.description ?? '').toLowerCase().includes(k),
    );
  }, [schemes, keyword]);

  const goView = (s: ApprovalAssessmentScheme) =>
    navigate(`/requirements/approval-config/${s.id}/edit?mode=view`);
  const goEdit = (s: ApprovalAssessmentScheme) =>
    navigate(`/requirements/approval-config/${s.id}/edit`);

  const handleActivate = (s: ApprovalAssessmentScheme) => {
    if (s.is_active) return;
    Modal.confirm({
      title: '切换激活方案',
      content: (
        <div>
          确认将「{s.name}」设为当前激活方案？
          <br />
          切换后，所有<strong>新建需求</strong>将走该方案的审批与评估流程；
          <br />
          已在审批中的需求<strong>不受影响</strong>。
        </div>
      ),
      okText: '确认激活',
      cancelText: '取消',
      onOk: async () => {
        try {
          await activateScheme(s.id);
          Toast.success('已激活');
        } catch (e) {
          Toast.error((e as Error).message);
        }
      },
    });
  };

  const handleDelete = (s: ApprovalAssessmentScheme) => {
    if (s.is_preset || s.is_active) return;
    Modal.confirm({
      title: '删除方案',
      content: `确认删除方案「${s.name}」？该操作不可恢复。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          await deleteScheme(s.id);
          Toast.success('已删除');
        } catch (e) {
          Toast.error((e as Error).message);
        }
      },
    });
  };

  const openCreate = (sourceId?: string) => {
    const src = schemes.find((s) => s.id === sourceId) ?? schemes[0];
    setCreateForm({ name: '', description: '', sourceId: src?.id ?? '' });
    setCreateModalVisible(true);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      Toast.error('请输入方案名称');
      return;
    }
    if (!createForm.sourceId) {
      Toast.error('请选择复制来源');
      return;
    }
    try {
      const created = await createScheme({
        name: createForm.name,
        description: createForm.description || undefined,
        source_scheme_id: createForm.sourceId,
      });
      setCreateModalVisible(false);
      Toast.success('方案已创建');
      goEdit(created);
    } catch (e) {
      Toast.error((e as Error).message);
    }
  };

  return (
    <div className="approval-config-page">
      <div className="approval-config-page-header">
        <div className="approval-config-page-header-title">
          <Title heading={3} className="title">审批与评估配置</Title>
          <Text type="tertiary">
            可创建多套方案，仅一套方案处于激活状态；新建需求将走当前激活方案的流程。
          </Text>
        </div>
        <Row
          type="flex"
          justify="space-between"
          align="middle"
          className="approval-config-page-header-toolbar"
        >
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder="搜索方案名称或描述"
                className="approval-config-search-input"
                value={keyword}
                onChange={setKeyword}
                showClear
                maxLength={100}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<Plus size={16} strokeWidth={2} />}
                theme="solid"
                type="primary"
                onClick={() => openCreate()}
              >
                新建方案
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div className="approval-config-page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Spin />
          </div>
        ) : filteredSchemes.length === 0 ? (
          <EmptyState variant="noData" description={keyword ? '未找到匹配的方案' : '暂无方案'} />
        ) : (
          <div className="approval-config-grid">
            {filteredSchemes.map((s) => (
              <div
                key={s.id}
                className={`scheme-card ${s.is_active ? 'active' : ''}`}
                onClick={() => goEdit(s)}
              >
                <div className="scheme-card-header">
                  <div className="scheme-card-title-row">
                    <Text strong ellipsis={{ showTooltip: true }} style={{ fontSize: 16 }}>
                      {s.name}
                    </Text>
                    {s.is_active && (
                      <Tag color="green" type="solid" size="small">已激活</Tag>
                    )}
                    {s.is_preset && (
                      <Tag color="blue" type="light" size="small">系统预设</Tag>
                    )}
                  </div>
                  <Dropdown
                    trigger="click"
                    clickToHide
                    position="bottomRight"
                    render={
                      <Dropdown.Menu>
                        <Dropdown.Item
                          icon={<Eye size={14} />}
                          onClick={(e) => { e.stopPropagation(); goEdit(s); }}
                        >
                          查看详情
                        </Dropdown.Item>
                        {!s.is_active && (
                          <Dropdown.Item
                            icon={<CheckCircle size={14} />}
                            onClick={(e) => { e.stopPropagation(); handleActivate(s); }}
                          >
                            激活此方案
                          </Dropdown.Item>
                        )}
                        <Dropdown.Item
                          icon={<Pencil size={14} />}
                          onClick={(e) => { e.stopPropagation(); goEdit(s); }}
                        >
                          编辑
                        </Dropdown.Item>
                        <Dropdown.Item
                          icon={<Copy size={14} />}
                          onClick={(e) => { e.stopPropagation(); openCreate(s.id); }}
                        >
                          基于此创建副本
                        </Dropdown.Item>
                        {!s.is_preset && !s.is_active && (
                          <Dropdown.Item
                            icon={<Trash2 size={14} />}
                            type="danger"
                            onClick={(e) => { e.stopPropagation(); handleDelete(s); }}
                          >
                            删除
                          </Dropdown.Item>
                        )}
                      </Dropdown.Menu>
                    }
                  >
                    <Button
                      icon={<Ellipsis size={16} />}
                      theme="borderless"
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                </div>
                <div className="scheme-card-meta">
                  <Text type="tertiary" size="small">
                    v{s.version} · {new Date(s.updated_at).toLocaleDateString()}
                  </Text>
                </div>
                {s.description && (
                  <Text
                    type="secondary"
                    size="small"
                    ellipsis={{ rows: 2 }}
                    style={{ marginTop: 8 }}
                  >
                    {s.description}
                  </Text>
                )}
                <div className="scheme-card-footer">
                  <Tag size="small" color="grey" type="light">
                    {s.approval_enabled ? `${s.approval_levels.length} 审批层级` : '免审批'}
                  </Tag>
                  <Tag size="small" color="grey" type="light">
                    {s.assessment_enabled ? `${s.assessor_groups.length} 评估组` : '免评估'}
                  </Tag>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新建方案 */}
      <Modal
        title="新建方案"
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleCreate}
        okText="创建"
        cancelText="取消"
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              方案名称<Text type="danger">*</Text>
            </Text>
            <Input
              value={createForm.name}
              onChange={(v) => setCreateForm((p) => ({ ...p, name: v }))}
              placeholder="请输入方案名称"
              maxLength={50}
              showClear
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>方案描述</Text>
            <TextArea
              value={createForm.description}
              onChange={(v) => setCreateForm((p) => ({ ...p, description: v }))}
              placeholder="选填"
              maxLength={200}
              autosize={{ minRows: 2, maxRows: 4 }}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              基于已有方案复制<Text type="danger">*</Text>
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {schemes.map((s) => (
                <label
                  key={s.id}
                  className={`scheme-source-option${createForm.sourceId === s.id ? ' is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="scheme-source"
                    checked={createForm.sourceId === s.id}
                    onChange={() => setCreateForm((p) => ({ ...p, sourceId: s.id }))}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <Text strong>{s.name}</Text>
                    {s.is_preset && (
                      <Tag color="grey" type="light" size="small" style={{ marginLeft: 6 }}>
                        系统预设
                      </Tag>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApprovalAssessmentConfigPage;
