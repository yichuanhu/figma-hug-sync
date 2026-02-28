/**
 * 国际常用 IANA 时区列表，按大洲分组，组内按 UTC 偏移排序
 */

export interface TimezoneOption {
  value: string;
  label: string;
}

export interface TimezoneGroup {
  groupLabel: string;
  options: TimezoneOption[];
}

export const TIMEZONE_GROUPS: TimezoneGroup[] = [
  {
    groupLabel: 'Americas',
    options: [
      { value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii' },
      { value: 'America/Anchorage', label: '(UTC-09:00) Alaska' },
      { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US & Canada)' },
      { value: 'America/Vancouver', label: '(UTC-08:00) Vancouver' },
      { value: 'America/Denver', label: '(UTC-07:00) Mountain Time (US & Canada)' },
      { value: 'America/Phoenix', label: '(UTC-07:00) Arizona' },
      { value: 'America/Chicago', label: '(UTC-06:00) Central Time (US & Canada)' },
      { value: 'America/Mexico_City', label: '(UTC-06:00) Mexico City' },
      { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)' },
      { value: 'America/Toronto', label: '(UTC-05:00) Toronto' },
      { value: 'America/Bogota', label: '(UTC-05:00) Bogota, Lima' },
      { value: 'America/Halifax', label: '(UTC-04:00) Atlantic Time (Canada)' },
      { value: 'America/Caracas', label: '(UTC-04:00) Caracas' },
      { value: 'America/Sao_Paulo', label: '(UTC-03:00) São Paulo' },
      { value: 'America/Argentina/Buenos_Aires', label: '(UTC-03:00) Buenos Aires' },
    ],
  },
  {
    groupLabel: 'Europe',
    options: [
      { value: 'UTC', label: '(UTC+00:00) UTC' },
      { value: 'Europe/London', label: '(UTC+00:00) London, Dublin' },
      { value: 'Europe/Paris', label: '(UTC+01:00) Paris' },
      { value: 'Europe/Berlin', label: '(UTC+01:00) Berlin, Frankfurt' },
      { value: 'Europe/Amsterdam', label: '(UTC+01:00) Amsterdam' },
      { value: 'Europe/Madrid', label: '(UTC+01:00) Madrid' },
      { value: 'Europe/Rome', label: '(UTC+01:00) Rome' },
      { value: 'Europe/Athens', label: '(UTC+02:00) Athens' },
      { value: 'Europe/Moscow', label: '(UTC+03:00) Moscow' },
      { value: 'Europe/Istanbul', label: '(UTC+03:00) Istanbul' },
    ],
  },
  {
    groupLabel: 'Asia',
    options: [
      { value: 'Asia/Riyadh', label: '(UTC+03:00) Riyadh' },
      { value: 'Asia/Dubai', label: '(UTC+04:00) Dubai' },
      { value: 'Asia/Karachi', label: '(UTC+05:00) Karachi' },
      { value: 'Asia/Kolkata', label: '(UTC+05:30) Mumbai, Kolkata' },
      { value: 'Asia/Dhaka', label: '(UTC+06:00) Dhaka' },
      { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok' },
      { value: 'Asia/Jakarta', label: '(UTC+07:00) Jakarta' },
      { value: 'Asia/Shanghai', label: '(UTC+08:00) Beijing, Shanghai' },
      { value: 'Asia/Hong_Kong', label: '(UTC+08:00) Hong Kong' },
      { value: 'Asia/Taipei', label: '(UTC+08:00) Taipei' },
      { value: 'Asia/Singapore', label: '(UTC+08:00) Singapore' },
      { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo' },
      { value: 'Asia/Seoul', label: '(UTC+09:00) Seoul' },
    ],
  },
  {
    groupLabel: 'Africa',
    options: [
      { value: 'Africa/Lagos', label: '(UTC+01:00) Lagos' },
      { value: 'Africa/Cairo', label: '(UTC+02:00) Cairo' },
      { value: 'Africa/Johannesburg', label: '(UTC+02:00) Johannesburg' },
    ],
  },
  {
    groupLabel: 'Oceania',
    options: [
      { value: 'Australia/Perth', label: '(UTC+08:00) Perth' },
      { value: 'Australia/Sydney', label: '(UTC+10:00) Sydney' },
      { value: 'Australia/Melbourne', label: '(UTC+10:00) Melbourne' },
      { value: 'Pacific/Fiji', label: '(UTC+12:00) Fiji' },
      { value: 'Pacific/Auckland', label: '(UTC+12:00) Auckland' },
    ],
  },
  {
    groupLabel: 'Pacific Islands',
    options: [
      { value: 'Pacific/Midway', label: '(UTC-11:00) Midway Island' },
    ],
  },
];

/** 扁平化列表（向后兼容） */
export const TIMEZONE_OPTIONS = TIMEZONE_GROUPS.flatMap((g) => g.options);
