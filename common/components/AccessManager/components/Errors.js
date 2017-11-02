import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Errors extends Component {
  static propTypes = {
    errors: PropTypes.arrayOf(PropTypes.any)
  }

  static defaultProps = {
    errors: []
  }

  render() {
    return (
      <div>
        {this.props.errors.map(error => (
          <div key={error} className="alert error">{error}</div>
        ))}
      </div>
    );
  }
}

export default Errors;
