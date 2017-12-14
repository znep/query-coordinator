import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import Dropdown from 'common/components/Dropdown';
import I18n from 'common/i18n';
import { changeSortOrder } from '../actions/sort_order';

export class SortDropdown extends Component {
  render() {
    const scope = 'shared.asset_browser.result_card_container.sort_dropdown';

    const sortOptions = [
      { title: I18n.t('most_relevant', { scope }), value: 'relevance' },
      { title: I18n.t('most_accessed', { scope }), value: 'page_views_total' },
      { title: I18n.t('alphabetical', { scope }), value: 'name' },
      { title: I18n.t('recently_added', { scope }), value: 'createdAt' },
      { title: I18n.t('recently_updated', { scope }), value: 'lastUpdatedDate' }
    ];

    return (
      <div className="sort-dropdown">
        {I18n.t('sort_by', { scope })}
        <Dropdown
          onSelection={this.props.changeSortOrder}
          options={sortOptions}
          size="medium"
          value={_.get(this.props.order, 'value')} />
      </div>
    );
  }
}

SortDropdown.propTypes = {
  changeSortOrder: PropTypes.func.isRequired,
  order: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  order: state.catalog.order
});

const mapDispatchToProps = (dispatch) => ({
  changeSortOrder: (columnName) => dispatch(changeSortOrder(columnName))
});

export default connect(mapStateToProps, mapDispatchToProps)(SortDropdown);
