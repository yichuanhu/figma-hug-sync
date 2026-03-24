import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Input, Card, Tag, Avatar, Space } from '@douyinfe/semi-ui';
import { IconSearchStroked, IconStarStroked } from '@douyinfe/semi-icons';
import { Eye } from 'lucide-react';
import './index.less';

const { Title, Text, Paragraph } = Typography;

interface ShowcaseItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  author: string;
  department: string;
  views: number;
  rating: number;
  updatedAt: string;
  coverColor: string;
}

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
    coverColor: 'var(--semi-color-primary)',
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
    coverColor: 'var(--semi-color-success)',
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
    coverColor: 'var(--semi-color-warning)',
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
    coverColor: 'var(--semi-color-tertiary)',
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
    coverColor: 'var(--semi-color-danger)',
  },
];

const Showcases = () => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');

  const filteredData = showcasesMockData.filter((item) =>
    !searchText || item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.description.toLowerCase().includes(searchText.toLowerCase()) ||
    item.tags.some((tag) => tag.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className="showcases-page">
      <div className="showcases-page-header">
        <Title heading={4} className="title">
          {t('sharing.showcases.pageTitle')}
        </Title>
      </div>
      <div className="showcases-page-toolbar">
        <Input
          prefix={<IconSearchStroked />}
          placeholder={t('common.search')}
          value={searchText}
          onChange={setSearchText}
          showClear
          style={{ width: 280 }}
        />
      </div>
      <div className="showcases-page-grid">
        {filteredData.map((item) => (
          <Card key={item.id} className="showcase-card">
            <div className="showcase-card-cover" style={{ backgroundColor: item.coverColor }} />
            <div className="showcase-card-body">
              <Text strong className="showcase-card-name">{item.name}</Text>
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
                    <IconStarStroked size="small" style={{ color: 'var(--semi-color-warning)' }} />
                    <Text size="small" type="tertiary">{item.rating}</Text>
                  </span>
                </Space>
                <Text size="small" type="tertiary">{item.department}</Text>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Showcases;
