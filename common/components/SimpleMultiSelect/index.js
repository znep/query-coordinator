import React, { Component } from 'react';
import PropTypes from 'prop-types';

import MultiSelect from '../MultiSelect';

/**
 * Simple implementation of MultiSelect that operates on a list of strings.
 * Uses dumb text matching to filter results.
 * When the selected options change, the "onSelectedOptionsChanged" callback will be called.
 */
class SimpleMultiSelect extends Component {
  static propTypes = {
    // maximum number of options that can be selected
    maxSelectedOptions: PropTypes.number,

    // options to choose from
    options: PropTypes.arrayOf(PropTypes.string),

    // callback for when selected options change
    onSelectedOptionsChanged: PropTypes.func
  }

  static defaultProps = {
    maxSelectedOptions: null,
    options: [],
    onSelectedOptionsChanged: () => {}
  }

  state = {
    // what's in the text box
    currentQuery: '',

    // list of options that have been selected
    selectedOptions: [],

    // filtered list of options (based on query and selected options)
    availableOptions: []
  }

  componentWillMount() {
    // when the component first mounts, set the available options to ALL the options
    // as the user types, the list gets filtered
    this.setState({ availableOptions: this.props.options });
  }

  onAddSelectedOption = (option) => {
    const { onSelectedOptionsChanged, options } = this.props;

    const newSelectedOptions = [
      ...this.state.selectedOptions,
      option
    ];

    // here we also blank out the current query
    this.setState({
      currentQuery: '',
      selectedOptions: newSelectedOptions,

      // this "un-filters" the options, minue the already selected ones
      availableOptions: this.filteredOptions(options, newSelectedOptions, '')
    });

    onSelectedOptionsChanged(newSelectedOptions);
  }

  onCurrentQueryChanged = (event) => {
    const currentQuery = event.target.value;
    const { options } = this.props;
    const { selectedOptions } = this.state;

    // filter out our options based on the input
    this.setState({
      currentQuery,
      availableOptions: this.filteredOptions(options, selectedOptions, currentQuery)
    });
  }

  onRemoveSelectedOption = (optionToRemove) => {
    const { onSelectedOptionsChanged, options } = this.props;
    const { currentQuery, selectedOptions } = this.state;

    const indexToRemove = selectedOptions.findIndex(option => option === optionToRemove);

    if (indexToRemove !== -1) {
      const newSelectedOptions = [...selectedOptions];
      newSelectedOptions.splice(indexToRemove, 1);

      // re-filter the options so that the option that was removed can be selected again
      this.setState({
        selectedOptions: newSelectedOptions,
        availableOptions: this.filteredOptions(options, newSelectedOptions, currentQuery)
      });

      // call the callback, if we have one
      if (onSelectedOptionsChanged) {
        onSelectedOptionsChanged(newSelectedOptions);
      }
    } else {
      console.error(`Unable to find selected option to remove: ${optionToRemove}`);
    }
  }

  // Filters out the options based on the current query and the selected options
  filteredOptions = (options, selectedOptions, currentQuery) => {
    return options.filter(
      option => {
        const optionIncludesQuery =
          // if the current query is empty, we just include all the non-selected options
          currentQuery === '' ||

          // use dumb text matching to determine if we should show the result
          option.toLowerCase().includes(currentQuery.toLowerCase());

        const optionNotAlreadySelected =
          // no selected options means it's definitely not selected
          !selectedOptions || selectedOptions.length === 0 ||

          // check if the selected options contains this option
          !selectedOptions.includes(option);

        return optionIncludesQuery && optionNotAlreadySelected;
      }
    );
  }

  renderOption = (option) => {
    return (
      <div>
        {option}
      </div>
    );
  }

  render() {
    const { maxSelectedOptions } = this.props;

    const {
      availableOptions,
      currentQuery,
      selectedOptions
    } = this.state;

    const multiSelectProps = {
      maxSelectedOptions,
      options: availableOptions,
      currentQuery,
      selectedOptions
    };

    return (
      <MultiSelect
        // set this to "true" since we want the results to show up whenever the
        // input is focused; default behavior is to only show options when the user types something
        shouldRenderResultsWhenQueryIsEmpty
        onAddSelectedOption={this.onAddSelectedOption}
        onCurrentQueryChanged={this.onCurrentQueryChanged}
        onRemoveSelectedOption={this.onRemoveSelectedOption}
        renderSelectedOptionContents={this.renderOption}
        renderOption={this.renderOption}
        {...multiSelectProps} />
    );
  }
}

export default SimpleMultiSelect;
