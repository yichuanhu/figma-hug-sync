/** 运维中心 - 配置管理 类型定义 */

export interface SystemBasicConfig {
  host: string;
  port: number;
  is_production: boolean;
  default_lang: 'zh-CN' | 'en-US';
  exit_timeout: number;
  root_url: string;
}

export interface SystemLoginConfig {
  allow_phone_login: boolean;
  allow_email_login: boolean;
  allow_username_login: boolean;
}

export interface SystemCorsConfig {
  allow_origins: string[];
  allow_methods: string[];
  allow_headers: string[];
  allow_credentials: boolean;
  allow_origin_regex: string;
  expose_headers: string[];
  max_age: number;
}

export interface SystemMultiProcessConfig {
  address: { host: string; port: number };
  authkey: string;
  shutdown_timeout: number;
}

export interface SystemStorageConfig {
  max_size: number;
  max_chunk_size: number;
  media_type: string[];
}

export interface SystemParamsConfig {
  basic: SystemBasicConfig;
  login: SystemLoginConfig;
  cors: SystemCorsConfig;
  multi_process: SystemMultiProcessConfig;
  storage: SystemStorageConfig;
}

export interface ServiceUvicornConfig {
  access_log: boolean;
  workers: number;
  proxy_headers: boolean;
  date_header: boolean;
  forwarded_allow_ips: string[];
  root_path: string;
  limit_concurrency: number;
  limit_max_requests: number;
  worker_ping_timeout: number;
}

export interface ServiceWebsocketConfig {
  protocol: string;
  max_size: number;
  max_queue: number;
  ping_interval: number;
  ping_timeout: number;
  per_message_deflate: boolean;
}

export interface ServiceRateLimitConfig {
  request_amount: number;
  window_seconds: number;
}

export interface ServiceWebApiConfig {
  max_count_per_query: number;
  encrypt: boolean;
  forbid_extra_fields: boolean;
}

export interface ServiceOpenApiConfig {
  enabled: boolean;
  expire: number;
  max_body_length: number;
  hash_count: number;
}

export interface ServiceParamsConfig {
  uvicorn: ServiceUvicornConfig;
  websocket: ServiceWebsocketConfig;
  rate_limit: ServiceRateLimitConfig | null;
  session: { expire: number };
  web_api: ServiceWebApiConfig;
  response_headers: Record<string, string>;
  open_api: ServiceOpenApiConfig;
}

export interface DatabaseConfig {
  url: string;
  type: string;
  host: string;
  port: number;
  user: string;
  password: string;
  db: string;
  echo: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  db: number;
  username: string;
  password: string;
  enabled: boolean;
}

export interface FileStorageConfig {
  path: string;
  access_mode: 'read_only' | 'read_write';
  encryption: boolean;
  encryption_key: string;
}

export interface InfrastructureConfig {
  database: Record<string, DatabaseConfig>;
  redis: RedisConfig | null;
  file_storage: FileStorageConfig | null;
  storage: { default_bucket: string; max_size: number };
  cache: { max_expire: number; local: { max_count: number; clear_count: number } };
  lock: { max_expire: number; max_timeout: number; min_timeout: number; interval: number };
  token_bucket: { max_capacity: number; interval: number };
  queue: { max_size: number; size_check_interval: number };
}

export interface MonitoringTraceConfig {
  enabled: boolean;
  sampler_ratio: number;
  excluded_urls: string[];
}

export interface MonitoringConfig {
  trace: MonitoringTraceConfig;
  health_check: { interval: number; action: string };
  event: { database_polling_interval: number; redis_resubscribe_interval: number };
  registry: { keepalive_interval: number; initialize_timeout: number };
  scheduler: { max_duration: number; log_keep_days: number };
  metric: { interval: number; size: number; library: string };
}

export interface LoggerHandlerConfig {
  class: string;
  level: string;
  formatter: string;
  filename?: string;
  when?: string;
  backupCount?: number;
  encoding?: string;
}

export interface LoggerConfig {
  version: number;
  disable_existing_loggers: boolean;
  handlers: Record<string, LoggerHandlerConfig>;
  formatters: Record<string, { format: string }>;
  loggers: Record<string, { handlers: string[]; level: string; propagate: boolean }>;
}
