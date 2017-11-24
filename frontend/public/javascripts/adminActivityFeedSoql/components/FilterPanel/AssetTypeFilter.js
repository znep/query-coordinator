import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Dropdown from 'common/components/Dropdown';
import I18nJS from 'common/i18n';

import * as actions from '../../actions';
import assetTypeOptions from './assetTypeOptions';

class AssetTypeFilter extends PureComponent {
  render() {
    const { assetType, changeAssetType } = this.props;

    const labelText = I18nJS.
      t('screens.admin.activity_feed.filters.asset_types.label');

    const dropDownProps = {
      onSelection: (option) => changeAssetType(option.value),
      options: assetTypeOptions,
      size: 'medium',
      value: assetType || null
    };

    return (
      <div className="filter-section asset-type">
        <label className="filter-label">{labelText}</label>
        <Dropdown {...dropDownProps} />
      </div>
    );
  }
}

AssetTypeFilter.propTypes = {
  assetTypes: PropTypes.string,
  changeAssetType: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  assetType: state.filters.assetType
});

const mapDispatchToProps = (dispatch) => ({
  changeAssetType: (value) => dispatch(actions.filters.changeAssetType(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetTypeFilter);
