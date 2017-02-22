import _ from 'lodash';
import React, { PropTypes } from 'react';
import classNames from 'classnames';
import SocrataIcon from '../SocrataIcon';
import { getFirstActionableElement } from '../../common/a11y';

export const ExpandableMenuListItem = React.createClass({
  propTypes: {
    iconName: PropTypes.string,
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    children: PropTypes.node
  },

  getDefaultProps() {
    return {
      onClick: _.noop
    };
  },

  getInitialState() {
    return {
      isOpen: false
    };
  },

  componentDidUpdate(oldProps, oldState) {
    const { children } = this.props;
    const { isOpen } = this.state;

    // Sets focus on the first actionable item inside of the children
    if (oldState.isOpen !== isOpen && children) {
      const actionableElement = getFirstActionableElement(this.contentElement);

      if (isOpen && actionableElement) {
        actionableElement.focus();
      } else {
        this.buttonElement.focus();
      }
    }
  },

  onClick() {
    const { onClick } = this.props;
    const { isOpen } = this.state;

    this.setState({ isOpen: !isOpen });
    onClick();
  },

  render() {
    const { iconName, text, children } = this.props;
    const { isOpen } = this.state;

    const buttonProps = {
      className: classNames('btn btn-transparent menu-list-item', {
        'active': isOpen
      }),
      onClick: this.onClick,
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
