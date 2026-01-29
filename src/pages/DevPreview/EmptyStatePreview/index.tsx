import AppLayout from '@/components/layout/AppLayout';
import { Breadcrumb, Typography, Card, Row, Col, Button } from '@douyinfe/semi-ui';
import { IconHome, IconPlus } from '@douyinfe/semi-icons';
import EmptyState, { EmptyStateVariant } from '@/components/EmptyState';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './index.less';

const { Title, Text } = Typography;

interface VariantDemo {
  variant: EmptyStateVariant;
  titleKey: string;
  descKey: string;
  actions?: ('retry' | 'goHome' | 'goBack')[];
  customFooter?: boolean;
  footerLabel?: string;
}

const EmptyStatePreview = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const variants: VariantDemo[] = [
    {
      variant: 'noData',
      titleKey: 'emptyStatePreview.noData.title',
      descKey: 'emptyStatePreview.noData.description',
    },
    {
      variant: 'noData',
      titleKey: 'emptyStatePreview.noDataWithAction.title',
      descKey: 'emptyStatePreview.noDataWithAction.description',
      customFooter: true,
      footerLabel: 'emptyStatePreview.noDataWithAction.action',
    },
    {
      variant: 'noResult',
      titleKey: 'emptyStatePreview.noResult.title',
      descKey: 'emptyStatePreview.noResult.description',
    },
    {
      variant: 'error',
      titleKey: 'emptyStatePreview.error.title',
      descKey: 'emptyStatePreview.error.description',
      actions: ['retry'],
    },
    {
      variant: 'noAccess',
      titleKey: 'emptyStatePreview.noAccess.title',
      descKey: 'emptyStatePreview.noAccess.description',
      actions: ['goHome', 'goBack'],
    },
    {
      variant: 'maintenance',
      titleKey: 'emptyStatePreview.maintenance.title',
      descKey: 'emptyStatePreview.maintenance.description',
    },
    {
      variant: 'notFound',
      titleKey: 'emptyStatePreview.notFound.title',
      descKey: 'emptyStatePreview.notFound.description',
      actions: ['goHome', 'goBack'],
    },
  ];

  const handleRetry = () => {
    console.log('Retry clicked');
  };

  const renderFooter = (item: VariantDemo) => {
    if (item.customFooter && item.footerLabel) {
      return (
        <Button
          theme="solid"
          type="primary"
          icon={<IconPlus />}
          onClick={() => navigate('/')}
        >
          {t(item.footerLabel)}
        </Button>
      );
    }
    return undefined;
  };

  return (
    <AppLayout>
      <div className="empty-state-preview">
        <div className="empty-state-preview-breadcrumb">
          <Breadcrumb>
            <Breadcrumb.Item icon={<IconHome />} href="/">首页</Breadcrumb.Item>
            <Breadcrumb.Item>开发预览</Breadcrumb.Item>
            <Breadcrumb.Item>缺省状态预览</Breadcrumb.Item>
          </Breadcrumb>
        </div>

        <div className="empty-state-preview-header">
          <Title heading={4} className="empty-state-preview-header-title">
            缺省状态预览
          </Title>
          <Text type="tertiary">
            展示所有 EmptyState 组件变体，用于设计走查和开发参考
          </Text>
        </div>

        <div className="empty-state-preview-content">
          <Row gutter={[24, 24]}>
            {variants.map((item, index) => (
              <Col key={`${item.variant}-${index}`} span={8}>
                <Card
                  className="empty-state-preview-card"
                  title={
                    <div className="empty-state-preview-card-header">
                      <Text strong>{t(item.titleKey)}</Text>
                      <Text type="tertiary" size="small">
                        variant="{item.variant}"
                        {item.customFooter && ' + footer'}
                        {item.actions && ` + actions`}
                      </Text>
                    </div>
                  }
                >
                  <div className="empty-state-preview-card-content">
                    <EmptyState
                      variant={item.variant}
                      description={t(item.descKey)}
                      size={120}
                      actions={item.actions}
                      onRetry={handleRetry}
                      footer={renderFooter(item)}
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </AppLayout>
  );
};

export default EmptyStatePreview;
