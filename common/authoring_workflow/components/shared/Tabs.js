import PropTypes from 'prop-types';
import React, { Component } from 'react';

export class Tabs extends Component {

  renderTab(tab) {
    const { iconClassName, onClickTab, selected, tabIndex, title } = tab;
    const linkAttributes = {
      className: selected ? 'selected' : null,
      onClick: () => onClickTab(tabIndex)
    };

    return (
      <li key={title}>
        <a {...linkAttributes}>
          <span className={iconClassName}></span>
          {title}
        </a>
      </li>
    );
  }

  render() {
    const renderedTabs = this.props.tabs.map((tab) => this.renderTab(tab));
    return (
      <ul className="tabs-list">
        {renderedTabs}
      </ul>
    );
  }
}

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.object)
};

export default Tabs;
