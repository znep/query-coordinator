import React, { PropTypes } from 'react';
import { getViewCountLabel } from '../../datasetLandingPage/lib/viewCardHelpers';

export const ResultCount = (props) => (
  <div className="view-count">
    {getViewCountLabel(props.count)}
  </div>
);

ResultCount.propTypes = {
  count: PropTypes.number.isRequired
};

ResultCount.defaultProps = {
  count: 4 // todo
};

export default ResultCount;
