import { Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { Bot, CalendarClock, CheckSquare, Shield } from 'lucide-react';
import type { NotificationCategory } from '@/pages/NotificationCenter/types';

const iconMap: Record<NotificationCategory, typeof CheckSquare> = {
  task: CheckSquare,
  robot: Bot,
  trigger: CalendarClock,
  license: Shield,
};

const colorMap: Record<NotificationCategory, 'blue' | 'orange' | 'cyan' | 'violet'> = {
  task: 'blue',
  robot: 'orange',
  trigger: 'cyan',
  license: 'violet',
};

interface Props {
  category: NotificationCategory;
}

const CategoryBadge = ({ category }: Props) => {
  const { t } = useTranslation();
  const Icon = iconMap[category];
  return (
    <Tag
      size="small"
      color={colorMap[category]}
      prefixIcon={<Icon size={12} strokeWidth={2} />}
    >
      {t(`notificationCenter.category.${category}`)}
    </Tag>
  );
};

export default CategoryBadge;
