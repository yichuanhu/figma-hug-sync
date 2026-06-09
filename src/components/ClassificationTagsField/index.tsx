import { useEffect, useMemo, useState } from 'react';
import { Cascader, Button, Spin, Typography, Empty } from '@douyinfe/semi-ui';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import {
  fetchClassificationsForEntity,
  fetchEntityClassifications,
} from '@/mocks/classification/service';
import { findItemPath } from '@/mocks/classification/mockData';
import type {
  BusinessObjectType,
  ClassificationItem,
  ClassificationKey,
} from '@/mocks/classification/types';
import './index.less';

const { Text } = Typography;

/** 字段值：维度 ID -> 已选枚举值 ID（单选；未选为 null） */
export type ClassificationValueMap = Record<string, string | null>;

/** 加载状态 */
export type ClassificationLoadStatus = 'loading' | 'ready' | 'empty' | 'error';

interface Props {
  entityType: BusinessObjectType;
  /** 编辑回填用：传入实体 ID 时会自动拉取已分配分类 */
  entityId?: string;
  value: ClassificationValueMap;
  onChange: (next: ClassificationValueMap) => void;
  /** 仅用于通知父组件状态变化以决定提交按钮 disabled */
  onStatusChange?: (status: ClassificationLoadStatus) => void;
  /** 是否在 ready 状态下要求至少 1 个维度（按 STORY-017 v9 默认 false） */
  required?: boolean;
  /** 父组件触发提交校验后强制显示错误 */
  forceShowError?: boolean;
  /** 只读模式：仅渲染已选标签 */
  readonly?: boolean;
  /** 在 empty 状态下完全隐藏整块（R-11） */
  hideWhenEmpty?: boolean;
}

const PATH_SEP = ' / ';

const totalSelectedCount = (value: ClassificationValueMap): number =>
  Object.values(value).filter((id) => !!id).length;

/** ClassificationItem 树 → Semi Cascader treeData */
const toCascaderData = (items: ClassificationItem[]): any[] =>
  items.map((n) => ({
    value: n.id,
    label: n.name,
    disabled: n.selectable === false,
    children: n.children && n.children.length > 0 ? toCascaderData(n.children) : undefined,
  }));

const ClassificationTagsField = ({
  entityType,
  entityId,
  value,
  onChange,
  onStatusChange,
  required = false,
  forceShowError = false,
  readonly = false,
  hideWhenEmpty = false,
}: Props) => {
  const [keys, setKeys] = useState<ClassificationKey[]>([]);
  const [status, setStatus] = useState<ClassificationLoadStatus>('loading');
  const [reloadTick, setReloadTick] = useState(0);

  // 加载分类维度
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    onStatusChange?.('loading');
    (async () => {
      try {
        const data = await fetchClassificationsForEntity(entityType);
        if (cancelled) return;
        if (data.length === 0) {
          setKeys([]);
          setStatus('empty');
          onStatusChange?.('empty');
        } else {
          setKeys(data);
          setStatus('ready');
          onStatusChange?.('ready');
        }
      } catch {
        if (cancelled) return;
        setKeys([]);
        setStatus('error');
        onStatusChange?.('error');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, reloadTick]);

  // 编辑回填
  useEffect(() => {
    if (!entityId || status !== 'ready') return;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchEntityClassifications(entityType, entityId);
        if (cancelled) return;
        const next: ClassificationValueMap = {};
        list.forEach((item) => {
          if (item.selectedItem) {
            next[item.classificationKeyId] = item.selectedItem.id;
          }
        });
        if (totalSelectedCount(value) === 0 && Object.keys(next).length > 0) {
          onChange(next);
        }
      } catch {
        // 回填失败不影响主流程
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId, status]);

  const selectedCount = useMemo(() => totalSelectedCount(value), [value]);
  const showRequiredError = required && forceShowError && status === 'ready' && selectedCount === 0;

  const handleCascaderChange = (keyId: string, key: ClassificationKey, raw: unknown) => {
    // Semi Cascader 单选返回 string[] 路径；clear 时返回 undefined / []
    let nextId: string | null = null;
    if (Array.isArray(raw) && raw.length > 0) {
      nextId = String(raw[raw.length - 1]);
    } else if (typeof raw === 'string' && raw) {
      nextId = raw;
    }
    onChange({ ...value, [keyId]: nextId });
    // 防止未使用警告
    void key;
  };

  // ============== 只读模式 ==============
  if (readonly) {
    return (
      <ClassificationReadonlyView
        entityType={entityType}
        entityId={entityId}
        value={value}
        keys={keys}
        status={status}
      />
    );
  }

  // ============== 加载中 ==============
  if (status === 'loading') {
    return (
      <div className="classification-tags-field is-loading">
        <Spin />
        <Text type="tertiary" size="small" style={{ marginLeft: 8 }}>
          正在加载分类标签…
        </Text>
      </div>
    );
  }

  // ============== 加载失败 ==============
  if (status === 'error') {
    return (
      <div className="classification-tags-field is-error-state">
        <div className="cls-error-inner">
          <AlertTriangle size={16} strokeWidth={2} />
          <Text type="danger">分类标签暂不可用，可稍后补充</Text>
          <Button
            size="small"
            theme="borderless"
            type="primary"
            icon={<RefreshCw size={14} strokeWidth={2} />}
            onClick={() => setReloadTick((t) => t + 1)}
          >
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  // ============== 无适用分类维度 ==============
  if (status === 'empty') {
    if (hideWhenEmpty) return null;
    return (
      <div className="classification-tags-field is-empty-state">
        <Empty
          image={<Inbox size={36} strokeWidth={1.5} color="var(--semi-color-text-2)" />}
          title={null}
          description={
            <Text type="tertiary" size="small">
              暂无可用分类标签
            </Text>
          }
        />
      </div>
    );
  }

  // ============== 正常 ==============
  return (
    <div
      className={`classification-tags-field is-ready ${showRequiredError ? 'has-error' : ''}`}
      data-classification-anchor
    >
      <div className="cls-header">
        <span className="cls-header-label">
          分类标签
          {required && <span className="cls-required-mark">*</span>}
        </span>
        <Text type="tertiary" size="small" className="cls-header-hint">
          （可选，按业务维度打标，每维度最多选 1 项）
        </Text>
      </div>

      {showRequiredError && (
        <div className="cls-error-banner">
          <AlertTriangle size={14} strokeWidth={2} />
          <span>至少选择一个分类标签</span>
        </div>
      )}

      <div className="cls-key-list">
        {keys.map((key) => {
          const selectedId = value[key.id] ?? null;
          const cascaderValue = selectedId
            ? findItemPath(key.children, selectedId).map((n) => n.id)
            : [];
          return (
            <div key={key.id} className="cls-key-block">
              <div className="cls-key-name">{key.name}</div>
              <Cascader
                treeData={toCascaderData(key.children)}
                value={cascaderValue}
                onChange={(v) => handleCascaderChange(key.id, key, v)}
                changeOnSelect
                showClear
                placeholder="请选择"
                style={{ width: '100%' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============== 只读视图（链路展示） ==============
interface ReadonlyProps {
  entityType: BusinessObjectType;
  entityId?: string;
  value: ClassificationValueMap;
  keys: ClassificationKey[];
  status: ClassificationLoadStatus;
}

const ClassificationReadonlyView = ({
  entityType,
  entityId,
  value,
  keys,
  status,
}: ReadonlyProps) => {
  const [resolved, setResolved] = useState<ClassificationValueMap>(value);
  const [readonlyStatus, setReadonlyStatus] = useState<ClassificationLoadStatus>(status);
  const [readonlyKeys, setReadonlyKeys] = useState<ClassificationKey[]>(keys);

  useEffect(() => {
    let cancelled = false;
    if (status !== 'ready' || !entityId) {
      setReadonlyStatus(status);
      setReadonlyKeys(keys);
      return;
    }
    (async () => {
      try {
        const list = await fetchEntityClassifications(entityType, entityId);
        if (cancelled) return;
        const next: ClassificationValueMap = {};
        list.forEach((item) => {
          if (item.selectedItem) {
            next[item.classificationKeyId] = item.selectedItem.id;
          }
        });
        setResolved(next);
        setReadonlyKeys(keys);
        setReadonlyStatus('ready');
      } catch {
        if (!cancelled) setReadonlyStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId, status, keys]);

  if (readonlyStatus === 'loading') {
    return (
      <div className="classification-tags-field is-readonly is-loading">
        <Spin size="small" />
      </div>
    );
  }
  if (readonlyStatus === 'error') {
    return (
      <div className="classification-tags-field is-readonly">
        <Text type="danger" size="small">
          分类标签加载失败
        </Text>
      </div>
    );
  }
  if (readonlyStatus === 'empty' || readonlyKeys.length === 0) {
    return (
      <div className="classification-tags-field is-readonly">
        <Text type="tertiary" size="small">
          暂无分类标签
        </Text>
      </div>
    );
  }

  const data = entityId ? resolved : value;
  const assignedRows = readonlyKeys
    .map((key) => {
      const id = data[key.id];
      if (!id) return null;
      const path = findItemPath(key.children, id);
      if (path.length === 0) return null;
      return { keyId: key.id, keyName: key.name, pathText: path.map((p) => p.name).join(PATH_SEP) };
    })
    .filter((x): x is { keyId: string; keyName: string; pathText: string } => !!x);

  if (assignedRows.length === 0) {
    return (
      <div className="classification-tags-field is-readonly">
        <Text type="tertiary" size="small">
          暂无分类标签
        </Text>
      </div>
    );
  }

  return (
    <div className="classification-tags-field is-readonly">
      {assignedRows.map((row) => (
        <div key={row.keyId} className="cls-readonly-row">
          <Text type="tertiary" size="small" className="cls-readonly-label">
            {row.keyName}
          </Text>
          <Text className="cls-readonly-value">{row.pathText}</Text>
        </div>
      ))}
    </div>
  );
};

export default ClassificationTagsField;
