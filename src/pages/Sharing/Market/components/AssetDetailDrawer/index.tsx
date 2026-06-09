import { useMemo } from 'react';
import { Typography, Tag, Space } from '@douyinfe/semi-ui';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { Asset } from '../../types';
import AssetTypeIcon from '../AssetTypeIcon';
import AssetDetail from '../../AssetDetail';

const { Text } = Typography;

const typeToRouteSeg: Record<string, string> = {
  WORKFLOW: 'workflow', KNOWLEDGE: 'knowledge',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  asset: Asset | null;
  /** 当前列表中所有资产（用于抽屉内"上一个/下一个"导航） */
  dataList: Asset[];
  onNavigate: (asset: Asset) => void;
}

const AssetDetailDrawer = ({ visible, onClose, asset, dataList, onNavigate }: Props) => {
  const title = useMemo(() => {
    if (!asset) return '';
    const displayName = asset.displayName || asset.name;
    const showStatusTag = asset.status && asset.status !== 'PUBLISHED';
    return (
      <Space spacing={8} style={{ minWidth: 0 }}>
        <AssetTypeIcon type={asset.type} size={18} />
        <Text strong ellipsis={{ showTooltip: true }} style={{ maxWidth: 560 }}>{displayName}</Text>
        {showStatusTag && <Tag color="orange" type="light" size="small">{asset.status}</Tag>}
      </Space>
    );
  }, [asset]);

  return (
    <DetailDrawerWrapper<Asset>
      visible={visible && !!asset}
      onClose={onClose}
      title={title}
      defaultWidth={900}
      storageKey="assetDetailDrawerWidth"
      dataList={dataList}
      currentId={asset?.id}
      onNavigate={onNavigate}
    >
      <div style={{ padding: 16 }}>
        {asset && (
          <AssetDetail
            embedded
            idOverride={asset.id}
            typeOverride={typeToRouteSeg[asset.type]}
          />
        )}
      </div>
    </DetailDrawerWrapper>
  );
};

export default AssetDetailDrawer;
