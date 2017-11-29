import _ from 'lodash';

export const hasSelectedItem = (props) => Number.isInteger(props.selectedOptionIndex);

export const handleArrowDown = (event, props) => {
  const {
    onOptionsVisibilityChanged,
    onSelectedOptionIndexChange,
    options,
    optionsVisible,
    selectedOptionIndex,
    setUsingMouse
  } = props;

  if (optionsVisible) {
    // if options are visible and we aren't at the end of the list, move the index down by one
    if (selectedOptionIndex !== options.length - 1) {
      onSelectedOptionIndexChange(hasSelectedItem(props) ? selectedOptionIndex + 1 : 0);

      // we also set using mouse here to false,
      // which tells the option to scroll into view when it receives its new props
      setUsingMouse(false);
    }
  } else {
    // if the options aren't visible, make them so
    // current index gets set to null here so we're at the top of the list
    onSelectedOptionIndexChange(null);
    onOptionsVisibilityChanged(true);
  }
  event.preventDefault();
};

export const handleArrowUp = (event, props) => {
  const {
    onSelectedOptionIndexChange,
    optionsVisible,
    selectedOptionIndex,
    setUsingMouse
  } = props;

  if (optionsVisible && hasSelectedItem(props)) {
    // if we're at the top of the list, set the index to null to indicate we have nothing selected
    // otherwise, move up by one result
    onSelectedOptionIndexChange(selectedOptionIndex === 0 ? null : selectedOptionIndex - 1);
    setUsingMouse(false);
    event.preventDefault();
  }
};

export const handleEnter = (event, props) => {
  const {
    onAddSelectedOption,
    options,
    optionsVisible,
    selectedOptionIndex
  } = props;

  // if options are visible and we have a selected item, call the callback to add it
  if (optionsVisible && hasSelectedItem(props)) {
    // if the selected option somehow doesn't exist, do nothing
    if (_.isEmpty(options) || !options[selectedOptionIndex]) {
      return;
    }

    onAddSelectedOption(options[selectedOptionIndex]);
    event.preventDefault();
  }
};

export const handleEscape = (event, props) => {
  const {
    onOptionsVisibilityChanged,
    optionsVisible
  } = props;

  // just hide the options
  if (optionsVisible) {
    onOptionsVisibilityChanged(false);
    event.preventDefault();
  }
};

export const handleBackspace = (event, props) => {
  const {
    currentQuery,
    onRemoveSelectedOption,
    selectedOptions
  } = props;

  // if we have any select options and the query is empty,
  // we remove the last option in the list
  if (selectedOptions && selectedOptions.length > 0 && currentQuery === '') {
    onRemoveSelectedOption(selectedOptions[selectedOptions.length - 1]);
    event.preventDefault();
  }
};

const keyDownEventHandlers = {
  'ArrowDown': handleArrowDown,
  'ArrowUp': handleArrowUp,
  'Enter': handleEnter,
  'Escape': handleEscape,
  'Backspace': handleBackspace
};

export default (event, props) => {
  const handler = keyDownEventHandlers[event.key];
  if (handler) {
    handler(event, props);
  }
};
