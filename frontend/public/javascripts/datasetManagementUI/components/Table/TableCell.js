import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import styles from 'styles/Table/TableCell.scss';

class TableCell extends Component {

  shouldComponentUpdate(nextProps) {
    return this.props.cell !== nextProps.cell;
  }

  render() {
    const cell = this.props.cell;
    if (!cell) {
      return (<td className={styles.notYetLoaded} />);
    } else if (cell.error) {
      const inputs = cell.error.inputs;
      const input = _.first(_.map(inputs, (value) => value)).ok;
      return (
        <td className={styles.error} title={cell.error.message}>
          <div>{input}</div>
        </td>
      );
    } else if (cell.ok === null) {
      return (
        <td className={styles.empty}><div /></td>
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
