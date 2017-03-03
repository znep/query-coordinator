import _ from 'lodash';
import React, { PropTypes, Component } from 'react';

class TableCell extends Component {

  shouldComponentUpdate(nextProps) {
    return this.props.cell !== nextProps.cell;
  }

  render() {
    const cell = this.props.cell;
    if (!cell) {
      return (<td className="not-yet-loaded" />);
    } else if (cell.error) {
      const inputs = cell.error.inputs;
      const input = _.first(_.map(inputs, (value) => value)).ok;
      return (
        <td className="error" title={cell.error.message}>
          <div>{input}</div>
        </td>
      );
    } else if (cell.ok === null) {
      return (
        <td className="empty"><div /></td>
      );
    } else {
      return (
        <td>
          <div>{`${cell.ok}`}</div>
        </td>
      );
    }
  }

}

TableCell.propTypes = {
  cell: PropTypes.object
};

export default TableCell;
