import $ from 'jquery';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ESCAPE, TAB, isOneOfKeys, isolateEventByKeys } from 'common/dom_helpers/keycodes';
import * as a11y from 'common/a11y';

/* eslint-disable */
export class Flannel extends Component {
/* eslint-enable */
  constructor(props) {
    super(props);

    this.state = {
      top: 0,
      left: 0,
      previouslyFocusedElement: document.activeElement
    };

    _.bindAll(this, ['onClickDocument', 'onKeyUpDocument', 'positionSelf', 'checkBlur', 'tryFocusTrap']);
  }

  componentWillMount() {
    $(window).
      on('resize', this.positionSelf).
      on('scroll', this.positionSelf).
      on('wheel', this.positionSelf);
    $(document).
      on('click', this.onClickDocument).
      on('keyup', this.onKeyUpDocument);
  }

  componentDidMount() {
    this.positionSelf();
    a11y.focusFirstActionableElement(this.flannelRef);
  }

  componentWillUnmount() {
    this.focusPreviouslyFocusableElement();
    document.body.classList.remove('modal-open');

    $(window).
      off('resize', this.positionSelf).
      off('scroll', this.positionSelf).
      off('wheel', this.positionSelf);
    $(document).
      off('click', this.onClickDocument).
      off('keyup', this.onKeyUpDocument);
  }

  onClickDocument(event) {
    const $eventTarget = $(event.target);
    const outsideFlannel = $eventTarget.closest(this.flannelRef).length === 0;
    const outsideTarget = $eventTarget.closest(this.getTarget()).length === 0;

    if (outsideFlannel && outsideTarget) {
      this.props.onDismiss();
    }
  }

  onKeyUpDocument(event) {
    if (event.keyCode === ESCAPE) {
      this.props.onDismiss();
    }
  }

  getTarget() {
    const { target } = this.props;
    return _.isFunction(target) ? target() : target;
  }

  checkBlur() {
    const $activeElement = $(document.activeElement);
    const outsideFlannel = $activeElement.closest(this.flannelRef).length === 0;

    if (outsideFlannel) {
      this.props.onDismiss();
    }
  }

  tryFocusTrap(event) {
    if (isOneOfKeys(event, [TAB])) {
      const firstActionableElement = a11y.getFirstActionableElement(this.flannelRef);
      const lastActionableElement = a11y.getLastActionableElement(this.flannelRef);

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

  focusPreviouslyFocusableElement() {
    const { previouslyFocusedElement } = this.state;

    if (previouslyFocusedElement instanceof Element) {
      previouslyFocusedElement.focus();
    }
  }

  positionSelf() {
    let left;
    let top;
    const mobileWidthBreakpoint = 420;
    const windowWidth = window.innerWidth; // With scrollbar

    if (windowWidth <= mobileWidthBreakpoint) {
      document.body.classList.add('modal-open');
      left = 0;
      top = 0;
    } else {
      document.body.classList.remove('modal-open');

      const targetElement = this.getTarget();
      const targetDimensions = targetElement.getBoundingClientRect();

      left = targetDimensions.left;
      top = targetDimensions.top + targetElement.offsetHeight + 10;

      const flannelWidth = this.flannelRef.getBoundingClientRect().width;
      const bodyWidth = document.body.offsetWidth; // Without scrollbar
      const exceedsBodyWidth = left + flannelWidth > bodyWidth;

      if (exceedsBodyWidth && windowWidth > mobileWidthBreakpoint) {
        left -= flannelWidth - targetDimensions.width;
      }
    }

    this.setState({ left, top });
  }

  render() {
    const { id, children, className, title } = this.props;
    const { top, left } = this.state;

    const flannelAttributes = {
      id,
      className: `socrata-flannel ${className}`,
      ref: (ref) => this.flannelRef = ref,
      style: { left, top },
      onKeyUp: this.tryFocusTrap,
      role: 'dialog',
      'aria-label': title
    };

    return <div {...flannelAttributes}>{children}</div>;
  }
}

Flannel.propTypes = {
  // A top-level HTML attribute corresponding to id for easier targeting.
  id: PropTypes.string,
  // Implicit React children handled by React.
  children: PropTypes.node,
  // A top-level HTML attribute corresponding to class for easier targeting.
  className: PropTypes.string,
  // A callback that express user intent to close or dismiss the flannel.
  // This can be activated for three cases:
  // - The user focuses something outside of the flannel.
  // - The user hits escape.
  // - The user clicks outside of the flannel.
  // The actual close functionality is left to the consumer of this component.
  onDismiss: PropTypes.func,
  // A flannel is mounted on the bottom of a target element.
  // This element can be a React element, raw HTMLElement, or a function
  // that returns either.
  target: PropTypes.oneOfType([
    PropTypes.instanceOf(HTMLElement),
    PropTypes.element,
    PropTypes.func
  ]).isRequired,
  // A title is a handful of words that explains the purpose of the Flannel.
  // This is required for accessibility.
  title: PropTypes.string.isRequired
};

Flannel.defaultProps = {
  onDismiss: _.noop
};

export default Flannel;
export { default as FlannelHeader } from './Header';
export { default as FlannelContent } from './Content';
export { default as FlannelFooter } from './Footer';
