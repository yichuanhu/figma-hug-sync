import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Input, Card, Tag, Space } from '@douyinfe/semi-ui';
import { Eye, Search, Star } from 'lucide-react';
import ShowcaseDetailDrawer, { ShowcaseItem } from './components/ShowcaseDetailDrawer';
import FilterPopover, { FilterSection } from '@/components/FilterPopover';
import './index.less';

const { Title, Text, Paragraph } = Typography;

const showcasesMockData: ShowcaseItem[] = [
  {
    id: 'case-001',
    name: 'Finance Month-End Closing Automation',
    description: 'Automated the entire month-end financial closing process including journal entries, reconciliation, and report generation, reducing cycle time from 5 days to 1 day',
    tags: ['finance', 'automation', 'reporting'],
    author: 'John Smith',
    department: 'Finance',
    views: 3456,
    rating: 4.9,
    updatedAt: '2026-03-20',
    createdAt: '2025-08-10',
    coverColor: 'var(--semi-color-primary)',
    status: 'published',
    technologies: ['Creator', 'APA', 'SAP Connector'],
    highlights: [
      'Reduced month-end closing cycle from 5 days to 1 day',
      'Automated 95% of journal entry postings',
      'Real-time reconciliation dashboard with exception alerts',
      'Seamless integration with SAP ERP and Oracle Financials',
    ],
    versionHistory: [
      { version: '3.0', releaseDate: '2026-03-20', author: 'John Smith', changelog: 'Added multi-currency reconciliation and regulatory compliance checks' },
      { version: '2.0', releaseDate: '2025-12-05', author: 'John Smith', changelog: 'Introduced automated journal entry validation and approval workflow' },
      { version: '1.0', releaseDate: '2025-08-10', author: 'John Smith', changelog: 'Initial release with basic closing automation and report generation' },
    ],
  },
  {
    id: 'case-002',
    name: 'Order Processing Pipeline',
    description: 'End-to-end order processing from email intake to ERP entry with automatic validation, duplicate detection, and exception routing',
    tags: ['order', 'pipeline', 'ERP'],
    author: 'Sarah Chen',
    department: 'Operations',
    views: 2890,
    rating: 4.8,
    updatedAt: '2026-03-18',
    createdAt: '2025-09-15',
    coverColor: 'var(--semi-color-success)',
    status: 'published',
    technologies: ['APA', 'Email Parser', 'ERP Connector'],
    highlights: [
      'Processes 500+ orders daily with 99.5% accuracy',
      'Intelligent duplicate detection reduces data errors by 80%',
      'Automatic exception routing to specialized teams',
    ],
    versionHistory: [
      { version: '2.5', releaseDate: '2026-03-18', author: 'Sarah Chen', changelog: 'Added intelligent priority scoring and express order fast-track' },
      { version: '2.0', releaseDate: '2026-01-10', author: 'Sarah Chen', changelog: 'Introduced duplicate detection engine and batch processing mode' },
      { version: '1.0', releaseDate: '2025-09-15', author: 'Sarah Chen', changelog: 'Initial email-to-ERP order pipeline with basic validation' },
    ],
  },
  {
    id: 'case-003',
    name: 'Employee Onboarding Workflow',
    description: 'Streamlined new hire onboarding with automated account provisioning, document collection, and training schedule assignment across HR and IT systems',
    tags: ['HR', 'onboarding', 'workflow'],
    author: 'Michael Lee',
    department: 'Human Resources',
    views: 2134,
    rating: 4.7,
    updatedAt: '2026-03-15',
    createdAt: '2025-07-20',
    coverColor: 'var(--semi-color-warning)',
    status: 'published',
    technologies: ['Creator', 'Active Directory', 'Workday'],
    highlights: [
      'Reduced onboarding time from 3 days to 4 hours',
      'Automated provisioning across 12 enterprise systems',
      'Self-service portal for new hires to track progress',
    ],
    versionHistory: [
      { version: '2.0', releaseDate: '2026-03-15', author: 'Michael Lee', changelog: 'Added self-service portal and multi-department onboarding tracks' },
      { version: '1.0', releaseDate: '2025-07-20', author: 'Michael Lee', changelog: 'Initial automated onboarding with account provisioning and document collection' },
    ],
  },
  {
    id: 'case-004',
    name: 'Invoice Reconciliation Bot',
    description: 'Matches purchase orders, goods receipts, and invoices automatically with three-way matching logic and discrepancy reporting',
    tags: ['invoice', 'reconciliation', 'matching'],
    author: 'Emily Wang',
    department: 'Accounts Payable',
    views: 1876,
    rating: 4.6,
    updatedAt: '2026-03-10',
    createdAt: '2025-10-01',
    coverColor: 'var(--semi-color-tertiary)',
    status: 'published',
    technologies: ['APA', 'OCR Engine', 'SAP Connector'],
    highlights: [
      'Three-way matching with 98% accuracy',
      'Processes 1,000+ invoices per day',
      'Automated discrepancy escalation with audit trail',
    ],
    versionHistory: [
      { version: '1.5', releaseDate: '2026-03-10', author: 'Emily Wang', changelog: 'Enhanced OCR accuracy and added multi-format invoice support' },
      { version: '1.0', releaseDate: '2025-10-01', author: 'Emily Wang', changelog: 'Initial three-way matching bot with basic reconciliation' },
    ],
  },
  {
    id: 'case-005',
    name: 'Customer Service Ticket Router',
    description: 'AI-powered ticket classification and routing system that assigns support tickets to the right team based on content analysis and priority scoring',
    tags: ['customer-service', 'AI', 'routing'],
    author: 'David Park',
    department: 'Customer Support',
    views: 1543,
    rating: 4.5,
    updatedAt: '2026-03-05',
    createdAt: '2025-11-12',
    coverColor: 'var(--semi-color-danger)',
    status: 'published',
    technologies: ['ACP', 'NLP Engine', 'Zendesk API'],
    highlights: [
      'AI classification accuracy of 94%',
      'Reduced average routing time from 15 minutes to 30 seconds',
      'Dynamic priority scoring based on customer tier and issue severity',
    ],
    versionHistory: [
      { version: '1.2', releaseDate: '2026-03-05', author: 'David Park', changelog: 'Added sentiment analysis and VIP customer auto-escalation' },
      { version: '1.0', releaseDate: '2025-11-12', author: 'David Park', changelog: 'Initial AI-powered ticket classification and team routing' },
    ],
  },
];

const Showcases = () => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShowcaseItem | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);

  const departmentOptions = useMemo(() => {
    const deps = new Set(showcasesMockData.map((item) => item.department));
    return Array.from(deps).map((dep) => ({ value: dep, label: dep }));
  }, []);

  const tagOptions = useMemo(() => {
    const allTags = new Set<string>();
    showcasesMockData.forEach((item) => item.tags.forEach((tag) => allTags.add(tag)));
    return Array.from(allTags).map((tag) => ({ value: tag, label: tag }));
  }, []);

  const filterSections: FilterSection[] = useMemo(() => [
    {
      key: 'department',
      label: t('sharing.filter.department'),
      type: 'checkbox',
      options: departmentOptions,
      value: departmentFilter,
    },
    {
      key: 'tags',
      label: t('sharing.filter.tags'),
      type: 'checkbox',
      options: tagOptions,
      value: tagsFilter,
    },
  ], [t, departmentFilter, tagsFilter, departmentOptions, tagOptions]);

  const filteredData = showcasesMockData.filter((item) => {
    if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase()) &&
      !item.description.toLowerCase().includes(searchText.toLowerCase()) &&
      !item.tags.some((tag) => tag.toLowerCase().includes(searchText.toLowerCase()))) {
      return false;
    }
    if (departmentFilter.length > 0 && !departmentFilter.includes(item.department)) return false;
    if (tagsFilter.length > 0 && !tagsFilter.some((tag) => item.tags.includes(tag))) return false;
    return true;
  });

  const handleCardClick = useCallback((item: ShowcaseItem) => {
    setSelectedItem(item);
    setDrawerVisible(true);
  }, []);

  const handleFilterConfirm = useCallback((values: Record<string, unknown>) => {
    setDepartmentFilter(values.department as string[] || []);
    setTagsFilter(values.tags as string[] || []);
  }, []);

  return (
    <div className="showcases-page">
      <div className="showcases-page-header">
        <Title heading={4} className="title">
          {t('sharing.showcases.pageTitle')}
        </Title>
      </div>
      <div className="showcases-page-toolbar">
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
      <div className="showcases-page-grid">
        {filteredData.map((item) => (
          <div key={item.id} className="showcase-card-wrapper" onClick={() => handleCardClick(item)}>
          <Card className="showcase-card">
            <div className="showcase-card-cover" style={{ '--cover-color': item.coverColor } as React.CSSProperties}>
              <Text strong className="showcase-card-name">{item.name}</Text>
            </div>
            <div className="showcase-card-body">
              <Paragraph ellipsis={{ rows: 2 }} type="tertiary" size="small" className="showcase-card-desc">
                {item.description}
              </Paragraph>
              <div className="showcase-card-tags">
                {item.tags.slice(0, 3).map((tag) => (
                  <Tag key={tag} size="small" color="violet" type="light">{tag}</Tag>
                ))}
              </div>
              <div className="showcase-card-footer">
                <Space spacing={12}>
                  <span className="showcase-card-stat">
                    <Eye size={14} strokeWidth={2} />
                    <Text size="small" type="tertiary">{item.views.toLocaleString()}</Text>
                  </span>
                  <span className="showcase-card-stat">
                    <Star size={16} strokeWidth={2} />
                    <Text size="small" type="tertiary">{item.rating}</Text>
                  </span>
                </Space>
                <Text size="small" type="tertiary">{item.department}</Text>
              </div>
            </div>
          </Card>
          </div>
        ))}
      </div>

      <ShowcaseDetailDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        item={selectedItem}
        dataList={filteredData}
        onNavigate={(item) => setSelectedItem(item)}
      />
    </div>
  );
};

export default Showcases;
