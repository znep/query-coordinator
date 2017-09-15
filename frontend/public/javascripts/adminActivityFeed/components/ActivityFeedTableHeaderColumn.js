import PropTypes from 'prop-types';
import React from 'react';

import './ActivityFeedTableHeaderColumn.scss';

export default class ActivityFeedTableHeaderColumn extends React.Component {
  render() {
    const { column, sorting } = this.props;
    const sorted = sorting && sorting.column === column;

    let sortingIndicator = null;
    if (sorted) {
      const indicatorIcon = sorting.direction === 'asc' ? 'socrata-icon-arrow-up' : 'socrata-icon-arrow-down';
      sortingIndicator = <span className={`sorting-indicator ${indicatorIcon}`} />;
    }

    return (
      <th data-column-sorted={sorted} data-column={column.id} className='activity-feed-table-header-column'>
        { column.title }
        { sortingIndicator }
      </th>
    );
  }
}

ActivityFeedTableHeaderColumn.propTypes = {
  column: PropTypes.any.isRequired,
  sorting: PropTypes.shape({
    direction: PropTypes.oneOf(['asc', 'desc']).isRequired,
    column:  PropTypes.object.isRequired
  }),
  onClick: PropTypes.func
};

