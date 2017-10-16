import React, { Children, Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

export class Tabs extends Component {
  constructor() {
    super();

    this.state = {
      currentTab: 0
    };
  }

  render() {
    const { children } = this.props;
    const { currentTab } = this.state;
    const tabs = Children.map(children, (child, index) => {
      const className = cx('tab-link', {
        current: index === currentTab
      });
      return (
        <li className={className}>
          <a href="#" onClick={() => this.setState({ currentTab: index })}>
            {child.props.name}
          </a>
        </li>
      );
    });
    const tabContent = Children.map(children, (child, index) => {
      return <div style={{ display: index === currentTab ? 'block' : 'none' }}>{child}</div>;
    });

    return (
      <div>
        <ul className="nav-tabs">{tabs}</ul>
        {tabContent}
      </div>
    );
  }
}

Tabs.propTypes = {
  children: PropTypes.any.isRequired
};
