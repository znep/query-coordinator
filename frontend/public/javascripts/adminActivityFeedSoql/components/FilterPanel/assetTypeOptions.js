import React from 'react';
import I18nJS from 'common/i18n';
import AssetTypeIcon from 'common/components/AssetTypeIcon';

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

const getTranslation = (key) => I18nJS.t(`screens.admin.activity_feed.filters.${key}`);

const assetTypeOptions = [
  { title: getTranslation('asset_types.options.all'), value: null, defaultOption: true },
  { title: getTranslation('asset_types.options.calendars'), value: 'calendar', icon: calendarIcon },
  { title: getTranslation('asset_types.options.charts'), value: 'chart', icon: chartIcon },
  { title: getTranslation('asset_types.options.datasets'), value: 'dataset', icon: datasetIcon },
  { title: getTranslation('asset_types.options.datalenses,visualizations'),
    value: 'data_lens', icon: datalensIcon },
  { title: getTranslation('asset_types.options.external'), value: 'href', icon: externalIcon },
  { title: getTranslation('asset_types.options.files'), value: 'blob', icon: fileIcon },
  { title: getTranslation('asset_types.options.filtered'), value: 'filter', icon: filteredIcon },
  { title: getTranslation('asset_types.options.forms'), value: 'form', icon: formIcon },
  { title: getTranslation('asset_types.options.maps'), value: 'map', icon: mapIcon },
  { title: getTranslation('asset_types.options.stories'), value: 'story', icon: storyIcon },
  { title: getTranslation('asset_types.options.working_copies'), value: 'draft', icon: workingIcon }
];

export default assetTypeOptions;
