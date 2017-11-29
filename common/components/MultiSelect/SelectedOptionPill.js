import React, { Component } from 'react';
import PropTypes from 'prop-types';

import SocrataIcon from '../SocrataIcon';

/**
 * Render a "pill" representing an option that has been selected.
 * Also has a "delete" button to un-select the option.
 */
class SelectedOptionPill extends Component {
  static propTypes = {
    /*
     * Called when the "delete" button is clicked.
     * Called with the "selectedOption" as the first parameter,
     * and "selectedOptionIndex" as the second parameter
     */
    onRemoveSelectedOption: PropTypes.func.isRequired,

    /*
     * Render the contents of the pill,
     * the "selectedOption" will be passed in to this.
     */
    renderSelectedOptionContents: PropTypes.func.isRequired,

    /*
     * Actual option that is being rendered, will be passed
     * to the "renderPillContents" function
     */
    selectedOption: PropTypes.any,

    /*
     * The index in the array of all the currently selected options
     */
    selectedOptionIndex: PropTypes.number
  }

  render() {
    const {
      onRemoveSelectedOption,
      renderSelectedOptionContents,
      selectedOption,
      selectedOptionIndex
    } = this.props;

    return (
      <div className="multiselect-pill">
        {renderSelectedOptionContents(selectedOption, selectedOptionIndex)}
        <button
          tabIndex={-1}
          className="multiselect-pill-remove-button"
          onClick={() => onRemoveSelectedOption(selectedOption, selectedOptionIndex)}>
          <SocrataIcon name="close" className="multiselect-pill-remove-icon" />
        </button>
      </div>
    );
  }
}

export default SelectedOptionPill;
