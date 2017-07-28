import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';

import * as filters from '../actions/filters';

export class AssetCounts extends React.Component {
  render() {
    const { assetCounts, fetchingAssetCounts, fetchingAssetCountsError } = this.props;

    const assetTypeTranslation = (key) => _.get(I18n, `header.asset_counts.${key}`);

    const sortedAssetCounts = _(assetCounts).toPairs().sortBy(0).fromPairs().value();

    const assetCountItems = _.map(sortedAssetCounts, (assetCount, assetType) => {
      if (assetCount === 0) return;
      // TODO: remove once we're on i18n-js:
      const countKey = assetCount === 1 ? 'one' : 'other';
      let assetTypeName;

      if (this.props.filters.assetTypes === 'workingCopies') {
        assetTypeName = assetTypeTranslation(`workingCopies.${countKey}`);
      } else {
        assetTypeName = assetTypeTranslation(`${assetType}.${countKey}`);
      }

      let assetCountLink = null;
      if (this.props.filters.assetTypes === assetType || this.props.filters.assetTypes == 'workingCopies') {
        assetCountLink = assetCount;
      } else {
        assetCountLink = (
          <a onClick={() => this.props.changeAssetType(assetType)} >
            {assetCount}
          </a>
        );
      }

      return (
        <div className={`asset-counts-item ${assetType}`} key={assetType}>
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
    datalenses: PropTypes.number,
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
  assetCounts: state.assetCounts.values,
  fetchingAssetCounts: state.assetCounts.fetchingAssetCounts,
  fetchingAssetCountsError: state.assetCounts.fetchingAssetCountsError,
  filters: state.filters
});

const mapDispatchToProps = (dispatch) => ({
  changeAssetType: (value) => dispatch(filters.changeAssetType(value))
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetCounts);
