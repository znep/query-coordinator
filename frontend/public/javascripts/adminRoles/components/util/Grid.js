import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';

import styles from './grid.module.scss';

class Grid extends Component {
  static propTypes = {
    className: PropTypes.string
  };

  render() {
    const { className } = this.props;
    return (
      <div styleName="grid" className={className}>
        {this.props.children}
      </div>
    );
  }
}

class Column extends Component {
  static propTypes = {
    className: PropTypes.string
  };

  render() {
    const { className } = this.props;
    return (
      <div styleName="column" className={className}>
        {this.props.children}
      </div>
    );
  }
}

class Header extends Component {
  static propTypes = {
    className: PropTypes.string
  };

  render() {
    const { className } = this.props;
    return (
      <div styleName="header" className={className}>
        {this.props.children}
      </div>
    );
  }
}

class Cell extends Component {
  static propTypes = {
    className: PropTypes.string
  };

  render() {
    const { children, className } = this.props;
    return (
      <div styleName="cell" className={className}>
        {children}
      </div>
    );
  }
}

Grid.Column = cssModules(Column, styles);
Grid.Header = cssModules(Header, styles);
Grid.Cell = cssModules(Cell, styles);

export default cssModules(Grid, styles);
