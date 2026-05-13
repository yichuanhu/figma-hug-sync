/**
 * 配置历史抽屉（只读）
 *
 * - 列出历史版本（v1 不可回滚，仅查看）
 * - 当前版本不在历史中
 */
import { useEffect, useState } from 'react';
import { Empty, Tag, Typography, Spin } from '@douyinfe/semi-ui';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import { fetchConfigHistory, type ConfigHistoryItem } from '../../mockData';

const { Text, Title } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ConfigHistoryDrawer = ({ visible, onClose }: Props) => {
  const [list, setList] = useState<ConfigHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<ConfigHistoryItem | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchConfigHistory()
      .then((d) => {
        setList(d);
        setActive(d[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <DetailDrawerWrapper visible={visible} onClose={onClose} title="配置历史" width={900}>
      {loading ? (
        <Spin />
      ) : list.length === 0 ? (
        <Empty description="暂无历史版本" />
      ) : (
        <div style={{ display: 'flex', gap: 16, height: '100%' }}>
          <div style={{ width: 200, borderRight: '1px solid var(--semi-color-border)', paddingRight: 12, overflow: 'auto' }}>
            {list.map((h) => (
              <div
                key={h.version}
                onClick={() => setActive(h)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 4,
                  background: active?.version === h.version ? 'var(--semi-color-fill-0)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>v{h.version}</Text>
                  {h.version === 1 && <Tag size="small" color="blue" type="light">初始</Tag>}
                </div>
                <Text type="tertiary" size="small" style={{ display: 'block' }}>
                  {new Date(h.updated_at).toLocaleString()}
                </Text>
                <Text type="tertiary" size="small">{h.updated_by}</Text>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {active && (
              <>
                <Title heading={6} style={{ marginTop: 0 }}>v{active.version} 快照（只读）</Title>
                <Text type="tertiary" size="small">
                  {new Date(active.updated_at).toLocaleString()}　·　{active.updated_by}
                </Text>
                <pre
                  style={{
                    marginTop: 12,
                    padding: 12,
                    background: 'var(--semi-color-fill-0)',
                    borderRadius: 6,
                    fontSize: 12,
                    overflow: 'auto',
                    maxHeight: 'calc(100vh - 240px)',
                  }}
                >
                  {JSON.stringify(active.snapshot, null, 2)}
                </pre>
              </>
            )}
          </div>
        </div>
      )}
    </DetailDrawerWrapper>
  );
};

export default ConfigHistoryDrawer;
