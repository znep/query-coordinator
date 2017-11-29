import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import I18n from '../../i18n';
import MultiSelectOption from './MultiSelectOption';

class MultiSelectOptionList extends Component {
  static propTypes = {
    currentQuery: PropTypes.string.isRequired,
    mouseMoved: PropTypes.bool.isRequired,
    maxSelectedOptions: PropTypes.number,
    noOptionsMessage: PropTypes.string.isRequired,
    onAddSelectedOption: PropTypes.func.isRequired,
    onSelectedOptionIndexChange: PropTypes.func.isRequired,
    options: PropTypes.array,
    optionsVisible: PropTypes.bool.isRequired,
    renderOption: PropTypes.func.isRequired,
    selectedOptions: PropTypes.array,
    selectedOptionIndex: PropTypes.number,
    setUsingMouse: PropTypes.func.isRequired,
    shouldRenderResultsWhenQueryIsEmpty: PropTypes.bool.isRequired,
    skipRootBlur: PropTypes.func.isRequired,
    usingMouse: PropTypes.bool.isRequired
  };

  static defaultProps = {
    noOptionsMessage: I18n.t('shared.components.multiselect.no_results'),
    options: null,
    selectedOptionIndex: null
  };

  renderOptions = () => {
    const {
      mouseMoved,
      maxSelectedOptions,
      onAddSelectedOption,
      onSelectedOptionIndexChange,
      options,
      renderOption,
      selectedOptionIndex,
      selectedOptions,
      setUsingMouse,
      skipRootBlur,
      usingMouse
    } = this.props;

    const optionProps = {
      mouseMoved,
      maxSelectedOptions,
      onAddSelectedOption,
      onSelectedOptionIndexChange,
      renderOption,
      selectedOptions,
      setUsingMouse,
      skipRootBlur,
      usingMouse
    };

    return options.map((option, index) => (
      <MultiSelectOption
        active={selectedOptionIndex === index}
        index={index}
        key={`multiselect-option-${index}`}
        option={option}
        {...optionProps} />
    ));
  }

  renderContents = () => {
    const { noOptionsMessage, options } = this.props;

    if (_.isNil(options)) {
      // if we're given null or undefined options, render a spinner
      // (indicates that options are being fetched)
      return (
        <span className="spinner-default multiselect-options-spinner" />
      );
    } else if (options.length === 0) {
      // No options means we display our no options message
      return (
        <em className="multiselect-options-no-results">
          {noOptionsMessage}
        </em>
      );
    } else {
      return this.renderOptions();
    }
  }

  render() {
    const {
      currentQuery,
      maxSelectedOptions,
      optionsVisible,
      selectedOptions,
      shouldRenderResultsWhenQueryIsEmpty
    } = this.props;

    // return if we're not visible,
    // or if we're told to hide the results when the query is empty
    if (!optionsVisible || (!shouldRenderResultsWhenQueryIsEmpty && !currentQuery)) {
      return null;
    }

    // don't render the options if the maximum amount has already been selected
    // (user has to remove an option to select another one)
    if (
      !_.isNil(maxSelectedOptions) &&
      !_.isEmpty(selectedOptions) &&
      selectedOptions.length >= maxSelectedOptions) {
      return null;
    }

    return (
      <div className="multiselect-options-container" tabIndex={-1}>
        {this.renderContents()}
      </div>
    );
  }
}

export default MultiSelectOptionList;
