import _ from 'lodash';
import React, { PropTypes } from 'react';
import { translate as t } from '../../common/I18n';
import SocrataIcon from '../SocrataIcon';
import Picklist from '../Picklist';

export const SearchablePicklist = React.createClass({
  propTypes: {
    options: PropTypes.arrayOf(PropTypes.object),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    onChangeSearchTerm: PropTypes.func.isRequired,
    onSelection: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired
  },

  onChangeSearchTerm(event) {
    this.props.onChangeSearchTerm(event.target.value);
  },

  renderSearch() {
    const { value } = this.props;

    return (
      <div className="add-filter-picklist-input-container">
        <SocrataIcon name="search" />
        <input
          className="add-filter-picklist-input"
          type="text"
          aria-label={t('filter_bar.search')}
          value={value || ''}
          ref={(el) => this.search = el}
          autoFocus={true}
          onChange={this.onChangeSearchTerm} />
      </div>
    );
  },

  renderPicklist() {
    const { options, value, onSelection, onBlur } = this.props;

    if (_.isEmpty(options)) {
      return (
        <div className="alert warning">
          {t('filter_bar.no_options_found')}
        </div>
      );
    }

    const picklistProps = {
      options,
      value,
      onSelection,
      onBlur
    };

    return (
      <div className="add-filter-picklist-suggested-options">
        <Picklist {...picklistProps} />
      </div>
    );
  },

  render() {
    return (
      <div className="add-filter-picklist">
        {this.renderSearch()}
        <div className="add-filter-picklist-options">
          {this.renderPicklist()}
        </div>
      </div>
    );
  }
});

export default SearchablePicklist;
