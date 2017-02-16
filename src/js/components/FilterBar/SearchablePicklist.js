import _ from 'lodash';
import React, { PropTypes } from 'react';
import { translate as t } from '../../common/I18n';
import SocrataIcon from '../SocrataIcon';
import Picklist from '../Picklist';

export const SearchablePicklist = React.createClass({
  propTypes: {
    options: PropTypes.arrayOf(PropTypes.object),
    value: PropTypes.string,
    selectedValues: PropTypes.arrayOf(PropTypes.string),
    hasSearchError: PropTypes.bool,
    onChangeSearchTerm: PropTypes.func.isRequired,
    onSelection: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
    onClickSelectedValue: PropTypes.func
  },

  getInitialState() {
    return {
      selectedValuesPickListItem: null
    };
  },

  componentDidMount() {
    if (this.search) {
      this.search.focus();
    }
  },

  onChangeSearchTerm(event) {
    this.props.onChangeSearchTerm(event.target.value);
  },

  onClickValue(selectedValue) {
    this.setState({ selectedValuesPickListItem: selectedValue.value });
    this.props.onClickSelectedValue(selectedValue.value);
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

  renderSelectedValuesPicklist() {
    const { selectedValues } = this.props;

    if (!_.isEmpty(selectedValues)) {
      const { onBlur } = this.props;

      const picklistProps = {
        options: selectedValues.map((selectedValue) => {
          return {
            title: selectedValue,
            value: selectedValue,
            group: t('filter_bar.text_filter.selected_values'),
            displayCloseIcon: true,
            iconName: 'filter'
          };
        }),
        onSelection: this.onClickValue,
        onBlur
      };

      return (
        <div className="picklist-selected-values">
          <Picklist {...picklistProps} />
        </div>
      );
    }
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

    return <Picklist {...picklistProps} />;
  },

  render() {
    return (
      <div className="searchable-picklist">
        {this.renderSearch()}
        {this.renderSelectedValuesPicklist()}
        {this.renderPicklist()}
      </div>
    );
  }
});

export default SearchablePicklist;
