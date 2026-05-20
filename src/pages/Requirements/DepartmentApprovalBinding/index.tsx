/**
 * 部门审批流绑定（STORY-016）
 *
 * 左：部门树（来自 departmentTree mock）
 * 右：当前选中部门的「需求审批流」绑定（business_type = REQUIREMENT）
 *
 * - 一个部门同一时刻仅能绑定一个模板
 * - 模板可被多个部门绑定
 * - 未绑定的部门将走「跳过审批/评估，直接进入待开发」的运行时路径
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Tree,
  Button,
  Tag,
  Toast,
  Modal,
  Select,
  Empty,
  Space,
  Input,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Building2, Link as LinkIcon, Unlink, Pencil } from 'lucide-react';
import { departmentTree, type DeptTreeNode } from '@/mocks/departmentData';
import {
  fetchAllBindings,
  getBindingByDepartment,
  setBinding,
  removeBinding,
  subscribeBindingChange,
} from '@/mocks/departmentApprovalFlowBinding';
import {
  fetchApprovalFlows,
  type ApprovalFlowTemplate,
} from '@/pages/Requirements/ApprovalConfig/mockData';
import './index.less';

const { Title, Text } = Typography;

interface FlatDept { value: string; label: string; path: string[]; }

const flattenDeptTree = (nodes: DeptTreeNode[], parents: string[] = []): FlatDept[] => {
  const out: FlatDept[] = [];
  nodes.forEach((n) => {
    out.push({ value: n.value, label: n.label, path: [...parents, n.label] });
    if (n.children?.length) out.push(...flattenDeptTree(n.children, [...parents, n.label]));
  });
  return out;
};

const DepartmentApprovalBinding = () => {
  const [keyword, setKeyword] = useState('');
  const [selectedDept, setSelectedDept] = useState<string | undefined>(undefined);
  const [flows, setFlows] = useState<ApprovalFlowTemplate[]>([]);
  const [bindingMap, setBindingMap] = useState<Record<string, string>>({});
  const [editorVisible, setEditorVisible] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | undefined>();

  const reloadBindings = useCallback(async () => {
    const all = await fetchAllBindings();
    const map: Record<string, string> = {};
    all.forEach((b) => { map[b.department_id] = b.approval_flow_template_id; });
    setBindingMap(map);
  }, []);

  useEffect(() => { fetchApprovalFlows().then(setFlows); reloadBindings(); }, [reloadBindings]);
  useEffect(() => subscribeBindingChange(() => reloadBindings()), [reloadBindings]);

  const flatDepts = useMemo(() => flattenDeptTree(departmentTree), []);
  const selectedDeptInfo = useMemo(
    () => flatDepts.find((d) => d.value === selectedDept),
    [flatDepts, selectedDept],
  );

  const activeFlows = useMemo(() => flows.filter((f) => f.status === 'active'), [flows]);
  const flowById = useMemo(() => {
    const m: Record<string, ApprovalFlowTemplate> = {};
    flows.forEach((f) => { m[f.id] = f; });
    return m;
  }, [flows]);

  const currentBindingId = selectedDept ? getBindingByDepartment(selectedDept) : null;
  const currentBindingFlow = currentBindingId ? flowById[currentBindingId] : undefined;

  const openEditor = () => {
    setPendingTemplateId(currentBindingId ?? activeFlows[0]?.id);
    setEditorVisible(true);
  };

  const handleSaveBinding = async () => {
    if (!selectedDept || !pendingTemplateId) return;
    await setBinding(selectedDept, pendingTemplateId);
    Toast.success('已更新绑定');
    setEditorVisible(false);
  };

  const handleRemoveBinding = () => {
    if (!selectedDept) return;
    const flowName = currentBindingFlow?.name ?? '当前模板';
    Modal.confirm({
      title: '解除绑定',
      content: `确认解除「${selectedDeptInfo?.label}」与「${flowName}」的绑定？解除后该部门提交的需求将跳过审批与评估，直接进入待开发。`,
      okText: '解除',
      okButtonProps: { type: 'danger' },
      cancelText: '取消',
      onOk: async () => {
        await removeBinding(selectedDept);
        Toast.success('已解除');
      },
    });
  };

  // 树过滤：用关键字过滤后展开匹配项
  const treeFiltered = useMemo(() => {
    if (!keyword.trim()) return departmentTree;
    const kw = keyword.trim().toLowerCase();
    const filter = (nodes: DeptTreeNode[]): DeptTreeNode[] => {
      const out: DeptTreeNode[] = [];
      nodes.forEach((n) => {
        const matched = n.label.toLowerCase().includes(kw);
        const children = n.children ? filter(n.children) : undefined;
        if (matched || (children && children.length)) out.push({ ...n, children });
      });
      return out;
    };
    return filter(departmentTree);
  }, [keyword]);

  // 统计：已绑定部门数 / 总部门数
  const totalDeptCount = flatDepts.length;
  const boundCount = Object.keys(bindingMap).length;

  return (
    <div className="dept-approval-binding">
      <div className="dept-approval-binding-header">
        <Title heading={3} className="title">部门审批流绑定</Title>
        <Text type="tertiary">
          为各部门指定其需求审批流模板（business_type = REQUIREMENT）。
          已绑定 {boundCount} / {totalDeptCount} 个部门。未绑定的部门提交需求时将跳过审批与评估，直接进入「待开发」。
        </Text>
      </div>

      <div className="dept-approval-binding-body">
        {/* 左：部门树 */}
        <div className="dept-approval-binding-tree-pane">
          <div className="dept-approval-binding-tree-pane-header">
            <Input
              prefix={<IconSearchStroked />}
              placeholder="搜索部门"
              value={keyword}
              onChange={setKeyword}
              showClear
            />
          </div>
          <div className="dept-approval-binding-tree-pane-body">
            <Tree
              treeData={treeFiltered as any}
              value={selectedDept}
              onChange={(v) => setSelectedDept(v as string)}
              defaultExpandAll
              filterTreeNode
              searchRender={false}
              renderLabel={(label, data) => {
                const id = (data as { value: string }).value;
                const bound = bindingMap[id];
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span>{label}</span>
                    {bound && (
                      <Tag size="small" color="green" type="light" style={{ marginLeft: 4 }}>
                        已绑定
                      </Tag>
                    )}
                  </span>
                );
              }}
            />
          </div>
        </div>

        {/* 右：绑定详情 */}
        <div className="dept-approval-binding-detail-pane">
          {!selectedDept ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty
                image={<Building2 size={48} strokeWidth={1.5} color="var(--semi-color-text-3)" />}
                title="请选择部门"
                description="从左侧选择一个部门，查看或维护其审批流绑定。"
              />
            </div>
          ) : (
            <>
              <div className="dept-approval-binding-detail-pane-header">
                <div style={{ minWidth: 0 }}>
                  <Text strong style={{ fontSize: 16 }} ellipsis={{ showTooltip: true }}>
                    {selectedDeptInfo?.label}
                  </Text>
                  <div className="dept-path">
                    {selectedDeptInfo?.path.join(' / ')}
                  </div>
                </div>
                <Space>
                  {currentBindingId && (
                    <Button
                      icon={<Unlink size={14} strokeWidth={2} />}
                      type="danger"
                      onClick={handleRemoveBinding}
                    >
                      解除绑定
                    </Button>
                  )}
                  <Button
                    theme="solid"
                    type="primary"
                    icon={currentBindingId
                      ? <Pencil size={14} strokeWidth={2} />
                      : <LinkIcon size={14} strokeWidth={2} />}
                    onClick={openEditor}
                  >
                    {currentBindingId ? '更换模板' : '绑定模板'}
                  </Button>
                </Space>
              </div>

              <div className="dept-approval-binding-detail-pane-body">
                {currentBindingFlow ? (
                  <div className="dept-approval-binding-binding-card">
                    <div className="meta">
                      <Text strong style={{ fontSize: 15 }}>{currentBindingFlow.name}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text type="tertiary" size="small">{currentBindingFlow.code}</Text>
                      </div>
                      <Text type="secondary" size="small" style={{ display: 'block', marginTop: 8 }}>
                        {currentBindingFlow.description || '暂无描述'}
                      </Text>
                      <div className="meta-row">
                        <Tag size="small" color="grey" type="light">
                          {currentBindingFlow.approvers.length} 级审批
                        </Tag>
                        <Tag size="small" color="blue" type="light">
                          {currentBindingFlow.assessors.length > 0 ? '含技术评估' : '无技术评估'}
                        </Tag>
                        {currentBindingFlow.is_preset && (
                          <Tag size="small" color="violet" type="light">预设</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="dept-approval-binding-empty-binding">
                    <Building2 size={32} strokeWidth={1.5} style={{ marginBottom: 8, opacity: 0.6 }} />
                    <div>该部门尚未绑定审批流模板</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      未绑定时，该部门提交的需求将自动跳过审批/评估，直接进入「待开发」。
                    </div>
                  </div>
                )}

                <div className="dept-approval-binding-summary">
                  <Text type="tertiary" size="small">
                    Tip：要新增或修改可选模板，请前往「审批配置」启用对应模板（已支持多模板同时启用）。
                  </Text>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 选择模板编辑器 */}
      <Modal
        title={currentBindingId ? '更换审批流模板' : '绑定审批流模板'}
        visible={editorVisible}
        onCancel={() => setEditorVisible(false)}
        onOk={handleSaveBinding}
        okText="保存"
        cancelText="取消"
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Text type="secondary" size="small">
            为「{selectedDeptInfo?.label}」选择审批流模板（仅展示已启用模板）：
          </Text>
          <Select
            style={{ width: '100%' }}
            value={pendingTemplateId}
            onChange={(v) => setPendingTemplateId(v as string)}
            placeholder="请选择审批流模板"
            optionList={activeFlows.map((f) => ({
              value: f.id,
              label: `${f.name} · ${f.code}`,
            }))}
          />
          {pendingTemplateId && flowById[pendingTemplateId] && (
            <div style={{
              padding: 12,
              borderRadius: 6,
              background: 'var(--semi-color-fill-0)',
              fontSize: 12,
            }}>
              <Text type="tertiary" size="small">
                {flowById[pendingTemplateId].description || '暂无描述'}
              </Text>
              <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Tag size="small" color="grey" type="light">
                  {flowById[pendingTemplateId].approvers.length} 级审批
                </Tag>
                <Tag size="small" color="blue" type="light">
                  {flowById[pendingTemplateId].assessors.length > 0 ? '含技术评估' : '无技术评估'}
                </Tag>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DepartmentApprovalBinding;
