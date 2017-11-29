import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';

import { FeatureFlags } from 'common/feature_flags';
import I18n from 'common/i18n';
import * as filtersActions from 'common/components/AssetBrowser/actions/filters';

export class AssetCounts extends Component {

  componentWillReceiveProps() {
    this.render();
  }

  render() {
    const { assetCounts, fetchingAssetCounts, fetchingAssetCountsError, filters } = this.props;

    const scope = 'shared.asset_browser.header.asset_counts';
    const assetTypeTranslation = (key, count) => I18n.t(key, { count, scope });

    const sortedAssetCounts = _(assetCounts).toPairs().sortBy(0).fromPairs().value();

    const usaidFeaturesEnabled = FeatureFlags.value('usaid_features_enabled');

    const assetCountItems = _.map(sortedAssetCounts, (assetCount, assetType) => {
      if (assetCount === 0) return;
      let assetTypeName;

      if (filters.assetTypes === 'workingCopies') {
        assetTypeName = assetTypeTranslation('workingCopies', assetCount);
      } else if (assetType === 'hrefs' && usaidFeaturesEnabled) {
        assetTypeName = assetTypeTranslation('data_assets', assetCount);
      } else {
        assetTypeName = assetTypeTranslation(assetType, assetCount);
      }

      let assetCountLink = null;
      if (filters.assetTypes === assetType || filters.assetTypes === 'workingCopies') {
        assetCountLink = assetCount;
      } else {
        assetCountLink = (
          <a onClick={() => this.props.changeAssetType(assetType)}>
            {assetCount}
          </a>
        );
      }

      const assetCountsItemClass = classNames('asset-counts-item', {
        'datalensesAndVisualizations': assetType === 'datalenses,visualizations',
        [assetType]: assetType !== 'datalenses,visualizations'
      });

      return (
        <div className={assetCountsItemClass} key={assetType}>
          <div className="item-count">{assetCountLink}</div>
          <div className="item-name">{assetTypeName}</div>
        </div>
      );
    });

    const assetCountsClass = classNames('asset-counts', {
      'fetching': fetchingAssetCounts,
      'has-error': fetchingAssetCountsError
    });

    return (
      <div className={assetCountsClass}>
        {assetCountItems}
      </div>
    );
  }
}

AssetCounts.propTypes = {
  assetCounts: PropTypes.shape({
    charts: PropTypes.number,
    'datalenses,visualizations': PropTypes.number,
    datasets: PropTypes.number,
    files: PropTypes.number,
    filters: PropTypes.number,
    hrefs: PropTypes.number,
    maps: PropTypes.number,
    stories: PropTypes.number
  }).isRequired,
  changeAssetType: PropTypes.func,
  fetchingAssetCounts: PropTypes.bool,
  fetchingAssetCountsError: PropTypes.bool,
  filters: PropTypes.shape({
    assetTypes: PropTypes.string
  })
};

const mapStateToProps = (state) => ({
  assetCounts: _.get(state, 'assetCounts.values', {}),
  fetchingAssetCounts: _.get(state, 'assetCounts.fetchingAssetCounts', false),
  fetchingAssetCountsError: _.get(state, 'assetCounts.fetchingAssetCountsError', false),
  filters: state.filters
});

const mapDispatchToProps = (dispatch) => ({
  changeAssetType: (value) => dispatch(filtersActions.changeAssetType(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetCounts);
