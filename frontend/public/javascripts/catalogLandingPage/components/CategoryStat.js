import React, { PropTypes } from 'react';

const CategoryStat = (props) => {
  const { name, count } = props;

  return (
    <div className="stat-item">
      <div className="stat-count">{count}</div>
      <div className="stat-name">{name}</div>
    </div>
  );
};

CategoryStat.propTypes = {
  name: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired
};

export default CategoryStat;
