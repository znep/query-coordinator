import React, { PropTypes } from 'react';
import _ from 'lodash';
import { Picklist } from 'common/components';
import { handleEnter } from 'common/helpers/keyPressHelpers';

export class SearchboxFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      filteredOptions: [],
      inputValue: this.props.value || ''
    };

    this.defaultValue = {
      title: '',
      value: null
    };

    _.bindAll(this, 'onEnter', 'onInputChange', 'onInputFocus', 'onInputBlur', 'onPicklistFocus',
      'onPicklistBlur', 'onSelection', 'getPicklistOptions', 'filterOptions');
  }

  componentDidMount() {
    this.filterOptions();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ inputValue: nextProps.value || '' });
  }

  onEnter(event) {
    event.preventDefault();

    // If user hits "enter" when the input is blank, re-fetch the original results.
    if (!event.target.value) {
      this.props.onSelection(this.defaultValue);
    }
  }

  onInputChange(event) {
    this.setState({ inputValue: event.target.value }, this.filterOptions);
  }

  onInputFocus() {
    this.setState({ inputFocused: true });
  }

  onInputBlur() {
    // Defer, which allows tab focus to find the picklist before it is hidden.
    _.defer(() => { this.setState({ inputFocused: false }); });
  }

  onPicklistFocus() {
    this.setState({ picklistFocused: true });
  }

  onPicklistBlur() {
    this.setState({ picklistFocused: false });
  }

  onSelection(value) {
    this.setState({ inputValue: value.title, inputFocused: false, picklistFocused: false });
    this.props.onSelection(value);
    this.filterInput.blur();
  }

  getPicklistOptions() {
    return [
      { title: _.get(I18n, 'filters.searchbox_filter.all'), value: null }
    ].concat(this.state.filteredOptions);
  }

  filterOptions() {
    const filteredOptions = _.filter(this.props.options, (option) => (
      _.toLower(option.title).indexOf(_.toLower(this.state.inputValue)) > -1
    ));

    this.setState({ filteredOptions });
  }

  render() {
    const picklistAttributes = {
      options: this.getPicklistOptions(),
      value: this.props.value,
      ref: ref => this.picklistRef = ref,
      onSelection: this.onSelection,
      onFocus: this.onPicklistFocus,
      onBlur: this.onPicklistBlur
    };

    const picklist = this.state.inputFocused || this.state.picklistFocused ?
      <div className="picklist-wrapper">
        <Picklist {...picklistAttributes} />
      </div> : null;

    return (
      <div className="searchbox-filter">
        <input
          className="text-input []"
          id={this.props.inputId}
          type="text"
          ref={(input) => { this.filterInput = input; }}
          onChange={this.onInputChange}
          onFocus={this.onInputFocus}
          onBlur={this.onInputBlur}
          onKeyDown={handleEnter(this.onEnter)}
          placeholder={this.props.placeholder}
          value={this.state.inputValue} />
        <span className="search-icon socrata-icon-search" />
        {picklist}
      </div>
    );
  }
}

SearchboxFilter.propTypes = {
  inputId: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  onSelection: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string
};

export default SearchboxFilter;
