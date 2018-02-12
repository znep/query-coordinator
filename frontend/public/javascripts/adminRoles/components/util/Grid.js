import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';

import styles from './grid.module.scss';

class Grid extends Component {
  render() {
    const { className } = this.props;
    return (
      <div styleName="grid" className={className}>
        {this.props.children}
      </div>
    );
  }
}

Grid.propTypes = {
  className: PropTypes.string
};

class Column extends Component {
  render() {
    const { className } = this.props;
    return (
      <div styleName="column" className={className}>
        {this.props.children}
      </div>
    );
  }
}

Column.propTypes = {
  className: PropTypes.string
};

class Header extends Component {
  render() {
    const { className } = this.props;
    return (
      <div styleName="header" className={className}>
        {this.props.children}
      </div>
    );
  }
}

Header.propTypes = {
  className: PropTypes.string
};

class Cell extends Component {
  render() {
    const { children, className} = this.props;
    return (
      <div styleName="cell" className={className}>
        {children}
      </div>
    );
  }
}

Cell.propTypes = {
  className: PropTypes.string
};

Grid.Column = cssModules(Column, styles);
Grid.Header = cssModules(Header, styles);
Grid.Cell = cssModules(Cell, styles);

export default cssModules(Grid, styles);
