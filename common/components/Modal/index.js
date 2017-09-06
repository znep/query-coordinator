import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';
import { ESCAPE, TAB, isolateEventByKeys, isOneOfKeys } from  'common/dom_helpers/keycodes';
import {
  focusFirstActionableElement,
  getFirstActionableElement,
  getLastActionableElement
} from 'common/a11y';

const MOBILE_BREAKPOINT = 420;

export class Modal extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'computeState',
      'checkDimensions',
      'tryFocusTrap',
      'tryEscDismiss',
      'tryOverlayClickDismiss'
    ]);

    this.state = this.computeState();
  }

  componentDidMount() {
    window.addEventListener('resize', this.checkDimensions);
    document.documentElement.classList.add('modal-open');

    // Handle a11y focusing concerns
    this.previouslyFocusedElement = document.activeElement;
    focusFirstActionableElement(this.modalContainer);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.checkDimensions);
    document.documentElement.classList.remove('modal-open');

    // Handle a11y focusing concerns
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
    }
  }

  computeState() {
    return {
      forceFullScreen: window.innerWidth <= MOBILE_BREAKPOINT
    };
  }

  checkDimensions() {
    this.setState(this.computeState());
  }

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
  }

  tryEscDismiss(event) {
    const { onDismiss } = this.props;
    isolateEventByKeys(event, [ESCAPE]);

    if (isOneOfKeys(event, [ESCAPE])) {
      onDismiss();
    }
  }

  tryOverlayClickDismiss(event) {
    const { onDismiss } = this.props;

    if (event.target === this.modalElement) {
      onDismiss();
    }
  }

  render() {
    const { children, className, containerStyle, fullScreen, overlay, overlayStyle } = this.props;
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
        style={overlayStyle}
        role="dialog"
        onKeyDown={this.tryFocusTrap}
        onKeyUp={this.tryEscDismiss}
        onClick={this.tryOverlayClickDismiss}>
        <div className="modal-container" style={containerStyle} ref={(ref) => this.modalContainer = ref}>
          {children}
        </div>
      </div>
    );
  }
}

Modal.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element),
  className: PropTypes.string,
  containerStyle: PropTypes.object,
  fullScreen: PropTypes.bool,
  onDismiss: PropTypes.func.isRequired,
  overlay: PropTypes.bool,
  overlayStyle: PropTypes.object
};

Modal.defaultProps = {
  className: null,
  fullScreen: false,
  overlay: true
};

export { default as ModalHeader } from './Header';
export { default as ModalContent } from './Content';
export { default as ModalFooter } from './Footer';

export default Modal;
