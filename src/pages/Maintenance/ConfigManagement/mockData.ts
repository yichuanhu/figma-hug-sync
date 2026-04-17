/** 运维中心 - 配置管理 Mock 数据 */
import type {
  SystemParamsConfig,
  ServiceParamsConfig,
  InfrastructureConfig,
  MonitoringConfig,
  LoggerConfig,
} from './types';

export const mockSystemParams: SystemParamsConfig = {
  basic: {
    host: '0.0.0.0',
    port: 8000,
    is_production: true,
    default_lang: 'zh-CN',
    exit_timeout: 30,
    root_url: 'https://apa.example.com',
  },
  login: {
    allow_phone_login: true,
    allow_email_login: true,
    allow_username_login: true,
  },
  cors: {
    allow_origins: ['*'],
    allow_methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allow_headers: ['*'],
    allow_credentials: true,
    allow_origin_regex: '',
    expose_headers: [],
    max_age: 600,
  },
  multi_process: {
    address: { host: '127.0.0.1', port: 11000 },
    authkey: 'apa-secret-key',
    shutdown_timeout: 30,
  },
  storage: {
    max_size: 104857600,
    max_chunk_size: 5242880,
    media_type: ['image/*', 'video/*', 'application/pdf'],
  },
};

export const mockServiceParams: ServiceParamsConfig = {
  uvicorn: {
    access_log: true,
    workers: 4,
    proxy_headers: true,
    date_header: true,
    forwarded_allow_ips: ['127.0.0.1'],
    root_path: '',
    limit_concurrency: 1000,
    limit_max_requests: 10000,
    worker_ping_timeout: 60,
  },
  websocket: {
    protocol: 'auto',
    max_size: 16777216,
    max_queue: 32,
    ping_interval: 20,
    ping_timeout: 60,
    per_message_deflate: true,
  },
  rate_limit: { request_amount: 100, window_seconds: 60 },
  session: { expire: 86400 },
  web_api: { max_count_per_query: 1000, encrypt: false, forbid_extra_fields: true },
  response_headers: {
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
  },
  open_api: { enabled: false, expire: 300, max_body_length: 1048576, hash_count: 1 },
};

export const mockInfrastructure: InfrastructureConfig = {
  database: {
    global: {
      url: 'mysql+pymysql://apa:apa@127.0.0.1:3306/apa_global',
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      user: 'apa',
      password: '******',
      db: 'apa_global',
      echo: false,
    },
    default: {
      url: 'mysql+pymysql://apa:apa@127.0.0.1:3306/apa_default',
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      user: 'apa',
      password: '******',
      db: 'apa_default',
      echo: false,
    },
  },
  redis: { host: '127.0.0.1', port: 6379, db: 0, username: '', password: '', enabled: true },
  file_storage: { path: '/data/apa/files', access_mode: 'read_write', encryption: false, encryption_key: '' },
  storage: { default_bucket: 'apa-default', max_size: 104857600 },
  cache: { max_expire: 86400, local: { max_count: 1000, clear_count: 100 } },
  lock: { max_expire: 60, max_timeout: 30, min_timeout: 1, interval: 1 },
  token_bucket: { max_capacity: 100, interval: 1 },
  queue: { max_size: 10000, size_check_interval: 60 },
};

export const mockMonitoring: MonitoringConfig = {
  trace: { enabled: true, sampler_ratio: 0.1, excluded_urls: ['/health', '/metrics'] },
  health_check: { interval: 30, action: 'log' },
  event: { database_polling_interval: 5, redis_resubscribe_interval: 60 },
  registry: { keepalive_interval: 30, initialize_timeout: 60 },
  scheduler: { max_duration: 3600, log_keep_days: 30 },
  metric: { interval: 15, size: 1000, library: 'prometheus' },
};

export const mockLogger: LoggerConfig = {
  version: 1,
  disable_existing_loggers: false,
  handlers: {
    console: { class: 'logging.StreamHandler', level: 'INFO', formatter: 'default' },
    file: {
      class: 'logging.handlers.TimedRotatingFileHandler',
      level: 'INFO',
      formatter: 'default',
      filename: '/var/log/apa/apa.log',
      when: 'midnight',
      backupCount: 30,
      encoding: 'utf-8',
    },
  },
  formatters: {
    default: { format: '%(asctime)s [%(levelname)s] %(name)s: %(message)s' },
    simple: { format: '%(levelname)s: %(message)s' },
  },
  loggers: {
    apa: { handlers: ['console', 'file'], level: 'INFO', propagate: false },
    'apa.access': { handlers: ['file'], level: 'INFO', propagate: false },
  },
};
