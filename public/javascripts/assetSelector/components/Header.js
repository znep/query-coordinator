import React, { Component, PropTypes } from 'react';

export class Header extends Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <div className="modal-header">
        <h1>{this.props.title}</h1>
      </div>
    );
  }
}

Header.propTypes = {
  title: PropTypes.string.isRequired
};

Header.defaultProps = {
  title: ''
};

export default Header;
