import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import SocrataIcon from '../SocrataIcon';
import SelectedOptionPill from './SelectedOptionPill';
import MultiSelectInput from './MultiSelectInput';
import MultiSelectOptionList from './MultiSelectOptionList';
import SelectedOptionsCount from './SelectedOptionsCount';
import multiSelectKeyDownHandler from './MultiSelectKeyDownHandler';

/**
 * Renders a list of selected options from given options.
 *
 * Note that (almost) all of the props for this component are required, and
 * everything is "controlled" and has to be passed in.
 *
 * Various callbacks will let you know when the component is changed.
 */
class MultiSelect extends Component {
  static propTypes = {
    /**
     * What's currently in the search box
     * Note that this is a "controlled" value, so it needs to be passed in and
     * change with the "onCurrentQueryChanged" callback.
     *
     * Otherwise, the text in the input box will not change.
     */
    currentQuery: PropTypes.string.isRequired,

    /**
     * Placeholder for the input when it's empty
     */
    inputPlaceholder: PropTypes.string,

    /**
     * Maximum number of options that can be selected at one time.
     * By default, there is no limit.
     * When the limit is reached, the input essentially becomes disabled until
     * options are removed.
     */
    maxSelectedOptions: PropTypes.number,

    /**
     * (Optional)
     * Message to display when the options array is empty.
     * Defaults to localized "No results found."
     */
    noOptionsMessage: PropTypes.string,

    /**
     * Called when adding a selected option via keyboard or by clicking.
     * Users can iterate through the options with arrow keys,
     * which will call the "onSelectedIndexChange" prop with the changed index.
     * When the user has a result selected and hits "enter", this will be called.
     */
    onAddSelectedOption: PropTypes.func.isRequired,

    /**
     * Called with the contents of the input box when the current search query changes
     * Usually, this should have a side-effect of changing the "options" being passed in
     */
    onCurrentQueryChanged: PropTypes.func.isRequired,

    /**
     * Called when removing a selected option.
     * This happens when the user clicks the "remove" button on a pill,
     * or when they hit backspace and the currentQuery is empty.
     */
    onRemoveSelectedOption: PropTypes.func.isRequired,

    /**
     * List of options.
     * This is usually filtered in some way by "currentQuery",
     * and will be passed to the "renderSearchResults" function.
     *
     * If this is:
     * - null: A spinner will be shown in the results box
     * - Empty array: The "noOptionsMessage" will be shown (or a default of "No results found")
     * - Array of objects: Will call "renderOption" for every option
     */
    options: PropTypes.array,

    /**
     * Render the contents of a pill.
     * This will be called with whatever object is in the "options" array.
     */
    renderSelectedOptionContents: PropTypes.func.isRequired,

    /**
     * Called to render each option.
     */
    renderOption: PropTypes.func.isRequired,

    /**
     * (Default: [])
     * List of options that have been selected.
     * Note that this is a "controlled" value, so it needs to be passed in and
     * change with the "onAddSelectedOption" function.
     */
    selectedOptions: PropTypes.array,

    /**
     * (Default: false)
     * If this is true, then the results list will *always* be rendered
     * even if the "currentQuery" is empty.
     *
     * If this is false, the results list will only be rendered if
     * "currentQuery" is not empty. This is useful if the results list
     * is being fetched asynchronously and is empty unless there is a query.
     */
    shouldRenderResultsWhenQueryIsEmpty: PropTypes.bool
  }

  static defaultProps = {
    inputPlaceholder: 'Search...',
    maxSelectedOptions: null,
    selectedOptionIndex: null,
    selectedOptions: [],
    shouldRenderResultsWhenQueryIsEmpty: false
  }

  state = {
    /**
     * Basically just used to determine className of the wrapper
     */
    focused: false,

    /**
     * Used to determine is "mouseOver" events should be triggered for options;
     * they get skipped if the mouse hasn't moved, since they can be triggered by the container scrolling
     * (i.e. when the user is scrolling through options with the keyboard)
     */
    mouseMoved: false,

    /**
     * Whether or not the list of options is currently visible
     */
    optionsVisible: false,

    /*
     * The currently selected option in the options array.
     * Note that this is a "controlled" value, so it needs to be passed in and
     * change with the "onSelectedIndexChange" function.
     */
    selectedOptionIndex: null,

    /**
     * Used to "override" the root node's onBlur
     * This happens when an option is clicked with the mouse; technically
     * the option gains focus and the root node's onBlur is called.
     *
     * However, we still want its onBlur to be called when i.e. tabbing out of
     * the input field or clicking away from it.
     */
    skipBlur: false,

    /*
     * If this is false, then we're scrolling through options using the keyboard
     *  and want to scroll to their dom nodes as they gain focus.
     * If this is true, a mouse is being used and we don't want to jump around as the user scrolls.
     */
    usingMouse: false
  }

  componentDidMount() {
    // we have to track if the mouse has moved because, when scrolling through
    // the options list with the keyboard, "mouseover" events trigger if the mouse
    // is over an option after the container scrolls.
    // If the mouse hasn't moved, we basically ignore this mouseover event
    // (see MultiSelectOption)
    document.addEventListener('mousemove', this.onDocumentMouseMove);
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.onDocumentMouseMove);
  }

  onDocumentMouseMove = () => {
    this.setState({ mouseMoved: true });
  }

  /**
   * Called when the selected options index changes.
   * This happens when the user is scrolling with arrow keys,
   * or when they mouse over options
   */
  onSelectedOptionIndexChange = (selectedOptionIndex) => {
    this.setState({ selectedOptionIndex });
  }

  /**
   * Called when the input gains/loses focus,
   * or when the Escape key is pressed
   */
  onOptionsVisibilityChanged = (optionsVisible) => {
    this.setState({ optionsVisible });
  }

  /**
   * Called with "false" when the user is scrolling with the
   * arrow keys, and "true" when they mouse over the options
   */
  setUsingMouse = (usingMouse) => {
    this.setState({
      usingMouse,
      mouseMoved: usingMouse // this way, next time the mouse moves it will trigger mouseover
    });
  }

  handleFocus = () => {
    this.onOptionsVisibilityChanged(true);
    this.setState({ focused: true });
  }

  /**
   * Handle the blur event on the root of the component.
   * Used to hide the options list when i.e. clicking or tabbing out of
   * the component
   */
  handleBlur = () => {
    const { skipBlur } = this.state;

    if (!skipBlur) {
      // not told to skip this blur, so we hide the options
      // effectively making the component "unfocused"
      this.setState({ optionsVisible: false, focused: false });
    } else {
      // skipBlur is true (meaning an option was clicked with the mouse)
      // set skipBlur to false so that next time the blur event is fired,
      // we know to change the optionsVisible boolean
      this.setState({ skipBlur: false });
    }
  }

  /**
   * When called, this will "override" the root node's onBlur
   * This happens when an option is clicked with the mouse; technically
   * the option gains focus and the root node's onBlur is called.
   *
   * However, we still want its onBlur to be called when i.e. tabbing out of
   * the input field or clicking away from it.
   */
  skipRootBlur = () => {
    this.setState({ skipBlur: true });
  }

  /**
   * This method calls the "onAddSelectedOptop" that's been passed in as props,
   * but will pay attention to the "maxSelectedOptions" prop passed in and prevent adding
   * more than the allowed amount.
   */
  addSelectedOption = (option) => {
    const {
      maxSelectedOptions,
      onAddSelectedOption,
      selectedOptions
    } = this.props;

    if (
      _.isNil(maxSelectedOptions) ||
      _.isEmpty(selectedOptions) ||
      selectedOptions.length < maxSelectedOptions) {
      onAddSelectedOption(option);
    }
  }

  renderPills = () => {
    const {
      onRemoveSelectedOption,
      renderSelectedOptionContents,
      selectedOptions
    } = this.props;

    const selectOptionPillProps = {
      onRemoveSelectedOption,
      renderSelectedOptionContents,
      selectedOptions
    };

    if (selectedOptions) {
      return selectedOptions.map((option, index) => (
        <SelectedOptionPill
          key={`selected-option-pill-${index}`}
          selectedOption={option}
          {...selectOptionPillProps} />
      ));
    }

    return null;
  }

  renderSelectedOptionsCount = () => {
    const { maxSelectedOptions, selectedOptions } = this.props;

    // only render if we actually have a maximum set
    if (!_.isNil(maxSelectedOptions)) {
      return (
        <SelectedOptionsCount
          maxSelectedOptions={maxSelectedOptions}
          selectedOptions={selectedOptions} />
      );
    }

    return null;
  }

  render() {
    const {
      shouldRenderResultsWhenQueryIsEmpty,
      currentQuery,
      inputPlaceholder,
      maxSelectedOptions,
      noOptionsMessage,
      onCurrentQueryChanged,
      onRemoveSelectedOption,
      options,
      renderOption,
      selectedOptions
    } = this.props;

    const {
      focused,
      mouseMoved,
      optionsVisible,
      selectedOptionIndex,
      usingMouse
    } = this.state;

    const keyDownListenerProps = {
      currentQuery,
      options,
      optionsVisible,
      onAddSelectedOption: this.addSelectedOption,
      onOptionsVisibilityChanged: this.onOptionsVisibilityChanged,
      onRemoveSelectedOption,
      onSelectedOptionIndexChange: this.onSelectedOptionIndexChange,
      selectedOptions,
      selectedOptionIndex,
      setUsingMouse: this.setUsingMouse
    };

    const optionListProps = {
      maxSelectedOptions,
      mouseMoved,
      shouldRenderResultsWhenQueryIsEmpty,
      currentQuery,
      noOptionsMessage,
      onAddSelectedOption: this.addSelectedOption,
      onOptionsVisibilityChanged: this.onOptionsVisibilityChanged,
      onSelectedOptionIndexChange: this.onSelectedOptionIndexChange,
      options,
      optionsVisible,
      renderOption,
      selectedOptionIndex,
      selectedOptions,
      setUsingMouse: this.setUsingMouse,
      skipRootBlur: this.skipRootBlur,
      usingMouse
    };

    const inputProps = {
      // this "inputRef" function will get called by the child and return the DOM node
      // of the input box, which we need to focus on when the container is clicked
      inputRef: inputRef => this.inputRef = inputRef,
      currentQuery,
      inputPlaceholder,
      onCurrentQueryChanged,
      onOptionsVisibilityChanged: this.onOptionsVisibilityChanged,
      onSelectedOptionIndexChange: this.onSelectedOptionIndexChange
    };

    return (
      <div
        className="multiselect-root"
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        onKeyDown={(e) => multiSelectKeyDownHandler(e, keyDownListenerProps)}
        ref={(ref) => { this.rootNode = ref; }}>
        <div
          className={`multiselect-form-container${focused ? ' focused' : ''}`}
          onClick={() => this.inputRef.focus()}> {/* Focus on the text box when the container is clicked */}
          <div className="multiselect-search-icon-container">
            <SocrataIcon name="search" className="multiselect-search-icon" />
          </div>
          <div className="multiselect-form">
            {this.renderPills()}
            <MultiSelectInput {...inputProps} />
          </div>
          {this.renderSelectedOptionsCount()}
        </div>
        <MultiSelectOptionList {...optionListProps} />
      </div>
    );
  }
}

export default MultiSelect;
