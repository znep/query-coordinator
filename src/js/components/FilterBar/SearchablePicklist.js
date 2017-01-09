import _ from 'lodash';
import React, { PropTypes } from 'react';
import { translate as t } from '../../common/I18n';
import Picklist from '../Picklist';

export const SearchablePicklist = React.createClass({
  propTypes: {
    options: PropTypes.arrayOf(PropTypes.object),
    value: PropTypes.string,
    hasSearchError: PropTypes.bool,
    onChangeSearchTerm: PropTypes.func.isRequired,
    onSelection: PropTypes.func.isRequired
  },

  componentDidMount() {
    if (this.search) {
      this.search.focus();
    }
  },

  onChangeSearchTerm(event) {
    this.props.onChangeSearchTerm(event.target.value);
  },

  renderPicklist() {
    const { options, value, hasSearchError, onSelection } = this.props;

    if (hasSearchError) {
      return (
        <div className="alert error">
          {t('filter_bar.search_error')}
        </div>
      );
    }

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
      onSelection: onSelection
    };

    return <Picklist {...picklistProps} />;
  },

  renderSearch() {
    const { value } = this.props;

    return (
      <div className="searchable-picklist-input-container">
        <span className="socrata-icon-search" role="presentation" />
        <input
          className="searchable-picklist-input"
          type="text"
          aria-label={t('filter_bar.search')}
          value={value || ''}
          ref={(el) => this.search = el}
          onChange={this.onChangeSearchTerm} />
      </div>
    );
  },

  render() {
    return (
      <div className="searchable-picklist">
        {this.renderSearch()}
        {this.renderPicklist()}
      </div>
    );
  }
});

export default SearchablePicklist;
