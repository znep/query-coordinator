const getTranslation = (key) => _.get(I18n, `filters.${key}`);

export const lastUpdatedDateOptions = [
  { title: getTranslation('last_updated_date.options.any_date_updated'), value: 'anyDateUpdated' },
  { title: getTranslation('last_updated_date.options.past_3_days'), value: 'past3Days' },
  { title: getTranslation('last_updated_date.options.past_week'), value: 'pastWeek' },
  { title: getTranslation('last_updated_date.options.past_month'), value: 'pastMonth' },
  { title: getTranslation('last_updated_date.options.past_3_months'), value: 'past3Months' },
  { title: getTranslation('last_updated_date.options.past_6_months'), value: 'past6Months' },
  { title: getTranslation('last_updated_date.options.custom_date_range'), value: 'customDateRange' }
];

export const assetTypeOptions = [
  { title: getTranslation('asset_types.options.all'), value: null },
  { title: getTranslation('asset_types.options.calendars'), value: 'calendars' },
  { title: getTranslation('asset_types.options.charts'), value: 'charts' },
  { title: getTranslation('asset_types.options.datasets'), value: 'datasets' },
  { title: getTranslation('asset_types.options.datalenses'), value: 'datalenses' },
  { title: getTranslation('asset_types.options.external'), value: 'hrefs' },
  { title: getTranslation('asset_types.options.files'), value: 'files' },
  { title: getTranslation('asset_types.options.filtered'), value: 'filters' },
  { title: getTranslation('asset_types.options.forms'), value: 'forms' },
  { title: getTranslation('asset_types.options.maps'), value: 'maps' },
  { title: getTranslation('asset_types.options.stories'), value: 'stories' }
];

export const authorityOptions = [
  { title: getTranslation('authority.options.all'), value: null },
  { title: getTranslation('authority.options.official'), value: 'official' },
  { title: getTranslation('authority.options.community'), value: 'community' }
];

export const visibilityOptions = [
  { title: getTranslation('visibility.options.all'), value: null },
  { title: getTranslation('visibility.options.open'), value: 'open' },
  { title: getTranslation('visibility.options.internal'), value: 'internal' }
];
