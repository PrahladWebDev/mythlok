// Countries list — hardcoded, country-wise (no lat/lng, no districts).
export const COUNTRIES = [
  { name: 'India',          code: 'IN', emoji: '🇮🇳' },
  { name: 'Nepal',          code: 'NP', emoji: '🇳🇵' },
  { name: 'Sri Lanka',      code: 'LK', emoji: '🇱🇰' },
  { name: 'Bangladesh',     code: 'BD', emoji: '🇧🇩' },
  { name: 'Bhutan',         code: 'BT', emoji: '🇧🇹' },
  { name: 'Pakistan',       code: 'PK', emoji: '🇵🇰' },
  { name: 'China',          code: 'CN', emoji: '🇨🇳' },
  { name: 'Japan',          code: 'JP', emoji: '🇯🇵' },
  { name: 'Thailand',       code: 'TH', emoji: '🇹🇭' },
  { name: 'Indonesia',      code: 'ID', emoji: '🇮🇩' },
  { name: 'Vietnam',        code: 'VN', emoji: '🇻🇳' },
  { name: 'Cambodia',       code: 'KH', emoji: '🇰🇭' },
  { name: 'Mexico',         code: 'MX', emoji: '🇲🇽' },
  { name: 'Egypt',          code: 'EG', emoji: '🇪🇬' },
  { name: 'Greece',         code: 'GR', emoji: '🇬🇷' },
  { name: 'Ireland',        code: 'IE', emoji: '🇮🇪' },
  { name: 'United Kingdom', code: 'GB', emoji: '🇬🇧' },
  { name: 'Nigeria',        code: 'NG', emoji: '🇳🇬' },
  { name: 'Brazil',         code: 'BR', emoji: '🇧🇷' },
  { name: 'United States',  code: 'US', emoji: '🇺🇸' },
];

export const COUNTRY_STORIES = {
  'India':     { color: '#D4660A' },
  'Mexico':    { color: '#1E8449' },
  'Ireland':   { color: '#117A65' },
  'Japan':     { color: '#8B1A1A' },
  'Egypt':     { color: '#B78C3E' },
  'Greece':    { color: '#1A5276' },
};

export const getCountryColor = (countryName) => {
  return COUNTRY_STORIES[countryName]?.color || '#B78C3E';
};
