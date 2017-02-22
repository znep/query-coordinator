import _ from 'lodash';
import React, { PropTypes } from 'react';
import { translate as t } from '../../common/I18n';
import { ENTER } from '../../common/keycodes';
import SocrataIcon from '../SocrataIcon';
import Picklist from '../Picklist';

export const SearchablePicklist = React.createClass({
  propTypes: {
    options: PropTypes.arrayOf(PropTypes.object),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    selectedOptions: PropTypes.arrayOf(PropTypes.object),
    onChangeSearchTerm: PropTypes.func.isRequired,
    onSelection: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
    onClickSelectedOption: PropTypes.func,
    canAddSearchTerm: PropTypes.func
  },

  getInitialState() {
    return {
      isValidating: false,
      isError: false
    };
  },

  componentDidMount() {
    this.isMounted = true;

    if (this.search) {
      this.search.focus();
    }
  },

  componentWillUnmount() {
    this.isMounted = false;
  },

  onChangeSearchTerm(event) {
    this.props.onChangeSearchTerm(event.target.value);
    this.setState({ isError: false });
  },

  onClickSelectedOption(selectedOption) {
    this.props.onClickSelectedOption(selectedOption);
  },

  onKeyUpSearch(event) {
    const { canAddSearchTerm } = this.props;

    if (event.keyCode === ENTER && _.isFunction(canAddSearchTerm)) {
      this.setState({ isValidating: true });

      // This code runs asyncrhonously and potentially
      // after the component is removed. Make sure we're still
      // mounted.
      canAddSearchTerm(event.target.value).
        then(() => {
          if (this.isMounted) {
            this.setState({ isValidating: false });
          }
        }).
        catch(() => {
          if (this.isMounted) {
            _.defer(this.focusAndSelectSearchInput);
            this.setState({ isError: true, isValidating: false });
          }
        });
    }
  },

  focusAndSelectSearchInput() {
    if (this.search) {
      this.search.focus();
      this.search.setSelectionRange(0, this.search.value.length);
    }
  },

  renderSearch() {
    const { value } = this.props;
    const { isValidating, isError } = this.state;
    const loadingSpinner = isValidating ? <span className="spinner-default"></span> : null;

    return (
      <div className="searchable-picklist-input-container">
        <SocrataIcon name="search" />
        <input
          className="searchable-picklist-input"
          type="text"
          aria-label={t('filter_bar.search')}
          value={value || ''}
          ref={(el) => this.search = el}
          onKeyUp={this.onKeyUpSearch}
          onChange={this.onChangeSearchTerm}
          aria-invalid={isError}
          disabled={isValidating} />
        {loadingSpinner}
      </div>
    );
  },

  renderSelectedOptionsPicklist() {
    const { selectedOptions, onBlur, value } = this.props;
    const { isValidating } = this.state;

    if (_.isEmpty(selectedOptions)) {
      return;
    }

    const picklistProps = {
      options: selectedOptions.map((selectedOption) => {
        return {
          group: t('filter_bar.text_filter.selected_values'),
          ...selectedOption
        };
      }),
      onSelection: this.onClickSelectedOption,
      onBlur,
      disabled: isValidating,
      value
    };

    return (
      <div className="searchable-picklist-selected-options">
        <Picklist {...picklistProps} />
      </div>
    );
  },

  renderPicklist() {
    const { options, value, onSelection, onBlur } = this.props;
    const { isValidating } = this.state;

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
      onBlur,
      disabled: isValidating
    };

    return (
      <div className="searchable-picklist-suggested-options">
        <Picklist {...picklistProps} />
      </div>
    );
  },

  renderError() {
    return this.state.isError ?
      <div className="alert warning">{t('filter_bar.text_filter.keyword_not_found')}</div> :
      null;
  },

  render() {
    return (
      <div className="searchable-picklist">
        {this.renderSearch()}
        {this.renderError()}
        <div className="searchable-picklist-options">
          {this.renderSelectedOptionsPicklist()}
          {this.renderPicklist()}
        </div>
      </div>
    );
  }
});

export default SearchablePicklist;
