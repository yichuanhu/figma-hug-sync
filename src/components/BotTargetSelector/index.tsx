import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Tag, Typography, Tooltip } from '@douyinfe/semi-ui';
import type { ExecutionTargetType } from '@/api';
import { useBotPermissionCheck } from '@/hooks/useBotPermissionCheck';
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

interface BotTargetSelectorProps {
  targetType: ExecutionTargetType | null;
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  botGroups?: BotGroup[];
  bots?: Bot[];
  enablePermissionCheck?: boolean;
}

// 默认 Mock 数据
const defaultBotGroups: BotGroup[] = [
  { id: 'group-001', name: 'Order Processing Group', onlineCount: 3, totalCount: 5 },
  { id: 'group-002', name: 'Finance Approval Group', onlineCount: 2, totalCount: 3 },
  { id: 'group-003', name: 'HR Management Group', onlineCount: 1, totalCount: 2 },
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
  enablePermissionCheck = false,
}: BotTargetSelectorProps) => {
  const { t } = useTranslation();

  // 收集所有需要检查权限的 ID
  const allTargetIds = useMemo(() => {
    if (!enablePermissionCheck || !targetType) return [];
    if (targetType === 'BOT_GROUP') return botGroups.map((g) => g.id);
    return bots.map((b) => b.id);
  }, [enablePermissionCheck, targetType, botGroups, bots]);

  const { permissions } = useBotPermissionCheck(allTargetIds);

  const isDisabled = (id: string) => {
    if (!enablePermissionCheck) return false;
    const perm = permissions.get(id);
    return perm ? !perm.canUse : false;
  };

  // 分组选项（用于 BOT_IN_GROUP）
  const groupedOptions = useMemo(() => {
    if (targetType !== 'BOT_IN_GROUP') return [];
    
    const result: { label: string; children: { value: string; label: string; status: string; noPermission: boolean }[] }[] = [];
    
    botGroups.forEach((group) => {
      const groupBots = bots
        .filter((b) => b.groupId === group.id)
        .map((bot) => ({
          value: bot.id,
          label: bot.name,
          status: bot.status,
          noPermission: isDisabled(bot.id),
        }));
      
      if (groupBots.length > 0) {
        result.push({
          label: group.name,
          children: groupBots,
        });
      }
    });

    return result;
  }, [targetType, botGroups, bots, permissions, enablePermissionCheck]);

  // 渲染已选中值的标签
  const renderSelectedItem = (optionNode: Record<string, any>) => {
    if (!optionNode) return null;

    if (targetType === 'BOT_GROUP') {
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

  // 渲染带权限提示的选项
  const renderOptionWithPermission = (
    name: string,
    statusTag: React.ReactNode,
    noPermission: boolean
  ) => {
    const content = (
      <div className={`bot-target-selector-option ${noPermission ? 'bot-target-selector-option-disabled' : ''}`}>
        <Text className="bot-target-selector-option-name" style={noPermission ? { opacity: 0.45 } : undefined}>
          {name}
        </Text>
        {statusTag}
        {noPermission && (
          <Tag size="small" color="orange" type="light" className="bot-target-selector-option-no-perm">
            {t('collaborator.dispatch.noPermission')}
          </Tag>
        )}
      </div>
    );

    if (noPermission) {
      return (
        <Tooltip content={t('collaborator.dispatch.noPermissionTip')} position="left">
          {content}
        </Tooltip>
      );
    }
    return content;
  };

  if (!targetType) {
    return null;
  }

  // BOT_IN_GROUP - 分组显示
  if (targetType === 'BOT_IN_GROUP') {
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
        {groupedOptions.map((group) => (
          <Select.OptGroup key={group.label} label={group.label}>
            {group.children.map((bot) => (
              <Select.Option key={bot.value} value={bot.value} disabled={bot.noPermission}>
                {renderOptionWithPermission(
                  bot.label,
                  <Tag size="small" color={bot.status === 'ONLINE' ? 'green' : 'grey'} className="bot-target-selector-option-status">
                    {bot.status === 'ONLINE' ? t('botSelector.statusOnline') : t('botSelector.statusOffline')}
                  </Tag>,
                  bot.noPermission
                )}
              </Select.Option>
            ))}
          </Select.OptGroup>
        ))}
      </Select>
    );
  }

  // BOT_GROUP - 机器人组选择
  if (targetType === 'BOT_GROUP') {
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
          const noPermission = isDisabled(group.id);
          return (
            <Select.Option key={group.id} value={group.id} disabled={noPermission}>
              {renderOptionWithPermission(
                group.name,
                <Tag size="small" color={group.onlineCount > 0 ? 'green' : 'grey'} className="bot-target-selector-option-status">
                  {group.onlineCount}/{group.totalCount} {t('botSelector.online')}
                </Tag>,
                noPermission
              )}
            </Select.Option>
          );
        })}
      </Select>
    );
  }

  // UNGROUPED_BOT - 未分组机器人选择
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
        {ungroupedBots.map((bot) => {
          const noPermission = isDisabled(bot.id);
          return (
            <Select.Option key={bot.id} value={bot.id} disabled={noPermission}>
              {renderOptionWithPermission(
                bot.name,
                <Tag size="small" color={bot.status === 'ONLINE' ? 'green' : 'grey'} className="bot-target-selector-option-status">
                  {bot.status === 'ONLINE' ? t('botSelector.statusOnline') : t('botSelector.statusOffline')}
                </Tag>,
                noPermission
              )}
            </Select.Option>
          );
        })}
      </Select>
    );
  }

  return null;
};

export default BotTargetSelector;
