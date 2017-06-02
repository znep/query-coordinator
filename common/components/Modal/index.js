// This component needs to be ported to ES6 classes, see EN-16506.
/* eslint-disable react/prefer-es6-class */
import React, { PropTypes } from 'react';
import classNames from 'classnames';

import { ESCAPE, TAB, isolateEventByKeys, isOneOfKeys } from 'common/keycodes';
import {
  focusFirstActionableElement,
  getFirstActionableElement,
  getLastActionableElement
} from 'common/a11y';

const MOBILE_BREAKPOINT = 420;

export const Modal = React.createClass({
  propTypes: {
    children: PropTypes.arrayOf(PropTypes.element),
    className: PropTypes.string,
    fullScreen: PropTypes.bool,
    onDismiss: PropTypes.func.isRequired,
    overlay: PropTypes.bool
  },

  getDefaultProps() {
    return {
      className: null,
      fullScreen: false,
      overlay: true
    };
  },

  getInitialState() {
    return this.computeState();
  },

  componentDidMount() {
    window.addEventListener('resize', this.checkDimensions);
    document.documentElement.classList.add('modal-open');

    // Handle a11y focusing concerns
    this.previouslyFocusedElement = document.activeElement;
    focusFirstActionableElement(this.modalContainer);
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this.checkDimensions);
    document.documentElement.classList.remove('modal-open');

    // Handle a11y focusing concerns
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
    }
  },

  computeState() {
    return {
      forceFullScreen: window.innerWidth <= MOBILE_BREAKPOINT
    };
  },

  checkDimensions() {
    this.setState(this.computeState());
  },

  tryFocusTrap(event) {
    if (isOneOfKeys(event, [TAB])) {
      const firstActionableElement = getFirstActionableElement(this.modalContainer);
      const lastActionableElement = getLastActionableElement(this.modalContainer);

      // tab + shift means the user is tabbing to the previous focusable element
      if (event.target === firstActionableElement && event.shiftKey && lastActionableElement) {
        isolateEventByKeys(event, [TAB]);
        lastActionableElement.focus();
      // be careful to let users to tab + shift to the element before the last one
      } else if (event.target === lastActionableElement && !event.shiftKey && firstActionableElement) {
        isolateEventByKeys(event, [TAB]);
        firstActionableElement.focus();
      }
    }
  },

  tryEscDismiss(event) {
    const { onDismiss } = this.props;
    isolateEventByKeys(event, [ESCAPE]);

    if (isOneOfKeys(event, [ESCAPE])) {
      onDismiss();
    }
  },

  tryOverlayClickDismiss(event) {
    const { onDismiss } = this.props;

    if (event.target === this.modalElement) {
      onDismiss();
    }
  },

  render() {
    const { children, className, fullScreen, overlay } = this.props;
    const { forceFullScreen } = this.state;

    const modalClasses = classNames({
      modal: true,
      'modal-overlay': overlay !== false,
      'modal-full': fullScreen || forceFullScreen,
      [className]: !!className
    });

    return (
      <div
        ref={(ref) => this.modalElement = ref}
        className={modalClasses}
        role="dialog"
        onKeyDown={this.tryFocusTrap}
        onKeyUp={this.tryEscDismiss}
        onClick={this.tryOverlayClickDismiss}>
        <div className="modal-container" ref={(ref) => this.modalContainer = ref}>
          {children}
        </div>
      </div>
    );
  }
});

export { default as ModalHeader } from './Header';
export { default as ModalContent } from './Content';
export { default as ModalFooter } from './Footer';

export default Modal;
