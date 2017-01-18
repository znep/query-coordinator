import React, { PropTypes } from 'react';
import { Dropdown } from 'socrata-components';
import _ from 'lodash';

const DEFAULT_SORT = 'relevance';

export const SortDropdown = (props) => {
  const options = [
    { title: 'Most Relevant', value: 'relevance' }, /* TODO: localization */
    { title: 'Most Accessed', value: 'page_views_total' },
    { title: 'Alphabetical', value: 'name' },
    { title: 'Recently Added', value: 'createdAt' },
    { title: 'Recently Updated', value: 'updatedAt' }
  ];

  return (
    <div className="sort-dropdown">
      Sort by{/* TODO: localization */}
      <Dropdown
        onSelection={(option) => { props.onSelection(option); }}
        options={options}
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
