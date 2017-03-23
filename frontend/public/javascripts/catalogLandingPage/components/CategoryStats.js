import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import CategoryStat from './CategoryStat';

export class CategoryStats extends React.Component {
  render() {
    var { categoryStats, showStats } = this.props;

    if (!showStats || !_.some(categoryStats)) {
      return null;
    }

    // Filters out zero-valued results, then sorts the remaining results by category name.
    const outputStats = _(categoryStats).toPairs().reject([1, 0]).sortBy(0).fromPairs().value();

    return (
      <div className="catalog-landing-page-stats">
        <h2 className="stats-title">{_.get(I18n, 'category_stats.about')}</h2>
        <div className="stat-counts">
          {_.map(outputStats, (count, name) => {
            const countKey = count === 1 ? 'singular' : 'plural';
            const nameTranslation = _.get(I18n, `category_stats.${name}.${countKey}`);
            return <CategoryStat key={name} name={nameTranslation} count={count} />;
          })}
        </div>
      </div>
    );
  }
}

CategoryStats.propTypes = {
  categoryStats: PropTypes.object,
  showStats: PropTypes.bool
};

const mapStateToProps = (state) => ({
  categoryStats: state.categoryStats,
  showStats: state.header.showStats
});

export default connect(mapStateToProps)(CategoryStats);
