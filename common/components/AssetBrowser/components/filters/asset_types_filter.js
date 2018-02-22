import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Dropdown from 'common/components/Dropdown';
import AssetTypeIcon from 'common/components/AssetTypeIcon';
import { FeatureFlags } from 'common/feature_flags';
import I18n from 'common/i18n';

import * as filters from 'common/components/AssetBrowser/actions/filters';

export class AssetTypesFilter extends Component {
  getAssetTypeOptions() {
    const scope = 'shared.asset_browser.filters.asset_types';
    const isUsaid = FeatureFlags.value('usaid_features_enabled');

    const assetTypeOptions = [
      {
        title: I18n.t('options.all', { scope }),
        value: null,
        defaultOption: true
      },
      {
        title: I18n.t('options.calendars', { scope }),
        value: 'calendars',
        icon: <AssetTypeIcon displayType="calendar" />
      },
      {
        title: I18n.t('options.charts', { scope }),
        value: 'charts',
        icon: <AssetTypeIcon displayType="chart" />
      },
      {
        title: I18n.t('options.datasets', { scope }),
        value: 'datasets',
        icon: <AssetTypeIcon displayType="dataset" />
      },
      {
        title: I18n.t('options.datalenses,visualizations', { scope }),
        value: 'datalenses,visualizations',
        icon: <AssetTypeIcon displayType="datalens" />
      },
      {
        title: I18n.t('options.files', { scope }),
        value: 'files',
        icon: <AssetTypeIcon displayType="attachment" />
      },
      {
        title: I18n.t('options.filtered', { scope }),
        value: 'filters',
        icon: <AssetTypeIcon displayType="filter" />
      },
      {
        title: I18n.t('options.forms', { scope }),
        value: 'forms',
        icon: <AssetTypeIcon displayType="form" />
      },
      {
        title: I18n.t(isUsaid ? 'options.data_assets' : 'options.external', { scope }),
        value: 'hrefs,federated_hrefs',
        icon: <AssetTypeIcon displayType={isUsaid ? 'data_asset' : 'href'} />
      },
      {
        title: I18n.t('options.maps', { scope }),
        value: 'maps',
        icon: <AssetTypeIcon displayType="map" />
      },
      {
        title: I18n.t('options.measures', { scope }),
        value: 'measures',
        icon: <AssetTypeIcon displayType="measure" />
      },
      {
        title: I18n.t('options.working_copies', { scope }),
        value: 'workingCopies',
        icon: <AssetTypeIcon displayType="dataset" isPublished={false} />
      }
    ];

    if (FeatureFlags.value('stories_enabled')) {
      assetTypeOptions.push({
        title: I18n.t('options.stories', { scope }),
        value: 'stories',
        icon: <AssetTypeIcon displayType="story" />
      });
    }

    return assetTypeOptions;
  }

  render() {
    const { assetTypes, changeAssetType } = this.props;
    const scope = 'shared.asset_browser.filters.asset_types';

    return (
      <div className="filter-section asset-types">
        <label className="filter-label">{I18n.t('label', { scope })}</label>
        <Dropdown
          onSelection={(option) => changeAssetType(option.value)}
          options={this.getAssetTypeOptions()}
          size="medium"
          value={assetTypes || null} />
      </div>
    );
  }
}

AssetTypesFilter.propTypes = {
  assetTypes: PropTypes.string,
  changeAssetType: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  assetTypes: state.filters.assetTypes
});

const mapDispatchToProps = (dispatch) => ({
  changeAssetType: (value) => dispatch(filters.changeAssetType(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetTypesFilter);
