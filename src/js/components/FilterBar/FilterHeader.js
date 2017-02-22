import React, { PropTypes } from 'react';

export default function FilterHeader({ name }) {
  return (
    <div className="filter-control-title">
      <h3>{name}</h3>
    </div>
  );
}

FilterHeader.propTypes = {
  name: PropTypes.string
};
