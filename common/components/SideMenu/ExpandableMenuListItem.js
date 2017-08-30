// This component needs to be ported to ES6 classes, see EN-16506.
/* eslint-disable react/prefer-es6-class */
import _ from 'lodash';
import React, { PropTypes } from 'react';
import classNames from 'classnames';
import SocrataIcon from '../SocrataIcon';
import { getFirstActionableElement } from 'common/a11y';

export const ExpandableMenuListItem = React.createClass({
  propTypes: {
    iconName: PropTypes.string,
    isOpen: PropTypes.bool,
    onClick: PropTypes.func,
    text: PropTypes.string.isRequired,
    children: PropTypes.node
  },

  getDefaultProps() {
    return {
      onClick: _.noop,
      isOpen: false
    };
  },

  componentDidUpdate(prevProps) {
    const { children, isOpen } = this.props;

    // Sets focus on the first actionable item inside of the children
    if (prevProps.isOpen !== isOpen && children && this.contentElement) {
      const actionableElement = getFirstActionableElement(this.contentElement);

      if (isOpen && actionableElement) {
        actionableElement.focus();
      } else if (this.buttonElement) {
        this.buttonElement.focus();
      }
    }
  },

  render() {
    const { iconName, isOpen, onClick, text, children } = this.props;

    const buttonProps = {
      className: classNames('btn btn-transparent menu-list-item', {
        'active': isOpen
      }),
      onClick,
      ref: (ref) => this.buttonElement = ref
    };

    const icon = iconName ?
      <SocrataIcon name={iconName} /> :
      null;

    const childrenProps = {
      className: 'menu-list-item-content',
      ref: (ref) => this.contentElement = ref
    };

    const content = children ?
      <div {...childrenProps}>{children}</div> :
      null;

    return (
      <li>
        <button {...buttonProps}>
          {icon}
          {text}
          <span className="arrow">
            <SocrataIcon name="arrow-down" />
          </span>
        </button>
        {content}
      </li>
    );
  }
});

export default ExpandableMenuListItem;
