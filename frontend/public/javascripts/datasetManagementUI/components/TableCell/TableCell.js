import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import geojson2wkt from 'geojson2wkt';
import styles from './TableCell.scss';

class TableCell extends Component {

  shouldComponentUpdate(nextProps) {
    return this.props.cell !== nextProps.cell;
  }

  render() {
    const { cell } = this.props;

    if (!cell) {
      return (<td className={styles.notYetLoaded} />);

    } else if (cell.error) {
      const inputs = cell.error.inputs;

      // If there is exactly one input, it makes sense to display the
      // original value here (because it's likely a conversion of some
      // kind as far as the user is concerned).  If it's not exactly
      // one, just display the cell blank.
      const input = Object.keys(inputs).length === 1 ? _.first(_.map(inputs, (value) => value)).ok : '';

      return (
        <td className={styles.error} title={cell.error.message.english || cell.error.message}>
          <div>{input}</div>
        </td>
      );
    } else if (cell.ok === null) {
      return (
        <td className={styles.empty}><div /></td>
      );

    } else {
      return (
        <td className={styles.base}>
          <div>{renderCellValue(cell.ok)}</div>
        </td>
      );

    }
  }

}

function renderCellValue(value) {
  if (value.type) {
    return geojson2wkt.convert(value);
  } else {
    return `${value}`;
  }
}

TableCell.propTypes = {
  cell: PropTypes.object
};

export default TableCell;
