import React, { PropTypes } from 'react';

export default React.createClass({

  propTypes: {
    value: PropTypes.string
  },

  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value;
  },

  render() {
    return (
      <td>
        <div>
          {this.props.value}
        </div>
      </td>
    );
  }

});
