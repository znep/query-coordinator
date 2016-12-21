import React, { PropTypes } from 'react';
import { getViewCountLabel } from '../../datasetLandingPage/lib/viewCardHelpers';

export const ViewCount = (props) => (
  <div className="view-count">
    {getViewCountLabel(props.count)}
  </div>
);

ViewCount.propTypes = {
  count: PropTypes.number.isRequired
};

ViewCount.defaultProps = {
  count: 0
};

export default ViewCount;
