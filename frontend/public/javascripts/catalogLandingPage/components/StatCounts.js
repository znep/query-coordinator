import _ from 'lodash';
import React, { PropTypes } from 'react';
import CategoryStat from './CategoryStat';

export class StatCounts extends React.Component {
  render() {
    var { categoryStats } = this.props;

    // Filters out zero-valued results, then sorts the remaining results by category name
    const outputStats = _(categoryStats).toPairs().reject([1, 0]).sortBy(0).fromPairs().value();

    if (!_.some(outputStats)) {
      return null;
    }

    return (
      <div className="stat-counts">
        {_.map(outputStats, (count, name) => {
          // TODO: we can get rid of the "one" and "other" conditional logic once we're using i18n-js
          const countKey = count === 1 ? 'one' : 'other';
          const nameTranslation = _.get(I18n, `category_stats.${name}.${countKey}`);
          return <CategoryStat key={name} name={nameTranslation} count={count} />;
        })}
      </div>
    );
  }
}

StatCounts.propTypes = {
  categoryStats: PropTypes.object.isRequired
};

StatCounts.defaultProps = {
  categoryStats: {}
};

export default StatCounts;
