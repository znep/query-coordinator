import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Dropdown from 'common/components/Dropdown';

import { FeatureFlags } from 'common/feature_flags';
import I18n from 'common/i18n';

import * as filterOptions from 'common/components/AssetBrowser/lib/catalog_filter_options';
import * as filters from 'common/components/AssetBrowser/actions/filters';

export class AssetTypesFilter extends Component {
  render() {
    const { assetTypes, changeAssetType } = this.props;

    let assetTypeOptions = filterOptions.assetTypeOptions;
    if (!FeatureFlags.value('stories_enabled')) {
      assetTypeOptions = _.reject(assetTypeOptions, (option) => option.value === 'stories');
    }

    const labelText = I18n.t('shared.asset_browser.filters.asset_types.label');

    return (
      <div className="filter-section asset-types">
        <label className="filter-label">{labelText}</label>
        <Dropdown
          onSelection={(option) => changeAssetType(option.value)}
          options={assetTypeOptions}
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
