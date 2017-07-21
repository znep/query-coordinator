import React from 'react';
import { SocrataIcon } from 'common/components';

const communityIcon = <SocrataIcon name="community" />;
const officialIcon = <SocrataIcon name="official2" />;

const getTranslation = (key) => _.get(I18n, `filters.${key}`);

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
  { title: getTranslation('authority.options.official'), value: 'official', icon: officialIcon },
  { title: getTranslation('authority.options.community'), value: 'community', icon: communityIcon }
];

export const visibilityOptions = [
  { title: getTranslation('visibility.options.all'), value: null },
  { title: getTranslation('visibility.options.public'), value: 'open' },
  { title: getTranslation('visibility.options.private'), value: 'internal' }
];
