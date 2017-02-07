import React, { Component, PropTypes } from 'react';
import { getViewCountLabel } from '../../helpers/viewCardHelpers';

export class ResultCount extends Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    const { currentPage, resultsPerPage, total } = this.props;
    const pageResults = {
      first: (currentPage - 1) * resultsPerPage + 1,
      last: Math.min(currentPage * resultsPerPage, total)
    };

    return (
      <div className="result-count">
        {pageResults.first}-{pageResults.last}
        {` ${_.get(I18n, 'asset_selector.results_container.of', 'of')} `}
        {getViewCountLabel(total)}
      </div>
    );
  }
}

ResultCount.propTypes = {
  currentPage: PropTypes.number.isRequired,
  resultsPerPage: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired
};

ResultCount.defaultProps = {
  currentPage: 1,
  resultsPerPage: 6,
  total: 0
};

export default ResultCount;
