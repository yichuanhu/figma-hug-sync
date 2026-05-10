import { useParams, Navigate } from 'react-router-dom';
import AssetDetail from '@/pages/Sharing/Market/AssetDetail';

/**
 * 上架管理详情页（供给侧）
 * 复用 AssetDetail 作为消费者骨架；后续通过 supplyMode 注入差异化按钮组与复用记录非脱敏。
 * 当前阶段：直接复用消费者详情页，避免破坏现有逻辑。
 */
const SupplyAssetDetail = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  if (!type || !id) return <Navigate to="/sharing-center/my-published" replace />;
  return <AssetDetail />;
};

export default SupplyAssetDetail;
