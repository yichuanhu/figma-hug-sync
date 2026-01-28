import AppLayout from '@/components/layout/AppLayout';
import { Breadcrumb, Typography, Card, Row, Col } from '@douyinfe/semi-ui';
import { IconHome } from '@douyinfe/semi-icons';
import EmptyState, { EmptyStateVariant } from '@/components/EmptyState';
import { useTranslation } from 'react-i18next';
import './index.less';

const { Title, Text } = Typography;

interface VariantDemo {
  variant: EmptyStateVariant;
  titleKey: string;
  descKey: string;
  actions?: ('retry' | 'goHome' | 'goBack')[];
}

const EmptyStatePreview = () => {
  const { t } = useTranslation();

  const variants: VariantDemo[] = [
    {
      variant: 'noData',
      titleKey: 'emptyStatePreview.noData.title',
      descKey: 'emptyStatePreview.noData.description',
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
            {variants.map((item) => (
              <Col key={item.variant} span={8}>
                <Card
                  className="empty-state-preview-card"
                  title={
                    <div className="empty-state-preview-card-header">
                      <Text strong>{t(item.titleKey)}</Text>
                      <Text type="tertiary" size="small">
                        variant="{item.variant}"
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
