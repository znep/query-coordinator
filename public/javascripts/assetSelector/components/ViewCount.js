import React, { PropTypes } from 'react';

export const ViewCount = (props) => {
  const count = props.count;
  const isPlural = count !== 1; // TODO: is there an I18n pluralize function for this?

  return (
    <div className="view-count">
      {count} {isPlural ? 'Results' : 'Result'}{/* TODO: localization */}
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
