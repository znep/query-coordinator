import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import geojson2wkt from 'geojson2wkt';
import styles from './TableCell.scss';
import classNames from 'classnames';

class TableCell extends Component {

  shouldComponentUpdate(nextProps) {
    return this.props.cell !== nextProps.cell;
  }

  render() {
    const { cell, type, failed } = this.props;

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
        <td
          className={classNames(styles.error, { [styles.transformFailed]: failed })}
          title={cell.error.message.english || cell.error.message}>
          <div>{input}</div>
        </td>
      );
    } else if (cell.ok === null) {
      return (
        <td className={classNames(styles.empty, { [styles.transformFailed]: failed })}>
          <div />
        </td>
      );

    } else {
      return (
        <td className={classNames(styles.base, { [styles.transformFailed]: failed })}>
          <div>{renderCellValue(cell.ok, type)}</div>
        </td>
      );

    }
  }
}

function renderLocation({ latitude, longitude }) {
  return `Location(${latitude}, ${longitude})`;
}

function renderCellValue(value, type) {
  switch (type) {
    case 'location':
      return renderLocation(value);
    default:
      if (value.type) {
        return geojson2wkt.convert(value);
      } else {
        return `${value}`;
      }
  }
}

TableCell.propTypes = {
  cell: PropTypes.object,
  failed: PropTypes.bool,
  type: PropTypes.string
};

export default TableCell;
