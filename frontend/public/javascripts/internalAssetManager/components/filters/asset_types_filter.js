import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import { Dropdown } from 'common/components';
import { FeatureFlags } from 'common/feature_flags';
import connectLocalization from 'common/i18n/components/connectLocalization';

import * as filterOptions from '../../lib/catalog_filter_options';
import * as filters from '../../actions/filters';

export class AssetTypesFilter extends React.Component {
  render() {
    const { assetTypes, changeAssetType, I18n } = this.props;

    let assetTypeOptions = filterOptions.assetTypeOptions;
    if (!FeatureFlags.value('stories_enabled')) {
      assetTypeOptions = _.reject(assetTypeOptions, (option) => option.value === 'stories');
    }

    const labelText = I18n.t('internal_asset_manager.filters.asset_types.label');

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
  changeAssetType: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  assetTypes: state.filters.assetTypes
});

const mapDispatchToProps = (dispatch) => ({
  changeAssetType: (value) => dispatch(filters.changeAssetType(value))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(AssetTypesFilter));
