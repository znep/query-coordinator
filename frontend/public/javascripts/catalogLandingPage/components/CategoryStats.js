import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import StatCounts from './StatCounts';

export class CategoryStats extends React.Component {
  render() {
    var { categoryStats, showStats } = this.props;

    if (!showStats || !_.some(categoryStats)) {
      return null;
    }

    return (
      <div className="catalog-landing-page-stats">
        <h2 className="stats-title">{_.get(I18n, 'category_stats.about')}</h2>
        <StatCounts categoryStats={categoryStats} />
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
