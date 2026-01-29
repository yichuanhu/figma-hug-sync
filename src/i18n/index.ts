import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// 创建初始化 Promise，确保 i18n 在应用渲染前完成加载
// 按“之前实现方式”恢复为 HttpBackend 拉取 public/i18n 下的资源。
const initPromise = i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    // 显式声明默认命名空间与分隔符，避免 key 解析差异
    ns: ['translation'],
    defaultNS: 'translation',
    keySeparator: '.',
    nsSeparator: ':',
    debug: import.meta.env.DEV,
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN'],
    load: 'currentOnly',
    returnNull: false,
    returnEmptyString: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/i18n/{{lng}}.json',
      // 避免开发态缓存导致更新不生效（i18next-http-backend 会透传到 fetch）
      requestOptions: {
        cache: 'no-store',
      },
    },
    react: {
      useSuspense: true,
    },
  });

export { initPromise };
export default i18n;
