// This component needs to be ported to ES6 classes, see EN-16506.
/* eslint-disable react/prefer-es6-class */
import _ from 'lodash';
import React, { PropTypes } from 'react';
import classNames from 'classnames';
import I18n from 'common/i18n';
import { ESCAPE } from 'common/keycodes';
import {
  focusFirstActionableElement,
  makeElementAndChildrenAccessible,
  makeElementAndChildrenInaccessible
} from 'common/a11y';
import SocrataIcon from '../SocrataIcon';

export const SideMenu = React.createClass({
  propTypes: {
    /**
     * The title displayed at the top of the menu.
     */
    title: PropTypes.string,

    /**
     * Whether the menu is anchored to the left of the page. If true, the menu will anchor to the
     * left side of the page, if false, it will be anchored to the right side of the page. Defaults
     * to true.
     */
    isAnchoredLeft: PropTypes.bool,

    /**
     * Whether the menu is visible, defaults to false.
     */
    isOpen: PropTypes.bool,

    /**
     * The click handler for the menu's dismiss button. Note that this is not invoked when clicking
     * outside of the menu element, nor when pressing the escape key. The consuming application
     * should invoke this behavior.
     */
    onDismiss: PropTypes.func,

    /**
     * Any children elements you'd like to render. Accessible as a prop or like this:
     * <SideMenu>
     *   <OtherComponent />
     * </SideMenu>
     */
    children: PropTypes.node
  },

  getDefaultProps() {
    return {
      title: null,
      isOpen: false,
      isAnchoredLeft: true,
      onDismiss: _.noop,
      children: null
    };
  },

  componentDidMount() {
    this.toggleVisibility();

    this.bodyClickHandler = (event) => {
      const { isOpen, onDismiss } = this.props;

      if (isOpen && !this.menuElement.contains(event.target)) {
        onDismiss();
      }
    };

    this.bodyEscapeHandler = (event) => {
      const { isOpen, onDismiss } = this.props;

      if (isOpen && event.keyCode === ESCAPE) {
        onDismiss();
      }
    };

    document.body.addEventListener('click', this.bodyClickHandler);
    document.body.addEventListener('keyup', this.bodyEscapeHandler);
  },

  componentDidUpdate(prevProps) {
    if (prevProps.isOpen !== this.props.isOpen) {
      this.toggleVisibility();
    }
  },

  componentWillUnmount() {
    document.body.removeEventListener('click', this.bodyClickHandler);
    document.body.removeEventListener('keyup', this.bodyEscapeHandler);
  },

  toggleVisibility() {
    const { isOpen } = this.props;

    if (isOpen) {
      // display menu
      this.menuElement.classList.add('active');
      makeElementAndChildrenAccessible(this.menuElement);

      // manage focus
      this.previouslyFocusedElement = document.activeElement;
      focusFirstActionableElement(this.menuElement, '.menu-header-dismiss');
    } else {
      // hide menu
      this.menuElement.classList.remove('active');
      makeElementAndChildrenInaccessible(this.menuElement);

      // manage focus
      if (this.previouslyFocusedElement) {
        this.previouslyFocusedElement.focus();
      }
    }
  },

  render() {
    const { title, children, onDismiss, isAnchoredLeft } = this.props;

    const menuProps = {
      className: classNames('side-menu', {
        'menu-anchor-left': isAnchoredLeft,
        'menu-anchor-right': !isAnchoredLeft
      }),
      ref: (ref) => this.menuElement = ref
    };

    const header = title ?
      <h4 className="menu-header-title">{title}</h4> :
      null;

    const dismissProps = {
      className: 'btn btn-block btn-transparent menu-header-dismiss',
      'aria-label': I18n.t('shared.components.menu.aria_close'),
      onClick: onDismiss
    };

    return (
      <div {...menuProps}>
        <div className="menu-header">
          {header}
          <button {...dismissProps}>
            <SocrataIcon name="close-2" />
          </button>
        </div>
        <ul className="menu-navigation">
          {children}
        </ul>
      </div>
    );
  }
});

export { default as MenuListItem } from './MenuListItem';
export { default as ExpandableMenuListItem } from './ExpandableMenuListItem';

export default SideMenu;
