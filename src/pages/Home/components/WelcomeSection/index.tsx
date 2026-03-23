import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import waveHandIcon from '@/assets/wave-hand.svg';

const WelcomeSection = () => {
  const { t, i18n } = useTranslation();

  const isZh = i18n.language === 'zh-CN';
  const now = dayjs();
  const dateStr = isZh
    ? now.locale('zh-cn').format('YYYY年MM月DD日 dddd')
    : now.locale('en').format('dddd, MMMM D, YYYY');

  return (
    <div className="home-welcome">
      <h1 className="home-welcome-title">
        {t('homepage.welcomePrefix', 'Hi ')}
        <span className="home-welcome-name">John Smith</span>
        {t('homepage.welcomeSuffix', ', welcome back')}
        <img src={waveHandIcon} alt="wave" className="home-welcome-wave-icon" />
      </h1>
      <div className="home-welcome-date">{dateStr}</div>
    </div>
  );
};

export default WelcomeSection;
