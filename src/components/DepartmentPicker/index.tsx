/**
 * DepartmentPicker — 飞书/钉钉风格的部门多选组件
 *
 * 设计参考用户上传截图：
 * - 触发器为可点击的输入框样式，展示已选部门的 Tag；
 * - 弹窗左侧为「面包屑 + 列表 + 下级钻取」，右侧为「已选列表」；
 * - 选中带子部门的节点时，会自动级联选中所有子部门（提示「下级部门将被同时授权」）；
 * - 支持 disabledOptions：禁用的节点会显示原因后缀且无法勾选。
 *
 * Props 兼容多选 DepartmentSelect：value / onChange / disabledOptions / placeholder / disabled。
 */
import { useEffect, useMemo, useState } from 'react';
import { Modal, Input, Checkbox, Typography, Tooltip, Switch, Button } from '@douyinfe/semi-ui';
import { Building2, ChevronRight, X, ChevronDown, Search, Lock } from 'lucide-react';
import {
  departmentTree,
  getDepartmentName,
  getDepartmentSubtreeIds,
  type DeptTreeNode,
} from '@/mocks/departmentData';
import './index.less';

interface DepartmentPickerProps {
  value?: string[];
  onChange?: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledOptions?: Record<string, string>;
  maxTagCount?: number;
  /** 触发器额外样式 */
  className?: string;
  style?: React.CSSProperties;
}

interface FlatNode {
  node: DeptTreeNode;
  parents: DeptTreeNode[];
}

/** 找到某节点在树中的「父链」路径（从根到该节点的父，不含自身） */
const findParents = (tree: DeptTreeNode[], target: string): DeptTreeNode[] | null => {
  for (const n of tree) {
    if (n.value === target) return [];
    if (n.children) {
      const sub = findParents(n.children, target);
      if (sub) return [n, ...sub];
    }
  }
  return null;
};

/** 扁平化整棵树用于搜索 */
const flattenTree = (tree: DeptTreeNode[], parents: DeptTreeNode[] = []): FlatNode[] => {
  const out: FlatNode[] = [];
  for (const n of tree) {
    out.push({ node: n, parents });
    if (n.children) out.push(...flattenTree(n.children, [...parents, n]));
  }
  return out;
};

const DepartmentTag = ({
  id,
  onRemove,
  disabled,
}: {
  id: string;
  onRemove?: () => void;
  disabled?: boolean;
}) => (
  <span className="dept-picker-tag">
    <span className="dept-picker-tag-avatar">
      <Building2 size={11} strokeWidth={2.2} />
    </span>
    <span className="dept-picker-tag-label">{getDepartmentName(id)}</span>
    {!disabled && onRemove && (
      <span
        className="dept-picker-tag-close"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X size={12} strokeWidth={2.2} />
      </span>
    )}
  </span>
);

const DepartmentPicker = ({
  value = [],
  onChange,
  placeholder = '请选择适用部门',
  disabled,
  disabledOptions,
  maxTagCount = 6,
  className,
  style,
}: DepartmentPickerProps) => {
  const [open, setOpen] = useState(false);
  // 当前导航到的节点路径（栈）；空数组表示根级
  const [pathStack, setPathStack] = useState<DeptTreeNode[]>([]);
  // 弹窗内的暂存选择
  const [draft, setDraft] = useState<string[]>(value);
  const [keyword, setKeyword] = useState('');
  // 是否把所选部门的下级部门一并纳入
  const [includeChildren, setIncludeChildren] = useState(true);

  useEffect(() => {
    if (open) {
      setDraft(value);
      setPathStack([]);
      setKeyword('');
    }
  }, [open]);


  const currentLevel: DeptTreeNode[] = useMemo(() => {
    if (pathStack.length === 0) return departmentTree;
    return pathStack[pathStack.length - 1].children ?? [];
  }, [pathStack]);

  const searchResults = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return null;
    return flattenTree(departmentTree).filter((f) =>
      f.node.label.toLowerCase().includes(kw),
    );
  }, [keyword]);

  const isChecked = (id: string) => draft.includes(id);
  const isDisabled = (id: string) => !!disabledOptions?.[id];

  const toggleNode = (node: DeptTreeNode) => {
    if (isDisabled(node.value)) return;
    // 只 toggle 当前节点本身；子部门的展开仅在激活/保存已激活方案时由系统计算
    const next = new Set(draft);
    if (isChecked(node.value)) next.delete(node.value);
    else next.add(node.value);
    setDraft(Array.from(next));
  };

  const removeFromDraft = (id: string) => {
    setDraft(draft.filter((x) => x !== id));
  };

  /** 展开后的最终结果：开启「包含下级部门」时把每个所选部门的子孙一并纳入 */
  const expandedDraft = useMemo(() => {
    if (!includeChildren) return draft;
    const set = new Set<string>();
    draft.forEach((id) => {
      set.add(id);
      getDepartmentSubtreeIds(id).forEach((sub) => {
        if (!disabledOptions?.[sub]) set.add(sub);
      });
    });
    return Array.from(set);
  }, [draft, includeChildren, disabledOptions]);

  const extraChildrenCount = expandedDraft.length - draft.length;

  const handleConfirm = () => {
    onChange?.(expandedDraft);
    setOpen(false);
  };


  const handleCancel = () => {
    setOpen(false);
  };

  const visibleTags = value.slice(0, maxTagCount);
  const overflowCount = value.length - visibleTags.length;

  const renderRow = (node: DeptTreeNode, parents: DeptTreeNode[] = []) => {
    const hasChildren = !!node.children && node.children.length > 0;
    const checked = isChecked(node.value);
    const disabledReason = disabledOptions?.[node.value];
    const ancestorSelected = parents.some((p) => draft.includes(p.value));
    const drillDisabled = ancestorSelected || checked;
    const drill = hasChildren && !searchResults && (
      drillDisabled ? (
        <Tooltip content="已选择上级部门，下级将自动包含">
          <span
            className="dept-picker-row-drill is-disabled"
            onClick={(e) => e.stopPropagation()}
          >
            下级 <ChevronRight size={14} strokeWidth={2} />
          </span>
        </Tooltip>
      ) : (
        <span
          className="dept-picker-row-drill"
          onClick={(e) => {
            e.stopPropagation();
            setPathStack((s) => [...s, node]);
          }}
        >
          下级 <ChevronRight size={14} strokeWidth={2} />
        </span>
      )
    );
    const row = (
      <div
        key={node.value}
        className={`dept-picker-row ${checked ? 'is-checked' : ''} ${disabledReason ? 'is-disabled' : ''}`}
        onClick={() => toggleNode(node)}
      >
        <span onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={checked}
            disabled={!!disabledReason}
            onChange={() => toggleNode(node)}
          />
        </span>
        <span className="dept-picker-row-avatar">
          <Building2 size={14} strokeWidth={2} />
        </span>
        <span className="dept-picker-row-name">
          {node.label}
          {parents.length > 0 && searchResults && (
            <Typography.Text type="tertiary" size="small" style={{ marginLeft: 8 }}>
              {parents.map((p) => p.label).join(' / ')}
            </Typography.Text>
          )}
        </span>
        {disabledReason && (
          <Tooltip content={disabledReason} position="top">
            <span className="dept-picker-row-lock" onClick={(e) => e.stopPropagation()}>
              <Lock size={12} strokeWidth={2} />
            </span>
          </Tooltip>
        )}
        {drill}
      </div>
    );
    return row;
  };

  return (
    <>
      <div
        className={`dept-picker-trigger ${value.length === 0 ? 'is-empty' : ''} ${disabled ? 'is-disabled' : ''} ${className ?? ''}`}
        style={style}
        onClick={() => !disabled && setOpen(true)}
      >
        {value.length === 0 ? (
          <span className="dept-picker-trigger-placeholder">{placeholder}</span>
        ) : (
          <>
            {visibleTags.map((id) => (
              <DepartmentTag
                key={id}
                id={id}
                disabled={disabled}
                onRemove={() => onChange?.(value.filter((v) => v !== id))}
              />
            ))}
            {overflowCount > 0 && (
              <span className="dept-picker-overflow-tag">+{overflowCount}</span>
            )}
          </>
        )}
        <span className="dept-picker-trigger-arrow">
          <ChevronDown size={14} strokeWidth={2} />
        </span>
      </div>

      <Modal
        className="dept-picker-modal"
        title="选择适用部门"
        visible={open}
        onCancel={handleCancel}
        onOk={handleConfirm}
        okText="确认"
        cancelText="取消"
        width={760}
        centered
        maskClosable={false}
      >
        <div className="dept-picker">
          <div className="dept-picker-left">
            <Input
              prefix={<Search size={14} strokeWidth={2} style={{ marginLeft: 8, color: 'var(--semi-color-text-2)' }} />}
              placeholder="搜索部门名称"
              value={keyword}
              onChange={setKeyword}
              showClear
            />
            <Typography.Text type="tertiary" size="small" style={{ display: 'block', marginTop: 8 }}>
              激活方案时，所选部门的下级部门将自动包含在生效绑定中
            </Typography.Text>
            {!searchResults && (
              <div className="dept-picker-breadcrumb">
                <span
                  className={pathStack.length === 0 ? 'crumb-current' : 'crumb-link'}
                  onClick={() => setPathStack([])}
                >
                  组织架构
                </span>
                {pathStack.map((n, idx) => (
                  <span key={n.value} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span className="crumb-sep">/</span>
                    {idx === pathStack.length - 1 ? (
                      <span className="crumb-current">{n.label}</span>
                    ) : (
                      <span
                        className="crumb-link"
                        onClick={() => setPathStack((s) => s.slice(0, idx + 1))}
                      >
                        {n.label}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
            <div className="dept-picker-list">
              {searchResults ? (
                searchResults.length === 0 ? (
                  <div className="dept-picker-empty">没有匹配的部门</div>
                ) : (
                  searchResults.map((f) => renderRow(f.node, f.parents))
                )
              ) : currentLevel.length === 0 ? (
                <div className="dept-picker-empty">暂无下级部门</div>
              ) : (
                currentLevel.map((n) => renderRow(n, pathStack))
              )}
            </div>
          </div>
          <div className="dept-picker-right">
            <div className="dept-picker-selected-header">
              已选：<strong>{draft.length}</strong>个
              {draft.length > 0 && (
                <span
                  style={{ float: 'right', cursor: 'pointer', color: 'var(--semi-color-link)' }}
                  onClick={() => setDraft([])}
                >
                  清空
                </span>
              )}
            </div>
            <div className="dept-picker-selected-list">
              {draft.length === 0 ? (
                <div className="dept-picker-empty">尚未选择部门</div>
              ) : (
                draft.map((id) => (
                  <div key={id} className="dept-picker-selected-row">
                    <span className="dept-picker-selected-row-avatar">
                      <Building2 size={12} strokeWidth={2} />
                    </span>
                    <span className="dept-picker-selected-row-name">{getDepartmentName(id)}</span>
                    <span className="dept-picker-selected-remove" onClick={() => removeFromDraft(id)}>
                      <X size={14} strokeWidth={2} />
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DepartmentPicker;
