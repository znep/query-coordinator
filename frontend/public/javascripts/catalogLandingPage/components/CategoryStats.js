import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import CategoryStat from './CategoryStat';

const CategoryStats = (props) => {
  var { categoryStats } = props;

  const sortedStats = () => (_(categoryStats).toPairs().sortBy(0).fromPairs().value());
  const filteredStats = () => (_(sortedStats()).toPairs().reject([1, 0]).fromPairs().value());

  if (_.keys(categoryStats).length <= 0) { return null; }

  return (
    <div className="catalog-landing-page-stats">
      <h2 className="stats-title">About this Category</h2>
      <div className="stat-counts">
        {_.map(filteredStats(), (count, name) =>
          <CategoryStat key={name} name={_.get(I18n, `category_stats.${name}`, name)} count={count} />)}
      </div>
    </div>
  );
};

CategoryStats.propTypes = {
  categoryStats: PropTypes.object
};

function mapStateToProps(state) {
  return state; // We directly access the categoryStats prop in the component
}

export default connect(mapStateToProps)(CategoryStats);
