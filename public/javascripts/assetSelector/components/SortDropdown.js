import React, { PropTypes } from 'react';
import { Dropdown } from 'socrata-components';
import _ from 'lodash';

const DEFAULT_SORT = 'relevance';

export const SortDropdown = (props) => {
  const sortOptions = [
    {
      title: _.get(I18n, 'asset_selector.results_container.sort.sort_types.most_relevant', 'Most Relevant'),
      value: 'relevance'
    },
    {
      title: _.get(I18n, 'asset_selector.results_container.sort.sort_types.most_accessed', 'Most Accessed'),
      value: 'page_views_total'
    },
    {
      title: _.get(I18n, 'asset_selector.results_container.sort.sort_types.alphabetical', 'Alphabetical'),
      value: 'name'
    },
    {
      title: _.get(I18n, 'asset_selector.results_container.sort.sort_types.recently_added', 'Recently Added'),
      value: 'createdAt'
    },
    {
      title: _.get(I18n,
        'asset_selector.results_container.sort.sort_types.recently_created', 'Recently Created'),
      value: 'updatedAt'
    }
  ];

  return (
    <div className="sort-dropdown">
      {_.get(I18n, 'asset_selector.results_container.sort.sort_by', 'Sort by')}
      <Dropdown
        onSelection={(option) => { props.onSelection(option); }}
        options={sortOptions}
        value={props.value} />
    </div>
  );
};

SortDropdown.propTypes = {
  onSelection: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
};

SortDropdown.defaultProps = {
  onSelection: _.noop,
  value: DEFAULT_SORT
};

export default SortDropdown;
