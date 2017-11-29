import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * Used to let the user know how many of the max options
 * they've selected. This will not get rendered if no max is set.
 */
class SelectedOptionsCount extends Component {
  static propTypes = {
    maxSelectedOptions: PropTypes.number.isRequired,
    selectedOptions: PropTypes.array
  }

  static defaultProps = {
    selectedOptions: []
  }

  render() {
    const { maxSelectedOptions, selectedOptions } = this.props;

    return (
      <div className="multiselect-selected-options-count">
        {selectedOptions.length} / {maxSelectedOptions}
      </div>
    );
  }
}

export default SelectedOptionsCount;
