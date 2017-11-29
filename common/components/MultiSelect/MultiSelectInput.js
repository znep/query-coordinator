import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * Input box for searching the list of options
 */
class MultiSelectInput extends Component {
  // see the wrapping component for details on these propTypes
  static propTypes = {
    currentQuery: PropTypes.string.isRequired,
    inputRef: PropTypes.func.isRequired,
    onCurrentQueryChanged: PropTypes.func.isRequired,
    onOptionsVisibilityChanged: PropTypes.func.isRequired,
    onSelectedOptionIndexChange: PropTypes.func.isRequired
  }

  onInputChange = (event) => {
    const {
      onCurrentQueryChanged,
      onOptionsVisibilityChanged,
      onSelectedOptionIndexChange
    } = this.props;

    onCurrentQueryChanged(event);

    // blank out the selected index so we go to the top of the list
    // (query changing implies that options list has changed)
    onSelectedOptionIndexChange(null);

    // show the options if they've been hidden (i.e. by hitting "Escape")
    onOptionsVisibilityChanged(true);
  }

  render() {
    const {
      inputRef,
      currentQuery
    } = this.props;

    return (
      <input
        ref={ref => inputRef(ref)}
        className="text-input multiselect-input"
        value={currentQuery}
        onChange={this.onInputChange} />
    );
  }
}

export default MultiSelectInput;
