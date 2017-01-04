import React, { PropTypes } from 'react';
import { getViewCountLabel } from '../../datasetLandingPage/lib/viewCardHelpers';

export const ResultCount = (props) => (
  <div className="result-count">
    {getViewCountLabel(props.count)}
  </div>
);

ResultCount.propTypes = {
  count: PropTypes.number.isRequired
};

ResultCount.defaultProps = {
  count: 0
};

export default ResultCount;
