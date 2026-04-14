import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Input, Select } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import SkillCard, { SkillItem } from '../components/SkillCard';
import SkillDetailDrawer from '../components/SkillDetailDrawer';
import FilterPopover, { FilterSection } from '@/components/FilterPopover';
import './index.less';

const { Title } = Typography;

const apaSkillsMockData: SkillItem[] = [
  {
    id: 'apa-001',
    name: 'Email Classification',
    description: 'Automatically classifies incoming emails by topic, sentiment, and priority using NLP models',
    tags: ['NLP', 'email', 'classification'],
    author: 'Maria Garcia',
    version: '2.0.1',
    downloads: 2345,
    rating: 4.7,
    updatedAt: '2026-03-20',
    createdAt: '2025-08-10',
    category: 'text-analysis',
    status: 'published',
    dependencies: ['NLP Engine v3', 'Text Preprocessor'],
    versionHistory: [
      { version: '2.0.1', releaseDate: '2026-03-20', changelog: 'Fixed edge case in multi-language classification', author: 'Maria Garcia' },
      { version: '2.0.0', releaseDate: '2026-02-15', changelog: 'Added support for 12 new languages and improved accuracy by 15%', author: 'Maria Garcia' },
      { version: '1.5.0', releaseDate: '2025-11-20', changelog: 'Introduced priority scoring based on sender history', author: 'Maria Garcia' },
    ],
  },
  {
    id: 'apa-002',
    name: 'Document Extraction',
    description: 'Extracts structured data from unstructured documents including contracts, invoices, and receipts',
    tags: ['extraction', 'document', 'AI'],
    author: 'Tom Harris',
    version: '1.8.0',
    downloads: 1890,
    rating: 4.8,
    updatedAt: '2026-03-17',
    createdAt: '2025-06-05',
    category: 'document-processing',
    status: 'published',
    dependencies: ['OCR Engine', 'Template Matcher'],
    versionHistory: [
      { version: '1.8.0', releaseDate: '2026-03-17', changelog: 'Added receipt parsing with itemized line extraction', author: 'Tom Harris' },
      { version: '1.7.0', releaseDate: '2026-01-10', changelog: 'Improved contract clause detection accuracy', author: 'Tom Harris' },
    ],
  },
  {
    id: 'apa-003',
    name: 'Sentiment Analyzer',
    description: 'Analyzes customer feedback and social media posts for sentiment scoring and trend detection',
    tags: ['sentiment', 'NLP', 'analytics'],
    author: 'Rachel Kim',
    version: '1.5.2',
    downloads: 1456,
    rating: 4.5,
    updatedAt: '2026-03-12',
    createdAt: '2025-09-01',
    category: 'text-analysis',
    status: 'published',
    dependencies: ['NLP Engine v3'],
    versionHistory: [
      { version: '1.5.2', releaseDate: '2026-03-12', changelog: 'Bug fix for emoji-heavy text scoring', author: 'Rachel Kim' },
      { version: '1.5.0', releaseDate: '2026-02-01', changelog: 'Added trend detection over time series data', author: 'Rachel Kim' },
    ],
  },
  {
    id: 'apa-004',
    name: 'Table Structure Recognition',
    description: 'Detects and reconstructs table structures from scanned documents and images',
    tags: ['table', 'OCR', 'structure'],
    author: 'Daniel Foster',
    version: '1.2.0',
    downloads: 876,
    rating: 4.4,
    updatedAt: '2026-03-05',
    createdAt: '2025-12-15',
    category: 'document-processing',
    status: 'published',
    dependencies: ['OCR Engine', 'Image Preprocessor'],
    versionHistory: [
      { version: '1.2.0', releaseDate: '2026-03-05', changelog: 'Support for merged cells and nested tables', author: 'Daniel Foster' },
      { version: '1.1.0', releaseDate: '2026-01-20', changelog: 'Improved detection for rotated table headers', author: 'Daniel Foster' },
    ],
  },
  {
    id: 'apa-005',
    name: 'Intent Recognition Engine',
    description: 'Identifies user intents from natural language inputs for chatbot and automation workflows',
    tags: ['intent', 'NLP', 'chatbot'],
    author: 'Laura White',
    version: '2.3.1',
    downloads: 2100,
    rating: 4.9,
    updatedAt: '2026-03-22',
    createdAt: '2025-05-18',
    category: 'conversational-ai',
    status: 'published',
    dependencies: ['NLP Engine v3', 'Dialog Manager'],
    versionHistory: [
      { version: '2.3.1', releaseDate: '2026-03-22', changelog: 'Hotfix for multi-turn context retention', author: 'Laura White' },
      { version: '2.3.0', releaseDate: '2026-03-10', changelog: 'Added slot-filling for complex intents', author: 'Laura White' },
      { version: '2.0.0', releaseDate: '2025-10-05', changelog: 'Major rewrite with transformer-based architecture', author: 'Laura White' },
    ],
  },
];

const APASkills = () => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState<SkillItem | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);

  const categoryOptions = useMemo(() => {
    const cats = new Set(apaSkillsMockData.map((item) => item.category));
    return Array.from(cats).map((cat) => ({ value: cat, label: cat }));
  }, []);

  const tagOptions = useMemo(() => {
    const allTags = new Set<string>();
    apaSkillsMockData.forEach((item) => item.tags.forEach((tag) => allTags.add(tag)));
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
  ], [t, categoryFilter, categoryOptions]);

  const filteredData = apaSkillsMockData.filter((item) => {
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
  }, []);

  return (
    <div className="skills-page">
      <div className="skills-page-header">
        <Title heading={3} className="title">
          {t('sharing.apaSkills.pageTitle')}
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
        <Select
          placeholder={t('common.filterTags')}
          value={tagsFilter}
          onChange={(v) => setTagsFilter(v as string[])}
          multiple
          showClear
          maxTagCount={1}
          style={{ width: 200 }}
          optionList={tagOptions}
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

export default APASkills;
