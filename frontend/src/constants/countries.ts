export const COUNTRY_OPTIONS = [
  { code: 'RU', label: 'Россия' },
  { code: 'US', label: 'США' },
  { code: 'CN', label: 'Китай' },
  { code: 'DE', label: 'Германия' },
  { code: 'TR', label: 'Турция' },
  { code: 'KR', label: 'Корея' },
  { code: 'JP', label: 'Япония' },
  { code: 'AE', label: 'ОАЭ' },
  { code: 'IN', label: 'Индия' },
  { code: 'BR', label: 'Бразилия' }
] as const;

export type CountryOption = (typeof COUNTRY_OPTIONS)[number];
