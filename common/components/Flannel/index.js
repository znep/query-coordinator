import $ from 'jquery';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ESCAPE, TAB, isOneOfKeys, isolateEventByKeys } from 'common/dom_helpers/keycodes_deprecated';
import * as a11y from 'common/a11y';
import classNames from 'classnames';

export class Flannel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      position: {},
      previouslyFocusedElement: document.activeElement
    };

    _.bindAll(this, ['onClickDocument', 'onKeyUpDocument', 'positionSelf', 'checkBlur', 'tryFocusTrap']);

    this.positionSelf = _.throttle(this.positionSelf, 100);
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
    if (this.props.autoFocus) {
      a11y.focusFirstActionableElement(this.flannelRef);
    }
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
    // If clicking the target caused it to be removed from the DOM (say, a "clear input" button),
    // we can't know for sure if it was within the Flannel. Safest bet is to do nothing.
    const isRooted = event.target && document.body.contains(event.target);

    if (outsideFlannel && outsideTarget && isRooted) {
      this.props.onDismiss(event);
    }
  }

  onKeyUpDocument(event) {
    if (event.keyCode === ESCAPE) {
      this.props.onDismiss(event);
    }
  }

  // Certain header elements are position:fixed and have a z-index sufficient to overlay the flannel.
  // We want to avoid those.
  getMinTopPosition() {
    // We assume these stack vertically.
    return _.sumBy(
      document.querySelectorAll('#site-chrome-admin-header, nav.edit-bar'),
      (element) => $(element).height()
    );
  }

  getTarget() {
    const { target } = this.props;
    return _.isFunction(target) ? target() : target;
  }

  checkBlur() {
    const $activeElement = $(document.activeElement);
    const outsideFlannel = $activeElement.closest(this.flannelRef).length === 0;

    if (outsideFlannel) {
      this.props.onDismiss(event);
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
    let position = {};
    const mobileWidthBreakpoint = 420;
    const windowWidth = window.innerWidth; // With scrollbar

    if (windowWidth <= mobileWidthBreakpoint) {
      document.body.classList.add('modal-open');
      position = { top: 0, left: 0 };
    } else {
      document.body.classList.remove('modal-open');

      if (!this.flannelRef) { return; }

      const flannelRect = this.flannelRef.getBoundingClientRect();
      const bodyWidth = document.body.offsetWidth; // Without scrollbar
      // Supposed to be without scrollbar, but this is inconsistent. Subtract a nerf factor.
      const bodyHeight = document.body.offsetHeight - 15;
      const targetElement = this.getTarget();

      if (targetElement && targetElement.getBoundingClientRect) {
        // Position below the target element, left-justified.
        // Don't let it go off screen.
        const targetRect = targetElement.getBoundingClientRect();

        let left = targetRect.left;
        let top = targetRect.top + targetElement.offsetHeight + 10;
        top = Math.max(top, this.getMinTopPosition());

        const exceedsBodyWidth = left + flannelRect.width > bodyWidth;
        const exceedsBodyHeight = top + flannelRect.height > bodyHeight;

        if (exceedsBodyWidth) {
          position.right = 0;
        } else {
          position.left = left;
        }

        if (exceedsBodyHeight) {
          position.bottom = 0;
        } else {
          position.top = top;
        }

      } else {
        // eslint-disable-next-line no-console
        console.warn('Target element not available. Defaulting to center of screen.');
        position = {
          left: (bodyWidth - flannelRect.width) / 2,
          top: (bodyHeight - flannelRect.height) / 2
        };
      }
    }

    this.setState({ position });
  }

  render() {
    const { id, children, className, title } = this.props;
    const { position } = this.state;

    const flannelAttributes = {
      id,
      className: classNames('socrata-flannel', className),
      ref: (ref) => this.flannelRef = ref,
      style: position,
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
  // If set (default) , the flannel will automatically focus its first actionable child on mount.
  autoFocus: PropTypes.bool,
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
  // The event responsible for triggering the dismiss behavior is provided as the only argument. It may
  // be used to apply further logic to the behavior governing flannel dismissal.
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
  autoFocus: true,
  onDismiss: _.noop
};

export default Flannel;
export { default as FlannelHeader } from './Header';
export { default as FlannelContent } from './Content';
export { default as FlannelFooter } from './Footer';
