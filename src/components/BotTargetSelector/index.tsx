import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Tag, Typography, Cascader } from '@douyinfe/semi-ui';
import { IconHome } from '@douyinfe/semi-icons';
import type { ExecutionTargetType } from '@/api';
import './index.less';

const { Text } = Typography;

interface BotGroup {
  id: string;
  name: string;
  onlineCount: number;
  totalCount: number;
}

interface Bot {
  id: string;
  name: string;
  groupId: string | null;
  status: 'ONLINE' | 'OFFLINE';
}

// 新的执行目标类型：流程机器人组 | 指定流程机器人
export type NewExecutionTargetType = 'PROCESS_BOT_GROUP' | 'SPECIFIED_PROCESS_BOT';

interface BotTargetSelectorProps {
  targetType: ExecutionTargetType | NewExecutionTargetType | null;
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  botGroups?: BotGroup[];
  bots?: Bot[];
}

// 默认 Mock 数据
const defaultBotGroups: BotGroup[] = [
  { id: 'group-001', name: '订单处理组', onlineCount: 3, totalCount: 5 },
  { id: 'group-002', name: '财务审批组', onlineCount: 2, totalCount: 3 },
  { id: 'group-003', name: '人事管理组', onlineCount: 1, totalCount: 2 },
];

const defaultBots: Bot[] = [
  { id: 'bot-001', name: 'RPA-BOT-001', groupId: 'group-001', status: 'ONLINE' },
  { id: 'bot-002', name: 'RPA-BOT-002', groupId: 'group-001', status: 'OFFLINE' },
  { id: 'bot-003', name: 'RPA-BOT-003', groupId: 'group-001', status: 'ONLINE' },
  { id: 'bot-004', name: 'RPA-BOT-004', groupId: 'group-002', status: 'ONLINE' },
  { id: 'bot-005', name: 'RPA-BOT-005', groupId: 'group-002', status: 'OFFLINE' },
  { id: 'bot-006', name: 'RPA-BOT-006', groupId: 'group-003', status: 'ONLINE' },
  { id: 'bot-007', name: 'RPA-BOT-007', groupId: null, status: 'ONLINE' },
  { id: 'bot-008', name: 'RPA-BOT-008', groupId: null, status: 'OFFLINE' },
  { id: 'bot-009', name: 'RPA-BOT-009', groupId: null, status: 'ONLINE' },
];

const BotTargetSelector = ({
  targetType,
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  botGroups = defaultBotGroups,
  bots = defaultBots,
}: BotTargetSelectorProps) => {
  const { t } = useTranslation();

  // 级联选择的数据（用于 SPECIFIED_PROCESS_BOT）
  const cascaderData = useMemo(() => {
    if (targetType !== 'SPECIFIED_PROCESS_BOT') return [];

    const result: any[] = [];

    // 未分组机器人
    const ungroupedBots = bots.filter((b) => !b.groupId);
    if (ungroupedBots.length > 0) {
      result.push({
        value: '__UNGROUPED__',
        label: t('botSelector.ungrouped'),
        icon: <IconHome size="small" style={{ marginRight: 6, color: 'var(--semi-color-text-2)' }} />,
        children: ungroupedBots.map((bot) => ({
          value: bot.id,
          label: bot.name,
          status: bot.status,
        })),
      });
    }

    // 分组机器人
    botGroups.forEach((group) => {
      const groupBots = bots.filter((b) => b.groupId === group.id);
      if (groupBots.length > 0) {
        result.push({
          value: group.id,
          label: group.name,
          icon: <IconHome size="small" style={{ marginRight: 6, color: 'var(--semi-color-text-2)' }} />,
          children: groupBots.map((bot) => ({
            value: bot.id,
            label: bot.name,
            status: bot.status,
          })),
        });
      }
    });

    return result;
  }, [targetType, botGroups, bots, t]);

  // 从 value 中解析级联路径
  const cascaderValue = useMemo(() => {
    if (targetType !== 'SPECIFIED_PROCESS_BOT' || !value) return undefined;
    // 查找机器人所属的分组
    const bot = bots.find((b) => b.id === value);
    if (bot) {
      if (bot.groupId) {
        return [bot.groupId, bot.id];
      } else {
        return ['__UNGROUPED__', bot.id];
      }
    }
    return undefined;
  }, [targetType, value, bots]);

  // 渲染已选中值的标签（Select）
  const renderSelectedItem = (optionNode: Record<string, any>) => {
    if (!optionNode) return null;

    // 流程机器人组
    if (targetType === 'BOT_GROUP' || targetType === 'PROCESS_BOT_GROUP') {
      const group = botGroups.find((g) => g.id === optionNode.value);
      if (group) {
        return (
          <div className="bot-target-selector-selected">
            <Text>{group.name}</Text>
            <Tag 
              size="small" 
              color={group.onlineCount > 0 ? 'green' : 'grey'}
            >
              {group.onlineCount}/{group.totalCount} {t('botSelector.online')}
            </Tag>
          </div>
        );
      }
    }

    // 指定机器人（旧版）
    if (targetType === 'BOT_IN_GROUP' || targetType === 'UNGROUPED_BOT') {
      const bot = bots.find((b) => b.id === optionNode.value);
      if (bot) {
        return (
          <div className="bot-target-selector-selected">
            <Text>{bot.name}</Text>
            <Tag 
              size="small" 
              color={bot.status === 'ONLINE' ? 'green' : 'grey'}
            >
              {bot.status === 'ONLINE' ? t('botSelector.statusOnline') : t('botSelector.statusOffline')}
            </Tag>
          </div>
        );
      }
    }

    return optionNode.label || '';
  };

  // 渲染级联选择的项（显示状态标签）
  const renderCascaderOption = (option: any) => {
    // 如果是分组节点，显示图标和名称
    if (option.children) {
      return (
        <div className="bot-target-selector-cascader-group">
          {option.icon}
          <span>{option.label}</span>
        </div>
      );
    }
    // 机器人节点，显示状态标签
    return (
      <div className="bot-target-selector-cascader-option">
        <Text className="bot-target-selector-cascader-option-name">{option.label}</Text>
        <Tag 
          size="small" 
          color={option.status === 'ONLINE' ? 'green' : 'grey'}
          className="bot-target-selector-cascader-option-status"
        >
          {option.status === 'ONLINE' ? t('botSelector.statusOnline') : t('botSelector.statusOffline')}
        </Tag>
      </div>
    );
  };

  // 级联选择的显示渲染
  const displayRender = (selectedPath: string[]) => {
    if (!selectedPath || selectedPath.length < 2) return '';
    const botId = selectedPath[1];
    const bot = bots.find((b) => b.id === botId);
    if (bot) {
      return (
        <div className="bot-target-selector-selected">
          <Text>{bot.name}</Text>
          <Tag 
            size="small" 
            color={bot.status === 'ONLINE' ? 'green' : 'grey'}
          >
            {bot.status === 'ONLINE' ? t('botSelector.statusOnline') : t('botSelector.statusOffline')}
          </Tag>
        </div>
      );
    }
    return selectedPath.join(' / ');
  };

  if (!targetType) {
    return null;
  }

  // SPECIFIED_PROCESS_BOT - 指定流程机器人（级联选择）
  if (targetType === 'SPECIFIED_PROCESS_BOT') {
    return (
      <Cascader
        className={`bot-target-selector bot-target-selector-cascader ${className || ''}`}
        treeData={cascaderData}
        value={cascaderValue}
        onChange={(val) => {
          const path = val as string[];
          if (path && path.length >= 2) {
            onChange?.(path[1]); // 返回机器人 ID
          }
        }}
        placeholder={placeholder || t('botSelector.placeholderSpecified')}
        disabled={disabled}
        style={{ width: '100%' }}
        displayRender={displayRender}
        onListRender={(list) => (
          <div className="bot-target-selector-cascader-list">
            {list.map((item, index) => (
              <div key={index} className="bot-target-selector-cascader-column">
                {item}
              </div>
            ))}
          </div>
        )}
        renderOption={renderCascaderOption}
      />
    );
  }

  // PROCESS_BOT_GROUP / BOT_GROUP - 流程机器人组选择
  if (targetType === 'BOT_GROUP' || targetType === 'PROCESS_BOT_GROUP') {
    return (
      <Select
        className={`bot-target-selector ${className || ''}`}
        value={value}
        onChange={(v) => onChange?.(v as string)}
        placeholder={placeholder || t('botSelector.placeholder')}
        disabled={disabled}
        filter
        style={{ width: '100%' }}
        renderSelectedItem={renderSelectedItem}
      >
        {botGroups.map((group) => (
          <Select.Option key={group.id} value={group.id}>
            <div className="bot-target-selector-option">
              <Text className="bot-target-selector-option-name">{group.name}</Text>
              <Tag 
                size="small" 
                color={group.onlineCount > 0 ? 'green' : 'grey'}
                className="bot-target-selector-option-status"
              >
                {group.onlineCount}/{group.totalCount} {t('botSelector.online')}
              </Tag>
            </div>
          </Select.Option>
        ))}
      </Select>
    );
  }

  // BOT_IN_GROUP - 分组机器人选择（旧版，保持兼容）
  if (targetType === 'BOT_IN_GROUP') {
    const groupedBots = bots.filter((b) => b.groupId);
    return (
      <Select
        className={`bot-target-selector ${className || ''}`}
        value={value}
        onChange={(v) => onChange?.(v as string)}
        placeholder={placeholder || t('botSelector.placeholder')}
        disabled={disabled}
        filter
        style={{ width: '100%' }}
        renderSelectedItem={renderSelectedItem}
      >
        {botGroups.map((group) => {
          const groupBots = groupedBots.filter((b) => b.groupId === group.id);
          if (groupBots.length === 0) return null;
          return (
            <Select.OptGroup key={group.id} label={group.name}>
              {groupBots.map((bot) => (
                <Select.Option key={bot.id} value={bot.id}>
                  <div className="bot-target-selector-option">
                    <Text className="bot-target-selector-option-name">{bot.name}</Text>
                    <Tag 
                      size="small" 
                      color={bot.status === 'ONLINE' ? 'green' : 'grey'}
                      className="bot-target-selector-option-status"
                    >
                      {bot.status === 'ONLINE' ? t('botSelector.statusOnline') : t('botSelector.statusOffline')}
                    </Tag>
                  </div>
                </Select.Option>
              ))}
            </Select.OptGroup>
          );
        })}
      </Select>
    );
  }

  // UNGROUPED_BOT - 未分组机器人选择（旧版，保持兼容）
  if (targetType === 'UNGROUPED_BOT') {
    const ungroupedBots = bots.filter((b) => !b.groupId);
    return (
      <Select
        className={`bot-target-selector ${className || ''}`}
        value={value}
        onChange={(v) => onChange?.(v as string)}
        placeholder={placeholder || t('botSelector.placeholder')}
        disabled={disabled}
        filter
        style={{ width: '100%' }}
        renderSelectedItem={renderSelectedItem}
      >
        {ungroupedBots.map((bot) => (
          <Select.Option key={bot.id} value={bot.id}>
            <div className="bot-target-selector-option">
              <Text className="bot-target-selector-option-name">{bot.name}</Text>
              <Tag 
                size="small" 
                color={bot.status === 'ONLINE' ? 'green' : 'grey'}
                className="bot-target-selector-option-status"
              >
                {bot.status === 'ONLINE' ? t('botSelector.statusOnline') : t('botSelector.statusOffline')}
              </Tag>
            </div>
          </Select.Option>
        ))}
      </Select>
    );
  }

  return null;
};

export default BotTargetSelector;
