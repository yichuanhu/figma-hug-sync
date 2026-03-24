import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Input } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import SkillCard, { SkillItem } from '../components/SkillCard';
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
    category: 'text-analysis',
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
    category: 'document-processing',
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
    category: 'text-analysis',
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
    category: 'document-processing',
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
    category: 'conversational-ai',
  },
];

const APASkills = () => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');

  const filteredData = apaSkillsMockData.filter((item) =>
    !searchText || item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.description.toLowerCase().includes(searchText.toLowerCase()) ||
    item.tags.some((tag) => tag.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className="skills-page">
      <div className="skills-page-header">
        <Title heading={4} className="title">
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
      </div>
      <div className="skills-page-grid">
        {filteredData.map((item) => (
          <SkillCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default APASkills;
