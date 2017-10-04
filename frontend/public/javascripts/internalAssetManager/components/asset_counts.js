import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';
import connectLocalization from 'common/i18n/components/connectLocalization';

import * as filters from '../actions/filters';

export class AssetCounts extends React.Component {
  render() {
    const { assetCounts, fetchingAssetCounts, fetchingAssetCountsError } = this.props;
    const { I18n } = this.props;

    const scope = 'internal_asset_manager.header.asset_counts';
    const assetTypeTranslation = (key, count) => I18n.t(key, { count, scope });

    const sortedAssetCounts = _(assetCounts).toPairs().sortBy(0).fromPairs().value();

    const assetCountItems = _.map(sortedAssetCounts, (assetCount, assetType) => {
      if (assetCount === 0) return;
      let assetTypeName;

      if (this.props.filters.assetTypes === 'workingCopies') {
        assetTypeName = assetTypeTranslation('workingCopies', assetCount);
      } else {
        assetTypeName = assetTypeTranslation(assetType, assetCount);
      }

      let assetCountLink = null;
      if (this.props.filters.assetTypes === assetType || this.props.filters.assetTypes === 'workingCopies') {
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
  }),
  I18n: PropTypes.object
};

const mapStateToProps = (state) => ({
  assetCounts: state.assetCounts.values,
  fetchingAssetCounts: state.assetCounts.fetchingAssetCounts,
  fetchingAssetCountsError: state.assetCounts.fetchingAssetCountsError,
  filters: state.filters
});

const mapDispatchToProps = (dispatch) => ({
  changeAssetType: (value) => dispatch(filters.changeAssetType(value))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(AssetCounts));
