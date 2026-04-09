import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Input } from '@douyinfe/semi-ui';
import SkillCard, { SkillItem } from '../components/SkillCard';
import SkillDetailDrawer from '../components/SkillDetailDrawer';
import FilterPopover, { FilterSection } from '@/components/FilterPopover';
import '../APASkills/index.less';
import { Search } from 'lucide-react';

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
    createdAt: '2025-07-22',
    category: 'orchestration',
    status: 'published',
    dependencies: ['Task Engine', 'Event Bus'],
    versionHistory: [
      { version: '2.1.0', releaseDate: '2026-03-18', changelog: 'Added parallel execution branches with sync barriers', author: 'Peter Yang' },
      { version: '2.0.0', releaseDate: '2026-01-05', changelog: 'Complete rewrite with DAG-based execution model', author: 'Peter Yang' },
      { version: '1.5.0', releaseDate: '2025-10-12', changelog: 'Added conditional branching with expression evaluation', author: 'Peter Yang' },
    ],
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
    createdAt: '2025-09-10',
    category: 'data-integration',
    status: 'published',
    dependencies: ['Scheduler Core', 'Data Connector SDK'],
    versionHistory: [
      { version: '1.6.0', releaseDate: '2026-03-15', changelog: 'Added real-time streaming pipeline support', author: 'Nancy Li' },
      { version: '1.5.0', releaseDate: '2026-01-20', changelog: 'Introduced automatic retry with exponential backoff', author: 'Nancy Li' },
    ],
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
    createdAt: '2025-11-01',
    category: 'analytics',
    status: 'published',
    dependencies: ['Event Log Parser', 'Graph Engine'],
    versionHistory: [
      { version: '1.3.2', releaseDate: '2026-03-10', changelog: 'Fixed bottleneck detection for parallel paths', author: 'George Martin' },
      { version: '1.3.0', releaseDate: '2026-02-05', changelog: 'Added conformance checking against reference models', author: 'George Martin' },
    ],
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
    createdAt: '2025-06-30',
    category: 'scheduling',
    status: 'published',
    dependencies: ['Scheduler Core', 'Resource Manager'],
    versionHistory: [
      { version: '2.0.3', releaseDate: '2026-03-21', changelog: 'Patched race condition in concurrent queue access', author: 'Helen Zhao' },
      { version: '2.0.0', releaseDate: '2026-02-10', changelog: 'Introduced ML-based priority scoring', author: 'Helen Zhao' },
      { version: '1.8.0', releaseDate: '2025-12-01', changelog: 'Added multi-robot workload balancing', author: 'Helen Zhao' },
    ],
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
    createdAt: '2026-01-15',
    category: 'reliability',
    status: 'published',
    dependencies: ['Alert Manager', 'Recovery Engine'],
    versionHistory: [
      { version: '1.1.0', releaseDate: '2026-03-08', changelog: 'Added automated recovery playbooks for common errors', author: 'Steve Rogers' },
      { version: '1.0.0', releaseDate: '2026-01-15', changelog: 'Initial release with rule-based escalation', author: 'Steve Rogers' },
    ],
  },
];

const ACPSkills = () => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState<SkillItem | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);

  const categoryOptions = useMemo(() => {
    const cats = new Set(acpSkillsMockData.map((item) => item.category));
    return Array.from(cats).map((cat) => ({ value: cat, label: cat }));
  }, []);

  const tagOptions = useMemo(() => {
    const allTags = new Set<string>();
    acpSkillsMockData.forEach((item) => item.tags.forEach((tag) => allTags.add(tag)));
    return Array.from(allTags).map((tag) => ({ value: tag, label: tag }));
  }, []);

  const filterSections: FilterSection[] = useMemo(() => [
    {
      key: 'category',
      label: t('sharing.filter.category'),
      type: 'checkbox',
      options: categoryOptions,
      value: categoryFilter,
    },
    {
      key: 'tags',
      label: t('sharing.filter.tags'),
      type: 'checkbox',
      options: tagOptions,
      value: tagsFilter,
    },
  ], [t, categoryFilter, tagsFilter, categoryOptions, tagOptions]);

  const filteredData = acpSkillsMockData.filter((item) => {
    if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase()) &&
      !item.description.toLowerCase().includes(searchText.toLowerCase()) &&
      !item.tags.some((tag) => tag.toLowerCase().includes(searchText.toLowerCase()))) {
      return false;
    }
    if (categoryFilter.length > 0 && !categoryFilter.includes(item.category)) return false;
    if (tagsFilter.length > 0 && !tagsFilter.some((tag) => item.tags.includes(tag))) return false;
    return true;
  });

  const handleCardClick = useCallback((item: SkillItem) => {
    setSelectedItem(item);
    setDrawerVisible(true);
  }, []);

  const handleFilterConfirm = useCallback((values: Record<string, unknown>) => {
    setCategoryFilter(values.category as string[] || []);
    setTagsFilter(values.tags as string[] || []);
  }, []);

  return (
    <div className="skills-page">
      <div className="skills-page-header">
        <Title heading={4} className="title">
          {t('sharing.acpSkills.pageTitle')}
        </Title>
      </div>
      <div className="skills-page-toolbar">
        <Input
          prefix={<Search size={16} strokeWidth={2} />}
          placeholder={t('common.search')}
          value={searchText}
          onChange={setSearchText}
          showClear
          style={{ width: 280 }}
        />
        <FilterPopover
          sections={filterSections}
          visible={filterVisible}
          onVisibleChange={setFilterVisible}
          onConfirm={handleFilterConfirm}
        />
      </div>
      <div className="skills-page-grid">
        {filteredData.map((item) => (
          <SkillCard key={item.id} item={item} onClick={handleCardClick} />
        ))}
      </div>
      <SkillDetailDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        item={selectedItem}
        dataList={filteredData}
        onNavigate={(item) => setSelectedItem(item)}
      />
    </div>
  );
};

export default ACPSkills;
