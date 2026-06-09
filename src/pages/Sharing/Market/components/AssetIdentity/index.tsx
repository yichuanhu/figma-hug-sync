import { Tag, Typography } from '@douyinfe/semi-ui';
import type { Asset } from '../../types';
import './index.less';

const { Text, Title } = Typography;

type Size = 'sm' | 'md' | 'lg';

interface Props {
  asset: Pick<Asset, 'type' | 'name' | 'displayName' | 'currentVersion'>;
  /** sm: 列表单元格；md: 卡片标题；lg: 详情页 Hero 标题 */
  size?: Size;
  /** 是否截断名称；启用时通过 Tooltip 展示完整内容 */
  ellipsis?: boolean;
  className?: string;
}

/**
 * 资产身份原子（identity）：统一渲染「名称 + 版本徽标」。
 *
 * 流程资产将版本视为身份的一部分（同流程不同版本以独立资产存在，必须一眼区分），
 * 知识资产无版本概念，仅渲染名称。调用方无需再写 isWorkflow 分支。
 */
const AssetIdentity = ({ asset, size = 'md', ellipsis, className }: Props) => {
  const name = asset.displayName || asset.name;
  const isWorkflow = asset.type === 'WORKFLOW';
  const showVersion = isWorkflow && !!asset.currentVersion;

  const NameNode = (() => {
    const ellipsisProp = ellipsis ? { showTooltip: true } : false as const;
    if (size === 'lg') {
      return (
        <Title heading={4} style={{ margin: 0 }} ellipsis={ellipsisProp || undefined} className="ai-name">
          {name}
        </Title>
      );
    }
    return (
      <Text strong ellipsis={ellipsisProp || undefined} className="ai-name">
        {name}
      </Text>
    );
  })();

  return (
    <span className={`asset-identity ai-${size}${className ? ` ${className}` : ''}`}>
      {NameNode}
      {showVersion && (
        <Tag size="small" color="blue" type="light" className="ai-version">
          {asset.currentVersion}
        </Tag>
      )}
    </span>
  );
};

export default AssetIdentity;
