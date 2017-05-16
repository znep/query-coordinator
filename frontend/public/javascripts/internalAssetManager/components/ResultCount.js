import React, { PropTypes } from 'react';
import { getViewCountLabel } from '../../common/helpers/viewCardHelpers';

export class ResultCount extends React.Component {
  render() {
    const { currentPage, resultsPerPage, total } = this.props;
    const pageResults = {
      first: (currentPage - 1) * resultsPerPage + 1,
      last: Math.min(currentPage * resultsPerPage, total)
    };

    return (
      <div className="result-count">
        {/* TODO: localize with i18n-js */}
        {pageResults.first}-{pageResults.last} of {getViewCountLabel(total)}
      </div>
    );
  }
}

ResultCount.propTypes = {
  currentPage: PropTypes.number.isRequired,
  resultsPerPage: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired
};

export default ResultCount;
