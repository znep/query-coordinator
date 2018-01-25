import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import ceteraUtils from 'common/cetera/utils';
import I18n from 'common/i18n';
import { changeSortOrder } from '../actions/sort_order';
import ResultCard from './result_card';

export class ResultCardContainer extends Component {
  render() {
    const { onAssetSelected, onClose, order, results, selectMode } = this.props;

    const resultCards = ceteraUtils.mapToAssetSelectorResult(results).map((result, i) => (
      <ResultCard key={i} {...result} onClose={onClose} onSelect={onAssetSelected} selectMode={selectMode} />
    ));

    return (
      <div className="result-card-container">
        {resultCards}
      </div>
    );
  }
}

ResultCardContainer.propTypes = {
  changeSortOrder: PropTypes.func.isRequired,
  onAssetSelected: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  order: PropTypes.object,
  results: PropTypes.array.isRequired,
  selectMode: PropTypes.bool.isRequired
};

ResultCardContainer.defaultProps = {
  onAssetSelected: _.noop,
  order: undefined
};

const mapStateToProps = state => ({
  order: state.catalog.order,
  results: state.catalog.results,
  selectMode: state.assetBrowserProps.selectMode
});

const mapDispatchToProps = dispatch => ({
  changeSortOrder: (columnName) => dispatch(changeSortOrder(columnName))
});

export default connect(mapStateToProps, mapDispatchToProps)(ResultCardContainer);
