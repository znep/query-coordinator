import React, { PropTypes } from 'react';
import classNames from 'classnames';

import { ESCAPE, isolateEventByKeys } from '../../common/keycodes';

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
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this.checkDimensions);
  },

  computeState() {
    return {
      forceFullScreen: window.innerWidth <= MOBILE_BREAKPOINT
    };
  },

  checkDimensions() {
    this.setState(this.computeState());
  },

  tryEscDismiss(event) {
    const { onDismiss } = this.props;
    isolateEventByKeys(event, [ESCAPE]);

    if (event.keyCode === ESCAPE) {
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
        onKeyUp={this.tryEscDismiss}
        onClick={this.tryOverlayClickDismiss}>
        <div className="modal-container">
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
