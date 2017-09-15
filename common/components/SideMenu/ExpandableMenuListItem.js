import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';
import SocrataIcon from '../SocrataIcon';
import { getFirstActionableElement } from 'common/a11y';

export class ExpandableMenuListItem extends Component {
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
  }

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
}

ExpandableMenuListItem.propTypes = {
  iconName: PropTypes.string,
  isOpen: PropTypes.bool,
  onClick: PropTypes.func,
  text: PropTypes.string.isRequired,
  children: PropTypes.node
};

ExpandableMenuListItem.defaultProps = {
  onClick: _.noop,
  isOpen: false
};

export default ExpandableMenuListItem;
