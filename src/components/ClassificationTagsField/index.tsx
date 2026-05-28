import { useEffect, useMemo, useState } from 'react';
import { Checkbox, CheckboxGroup, Button, Spin, Typography, Empty } from '@douyinfe/semi-ui';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import {
  fetchClassificationsForEntity,
  fetchEntityClassifications,
} from '@/mocks/classification/service';
import type {
  BusinessObjectType,
  ClassificationKey,
} from '@/mocks/classification/types';
import './index.less';

const { Text } = Typography;

/** 字段值：键 ID -> 已选值 ID 列表 */
export type ClassificationValueMap = Record<string, string[]>;

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
  /** 是否在 ready 状态下要求至少 1 个标签 */
  required?: boolean;
  /** 父组件触发提交校验后强制显示错误 */
  forceShowError?: boolean;
  /** 只读模式：仅渲染已选标签 */
  readonly?: boolean;
}

const totalSelectedCount = (value: ClassificationValueMap): number =>
  Object.values(value).reduce((sum, ids) => sum + (ids?.length ?? 0), 0);

const ClassificationTagsField = ({
  entityType,
  entityId,
  value,
  onChange,
  onStatusChange,
  required = true,
  forceShowError = false,
  readonly = false,
}: Props) => {
  const [keys, setKeys] = useState<ClassificationKey[]>([]);
  const [status, setStatus] = useState<ClassificationLoadStatus>('loading');
  const [reloadTick, setReloadTick] = useState(0);

  // 加载分类键
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
          next[item.classificationKeyId] = item.values.map((v) => v.id);
        });
        // 仅在父端尚未填充时回填，避免覆盖用户已操作内容
        if (totalSelectedCount(value) === 0 && Object.keys(next).length > 0) {
          onChange(next);
        }
      } catch {
        // 回填失败不影响主流程，保持空选择
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId, status]);

  const selectedCount = useMemo(() => totalSelectedCount(value), [value]);
  const showRequiredError = required && forceShowError && status === 'ready' && selectedCount === 0;

  const handleGroupChange = (keyId: string, vals: Array<string | number>) => {
    onChange({ ...value, [keyId]: vals.map((v) => String(v)) });
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
          <Text type="danger">分类标签加载失败，请稍后重试</Text>
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

  // ============== 无适用分类键 ==============
  if (status === 'empty') {
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
          {selectedCount > 0
            ? `（已选择 ${selectedCount} 个标签）`
            : required
              ? '（至少选择 1 个标签）'
              : '（可选，按业务维度打标）'}
        </Text>
      </div>

      {showRequiredError && (
        <div className="cls-error-banner">
          <AlertTriangle size={14} strokeWidth={2} />
          <span>至少选择一个分类标签</span>
        </div>
      )}

      <div className="cls-key-list">
        {keys.map((key) => (
          <div key={key.id} className="cls-key-block">
            <div className="cls-key-name">{key.name}</div>
            <CheckboxGroup
              direction="horizontal"
              value={value[key.id] ?? []}
              onChange={(vals) => handleGroupChange(key.id, vals as Array<string | number>)}
            >
              {key.values.map((v) => (
                <Checkbox key={v.id} value={v.id}>
                  {v.name}
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============== 只读视图：复用同一组件，避免外部多导出 ==============
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

  // 若由父组件传入 entityId 且 keys 已就绪，则拉取已分配分类
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
          next[item.classificationKeyId] = item.values.map((v) => v.id);
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

  return (
    <div className="classification-tags-field is-readonly">
      {readonlyKeys.map((key) => {
        const ids = data[key.id] ?? [];
        const names = ids
          .map((id) => key.values.find((v) => v.id === id)?.name)
          .filter((n): n is string => !!n);
        return (
          <div key={key.id} className="cls-readonly-row">
            <Text type="tertiary" size="small" className="cls-readonly-label">
              {key.name}
            </Text>
            <Text className="cls-readonly-value">
              {names.length > 0 ? names.join('、') : '—'}
            </Text>
          </div>
        );
      })}
    </div>
  );
};

export default ClassificationTagsField;
