import { useState } from 'react';
import { Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import SubMarketPage from '../SubMarketPage';
import { SkillCategory } from '../types';

const CATEGORIES: Array<SkillCategory | 'all'> = ['all', 'document', 'data', 'content', 'retrieval', 'tool', 'other'];

const SkillMarket = () => {
  const { t } = useTranslation();
  const [category, setCategory] = useState<SkillCategory | 'all'>('all');

  const extraFilter = (list: any[]) =>
    category === 'all' ? list : list.filter((a) => a.skill?.category === category);

  return (
    <SubMarketPage
      type="SKILL"
      titleKey="sharing.market.subTitles.skill"
      lockedSource="NATIVE"
      emptyKey="sharing.market.empty.skill"
      extraFilter={extraFilter}
      toolbarExtra={
        <div className="skill-category-filter">
          <span className="skill-category-label">{t('sharing.market.skill.category')}</span>
          {CATEGORIES.map((c) => (
            <Tag
              key={c}
              size="large"
              color={category === c ? 'blue' : 'white'}
              type={category === c ? 'solid' : 'light'}
              onClick={() => setCategory(c)}
            >
              {t(`sharing.market.skill.categories.${c}`)}
            </Tag>
          ))}
        </div>
      }
    />
  );
};

export default SkillMarket;
