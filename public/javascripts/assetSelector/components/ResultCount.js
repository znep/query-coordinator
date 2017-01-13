import React, { PropTypes } from 'react';
import { getViewCountLabel } from '../../datasetLandingPage/lib/viewCardHelpers';

export const ResultCount = (props) => {
  const pageResults = {
    first: (props.currentPage - 1) * props.resultsPerPage + 1,
    last: Math.min(props.currentPage * props.resultsPerPage, props.total)
  };

  return (
    <div className="result-count">
      {pageResults.first}-{pageResults.last} of {getViewCountLabel(props.total)}
    </div>
  );
};

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
