import React, { Component } from 'react';
import PropTypes from 'prop-types';

class MultiSelectOption extends Component {
  static propTypes = {
    active: PropTypes.bool.isRequired,
    index: PropTypes.number.isRequired,
    maxSelectedOptions: PropTypes.number,
    mouseMoved: PropTypes.bool.isRequired,
    option: PropTypes.any.isRequired,
    onSelectedOptionIndexChange: PropTypes.func.isRequired,
    onAddSelectedOption: PropTypes.func.isRequired,
    renderOption: PropTypes.func.isRequired,
    selectedOptions: PropTypes.array,
    setUsingMouse: PropTypes.func.isRequired,
    skipRootBlur: PropTypes.func.isRequired,
    usingMouse: PropTypes.bool.isRequired
  };

  static defaultProps = {
    maxSelectedOptions: null
  };

  componentWillReceiveProps(nextProps) {
    // if we're NOT using the mouse and this option is active, focus on it
    if (!this.props.active && nextProps.active && !nextProps.usingMouse) {
      this.domNode.scrollIntoView(false);
    }
  }

  onMouseOver = () => {
    const {
      index,
      mouseMoved,
      onSelectedOptionIndexChange,
      setUsingMouse
    } = this.props;

    // only pay attention to the mouse over if the mouse has moved;
    // if the user is scrolling via the keyboard, this event will get triggered when the container scrolls
    if (mouseMoved) {
      // set the index to this option, and tell our parent that we're using the mouse
      // if the mouse is being used, we don't want to scroll the node into view since it's implied that it's already in view;
      // scrolling it into view while using the mouse makes things jittery
      onSelectedOptionIndexChange(index);
      setUsingMouse(true);
    }
  }

  onClick = (e) => {
    const {
      onAddSelectedOption,
      option
    } = this.props;

    onAddSelectedOption(option);

    e.preventDefault();
  }

  render() {
    const {
      active,
      index,
      option,
      renderOption,
      skipRootBlur
    } = this.props;

    return (
      <div
        role="button"
        tabIndex={-1}
        className={active ? 'multiselect-option-active' : 'multiselect-option'}
        onMouseDown={() => skipRootBlur()}
        onMouseOver={this.onMouseOver}
        onClick={this.onClick}
        ref={domNode => this.domNode = domNode}>
        {renderOption(option, index)}
      </div>
    );
  }
}

export default MultiSelectOption;
