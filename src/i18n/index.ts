import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// 创建初始化 Promise，确保 i18n 在应用渲染前完成加载
const initPromise = i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN'],
    load: 'currentOnly',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/i18n/{{lng}}.json',
    },
    react: {
      useSuspense: true,
    },
  });

export { initPromise };
export default i18n;
