import PropTypes from 'prop-types';
import React from 'react';
import { Dropdown } from 'common/components';
import _ from 'lodash';

const DEFAULT_SORT = 'relevance';

export class SortDropdown extends React.Component {
  render() {
    const sortOptions = [
      {
        title: _.get(I18n, 'common.asset_selector.results_container.sort.sort_types.most_relevant'),
        value: 'relevance'
      },
      {
        title: _.get(I18n, 'common.asset_selector.results_container.sort.sort_types.most_accessed'),
        value: 'page_views_total'
      },
      {
        title: _.get(I18n, 'common.asset_selector.results_container.sort.sort_types.alphabetical'),
        value: 'name'
      },
      {
        title: _.get(I18n, 'common.asset_selector.results_container.sort.sort_types.recently_added'),
        value: 'createdAt'
      },
      {
        title: _.get(I18n, 'common.asset_selector.results_container.sort.sort_types.recently_updated'),
        value: 'updatedAt'
      }
    ];

    return (
      <div className="sort-dropdown">
        {_.get(I18n, 'common.asset_selector.results_container.sort.sort_by')}
        <Dropdown
          onSelection={(option) => { this.props.onSelection(option); }}
          options={sortOptions}
          value={this.props.value} />
      </div>
    );
  }
}

SortDropdown.propTypes = {
  onSelection: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
};

SortDropdown.defaultProps = {
  onSelection: _.noop,
  value: DEFAULT_SORT
};

export default SortDropdown;
