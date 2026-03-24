import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Input } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import SkillCard, { SkillItem } from '../components/SkillCard';
import '../APASkills/index.less';

const { Title } = Typography;

const acpSkillsMockData: SkillItem[] = [
  {
    id: 'acp-001',
    name: 'Workflow Orchestrator',
    description: 'Coordinates complex multi-step automation workflows with conditional branching and error handling',
    tags: ['workflow', 'orchestration', 'automation'],
    author: 'Peter Yang',
    version: '2.1.0',
    downloads: 1678,
    rating: 4.7,
    updatedAt: '2026-03-18',
    category: 'orchestration',
  },
  {
    id: 'acp-002',
    name: 'Data Pipeline Manager',
    description: 'Manages ETL pipelines with scheduling, monitoring, and automatic retry on failure',
    tags: ['ETL', 'pipeline', 'data'],
    author: 'Nancy Li',
    version: '1.6.0',
    downloads: 1234,
    rating: 4.6,
    updatedAt: '2026-03-15',
    category: 'data-integration',
  },
  {
    id: 'acp-003',
    name: 'Process Mining Analyzer',
    description: 'Discovers process patterns from event logs and identifies optimization opportunities',
    tags: ['process-mining', 'analytics', 'optimization'],
    author: 'George Martin',
    version: '1.3.2',
    downloads: 945,
    rating: 4.5,
    updatedAt: '2026-03-10',
    category: 'analytics',
  },
  {
    id: 'acp-004',
    name: 'RPA Task Scheduler',
    description: 'Intelligent task scheduling with resource optimization and priority-based queue management',
    tags: ['scheduler', 'RPA', 'resource'],
    author: 'Helen Zhao',
    version: '2.0.3',
    downloads: 1567,
    rating: 4.8,
    updatedAt: '2026-03-21',
    category: 'scheduling',
  },
  {
    id: 'acp-005',
    name: 'Exception Handler Framework',
    description: 'Configurable exception handling framework with escalation rules and automated recovery',
    tags: ['exception', 'error-handling', 'recovery'],
    author: 'Steve Rogers',
    version: '1.1.0',
    downloads: 789,
    rating: 4.3,
    updatedAt: '2026-03-08',
    category: 'reliability',
  },
];

const ACPSkills = () => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');

  const filteredData = acpSkillsMockData.filter((item) =>
    !searchText || item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.description.toLowerCase().includes(searchText.toLowerCase()) ||
    item.tags.some((tag) => tag.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className="skills-page">
      <div className="skills-page-header">
        <Title heading={4} className="title">
          {t('sharing.acpSkills.pageTitle')}
        </Title>
      </div>
      <div className="skills-page-toolbar">
        <Input
          prefix={<IconSearchStroked />}
          placeholder={t('common.search')}
          value={searchText}
          onChange={setSearchText}
          showClear
          style={{ width: 280 }}
        />
      </div>
      <div className="skills-page-grid">
        {filteredData.map((item) => (
          <SkillCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default ACPSkills;
