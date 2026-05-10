import { Button, Typography } from '@douyinfe/semi-ui';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';

const { Title } = Typography;

const MvpPlaceholder = ({ titleKey }: { titleKey?: string }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button
          type="tertiary"
          theme="borderless"
          icon={<ChevronLeft size={18} strokeWidth={2} />}
          onClick={() => navigate('/sharing-center/market')}
        />
        {titleKey && <Title heading={3} style={{ margin: 0 }}>{t(titleKey)}</Title>}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState variant="maintenance" description={t('sharing.market.mvpUnavailable')} />
      </div>
    </div>
  );
};

export default MvpPlaceholder;
