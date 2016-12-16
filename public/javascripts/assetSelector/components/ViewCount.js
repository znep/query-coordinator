import React, { PropTypes } from 'react';
import { getViewCountLabel } from '../../datasetLandingPage/lib/viewCardHelpers';

export const ViewCount = (props) => {
  const isPlural = props.count !== 1; // TODO: is there an I18n pluralize function for this?

  return (
    <div className="view-count">
      {getViewCountLabel(props.count)} {isPlural ? 'Results' : 'Result'}{/* TODO: localization */}
    </div>
  );
};

ViewCount.propTypes = {
  count: PropTypes.number.isRequired
};

ViewCount.defaultProps = {
  count: 0
};

export default ViewCount;
