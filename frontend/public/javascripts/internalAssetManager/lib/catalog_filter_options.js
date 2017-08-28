import React from 'react';
import { AssetTypeIcon, SocrataIcon } from 'common/components';

const calendarIcon = <AssetTypeIcon displayType="calendar" />;
const chartIcon = <AssetTypeIcon displayType="chart" />;
const datasetIcon = <AssetTypeIcon displayType="dataset" />;
const datalensIcon = <AssetTypeIcon displayType="datalens" />;
const externalIcon = <AssetTypeIcon displayType="href" />;
const fileIcon = <AssetTypeIcon displayType="attachment" />;
const filteredIcon = <AssetTypeIcon displayType="filter" />;
const formIcon = <AssetTypeIcon displayType="form" />;
const mapIcon = <AssetTypeIcon displayType="map" />;
const storyIcon = <AssetTypeIcon displayType="story" />;
const workingIcon = <AssetTypeIcon displayType="dataset" isPublished={false} />;

const communityIcon = <SocrataIcon name="community" />;
const officialIcon = <SocrataIcon name="official2" />;

const getTranslation = (key) => _.get(I18n, `filters.${key}`);

export const assetTypeOptions = [
  { title: getTranslation('asset_types.options.all'), value: null, defaultOption: true },
  { title: getTranslation('asset_types.options.calendars'), value: 'calendars', icon: calendarIcon },
  { title: getTranslation('asset_types.options.charts'), value: 'charts', icon: chartIcon },
  { title: getTranslation('asset_types.options.datasets'), value: 'datasets', icon: datasetIcon },
  { title: getTranslation('asset_types.options.datalenses'), value: 'datalenses', icon: datalensIcon },
  { title: getTranslation('asset_types.options.external'), value: 'hrefs', icon: externalIcon },
  { title: getTranslation('asset_types.options.files'), value: 'files', icon: fileIcon },
  { title: getTranslation('asset_types.options.filtered'), value: 'filters', icon: filteredIcon },
  { title: getTranslation('asset_types.options.forms'), value: 'forms', icon: formIcon },
  { title: getTranslation('asset_types.options.maps'), value: 'maps', icon: mapIcon },
  { title: getTranslation('asset_types.options.stories'), value: 'stories', icon: storyIcon },
  { title: getTranslation('asset_types.options.working_copies'), value: 'workingCopies', icon: workingIcon }
];

export const authorityOptions = [
  { title: getTranslation('authority.options.all'), value: null, defaultOption: true },
  { title: getTranslation('authority.options.official'), value: 'official', icon: officialIcon },
  { title: getTranslation('authority.options.community'), value: 'community', icon: communityIcon }
];

export const visibilityOptions = [
  { title: getTranslation('visibility.options.all'), value: null, defaultOption: true },
  { title: getTranslation('visibility.options.public'), value: 'open' },
  { title: getTranslation('visibility.options.private'), value: 'internal' }
];
