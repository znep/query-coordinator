import classNames from 'classnames';
import DebouncedInput from './DebouncedInput';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ENTER, ESCAPE, isolateEventByKeys } from 'common/keycodes';

class TextInputButton extends Component {
  constructor() {
    super();

    this.state = {
      isPopupOpen: false
    };
  }

  onKeyUpInput(event) {
    const { keyCode } = event;
    isolateEventByKeys(event, [ENTER, ESCAPE]);

    if ((keyCode === ENTER) || (keyCode === ESCAPE)) {
      this.setState({ isPopupOpen: false })
    }
  }

  renderOverlay() {
    const { isPopupOpen } = this.state;
    const className = classNames('text-input-button-overlay', {
      'hidden': !isPopupOpen
    });

    const attributes = {
      className,
      onClick: () => this.setState({ isPopupOpen: false }),
      role: 'button'
    };

    return <div {...attributes} />;
  }

  renderButton() {
    const { isPopupOpen } = this.state;
    const className = classNames('btn btn-default text-input-button-button', {
      'active': isPopupOpen
    });

    const attributes = {
      className,
      onClick: () => this.setState({ isPopupOpen: !isPopupOpen }),
      type: 'button'
    };

    return (
      <button {...attributes}>
        <span className="socrata-icon-flyout-options" />
      </button>
    );
  }

  renderPopup() {
    const { onChange, placeholder, textInputId, textInputValue } = this.props;
    const { isPopupOpen } = this.state;
    const className = classNames('text-input-button-popup', {
      'hidden': !isPopupOpen
    });

    const attributes = {
      className: 'text-input',
      id: textInputId,
      forceEnterKeyHandleChange: true,
      onChange,
      onKeyUp: this.onKeyUpInput,
      placeholder,
      value: textInputValue
    };

    return (
      <div className={className}>
        <DebouncedInput {...attributes} />
      </div>
    );
  }

  render() {
    return (
      <div className="text-input-button-container">
        {this.renderOverlay()}
        {this.renderButton()}
        {this.renderPopup()}
      </div>
    );
  }
};

TextInputButton.propTypes = {
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  textInputId: PropTypes.string,
  textInputValue: PropTypes.string
};

export default TextInputButton;
