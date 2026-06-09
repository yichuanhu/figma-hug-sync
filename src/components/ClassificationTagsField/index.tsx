import { useEffect, useMemo, useState } from 'react';
import { TreeSelect, Button, Spin, Typography, Empty } from '@douyinfe/semi-ui';
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

/** 字段值：维度 ID -> 已选枚举值 ID 列表（多选；可跨层级） */
export type ClassificationValueMap = Record<string, string[]>;

/** 加载状态 */
export type ClassificationLoadStatus = 'loading' | 'ready' | 'empty' | 'error';

interface Props {
  entityType: BusinessObjectType;
  entityId?: string;
  value: ClassificationValueMap;
  onChange: (next: ClassificationValueMap) => void;
  onStatusChange?: (status: ClassificationLoadStatus) => void;
  required?: boolean;
  forceShowError?: boolean;
  readonly?: boolean;
  /** 在 empty 状态下完全隐藏整块（R-11） */
  hideWhenEmpty?: boolean;
}

const PATH_SEP = ' / ';

const totalSelectedCount = (value: ClassificationValueMap): number =>
  Object.values(value).reduce((sum, ids) => sum + (ids?.length ?? 0), 0);

/** ClassificationItem 树 → Semi TreeSelect treeData */
const toTreeData = (items: ClassificationItem[]): any[] =>
  items.map((n) => ({
    key: n.id,
    value: n.id,
    label: n.name,
    disabled: n.selectable === false,
    children: n.children && n.children.length > 0 ? toTreeData(n.children) : undefined,
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
          if (item.selectedItems && item.selectedItems.length > 0) {
            next[item.classificationKeyId] = item.selectedItems.map((s) => s.id);
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

  /** Semi Cascader multiple 模式返回 string[][]（每条为路径数组） */
  const handleCascaderChange = (key: ClassificationKey, raw: unknown) => {
    let ids: string[] = [];
    if (Array.isArray(raw)) {
      ids = (raw as Array<unknown>)
        .map((entry) => {
          if (Array.isArray(entry) && entry.length > 0) return String(entry[entry.length - 1]);
          if (typeof entry === 'string' || typeof entry === 'number') return String(entry);
          return '';
        })
        .filter((id) => !!id);
      // 去重
      ids = Array.from(new Set(ids));
    }
    const next = { ...value };
    if (ids.length === 0) delete next[key.id];
    else next[key.id] = ids;
    onChange(next);
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
          （可选，每个维度可多选；一级或二级枚举值均可选择）
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
          const raw = value[key.id];
          const ids: string[] = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];

          // 单层维度（children 全为叶子，无 grandchildren）：Cascader 也能渲染
          const cascaderValue: string[][] = ids
            .map((id) => findItemPath(key.children, id).map((n) => n.id))
            .filter((arr) => arr.length > 0);
          return (
            <div key={key.id} className="cls-key-block">
              <div className="cls-key-name">{key.name}</div>
              <Cascader
                multiple
                treeData={toCascaderData(key.children)}
                value={cascaderValue as unknown as any}
                onChange={(v) => handleCascaderChange(key, v)}
                changeOnSelect
                showClear
                leafOnly={false}
                placeholder="请选择"
                style={{ width: '100%' }}
                maxTagCount={6}
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
          if (item.selectedItems && item.selectedItems.length > 0) {
            next[item.classificationKeyId] = item.selectedItems.map((s) => s.id);
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
      const raw = data[key.id];
      const ids: string[] = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];

      const paths = ids
        .map((id) => findItemPath(key.children, id))
        .filter((p) => p.length > 0)
        .map((p) => p.map((n) => n.name).join(PATH_SEP));
      if (paths.length === 0) return null;
      return { keyId: key.id, keyName: key.name, paths };
    })
    .filter((x): x is { keyId: string; keyName: string; paths: string[] } => !!x);

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
          <div className="cls-readonly-value">
            {row.paths.map((p, i) => (
              <span key={i} className="cls-readonly-tag">
                {p}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClassificationTagsField;
