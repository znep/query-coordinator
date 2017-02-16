import _ from 'lodash';
import React, { PropTypes } from 'react';
import { translate as t } from '../../common/I18n';
import SocrataIcon from '../SocrataIcon';
import Picklist from '../Picklist';

export const SearchablePicklist = React.createClass({
  propTypes: {
    options: PropTypes.arrayOf(PropTypes.object),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    selectedOptions: PropTypes.arrayOf(PropTypes.object),
    hasSearchError: PropTypes.bool,
    onChangeSearchTerm: PropTypes.func.isRequired,
    onSelection: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
    onClickSelectedOption: PropTypes.func
  },

  componentDidMount() {
    if (this.search) {
      this.search.focus();
    }
  },

  onChangeSearchTerm(event) {
    this.props.onChangeSearchTerm(event.target.value);
  },

  onClickSelectedOption(selectedOption) {
    this.props.onClickSelectedOption(selectedOption);
  },

  renderSearch() {
    const { value } = this.props;

    return (
      <div className="searchable-picklist-input-container">
        <SocrataIcon name="search" />
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

  renderSelectedOptionsPicklist() {
    const { selectedOptions, onBlur } = this.props;

    if (_.isEmpty(selectedOptions)) {
      return;
    }

    const picklistProps = {
      options: selectedOptions.map((selectedOption) => {
        return {
          group: t('filter_bar.text_filter.selected_values'),
          displayCloseIcon: true,
          iconName: 'filter',
          ...selectedOption
        };
      }),
      onSelection: this.onClickSelectedOption,
      onBlur
    };

    return (
      <div className="picklist-selected-options">
        <Picklist {...picklistProps} />
      </div>
    );
  },

  renderPicklist() {
    const { options, value, hasSearchError, onSelection, onBlur } = this.props;

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
      onSelection,
      onBlur
    };

    return (
      <div className="picklist-suggested-options">
        <Picklist {...picklistProps} />
      </div>
    );
  },

  render() {
    return (
      <div className="searchable-picklist">
        {this.renderSearch()}
        {this.renderSelectedOptionsPicklist()}
        {this.renderPicklist()}
      </div>
    );
  }
});

export default SearchablePicklist;
