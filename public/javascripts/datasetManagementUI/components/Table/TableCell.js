import React, { PropTypes } from 'react';

export default React.createClass({

  propTypes: {
    cell: PropTypes.object
  },

  shouldComponentUpdate(nextProps) {
    return this.props.cell !== nextProps.cell;
  },

  render() {
    if (!this.props.cell) {
      return (<td className="not-yet-loaded" />);
    } else if (this.props.cell.ok) {
      return (
        <td>
          <div>{this.props.cell.ok}</div>
        </td>
      );
    } else if (this.props.cell.error) {
      const inputs = this.props.cell.error.inputs;
      const input = _.first(_.map(inputs, (value) => value)).ok;
      return (
        <td className="error" title={this.props.cell.error.message}>
          <div>{input}</div>
        </td>
      );
    }
  }

});
