import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import styles from './TableCell.module.scss';
import classNames from 'classnames';

import renderNumber from './NumberCell';
import renderText from './TextCell';
import DateCell from './DateCell';
import LocationCell from './LocationCell';
import GeospatialCell from './GeospatialCell';
import PointCell from './PointCell';

class TableCell extends Component {
  shouldComponentUpdate(nextProps) {
    return (
      this.props.cell !== nextProps.cell ||
      !_.isEqual(this.props.format, nextProps.format) ||
      this.props.isDropping !== nextProps.isDropping
    );
  }

  render() {
    const { cell, type, failed, isDropping } = this.props;

    const format = this.props.format || {}; // hack for undefined formats ;_;

    const c = [styles.notYetLoaded];

    if (isDropping) {
      c.push(styles.dropping);
    }

    if (!cell) {
      return <td className={c.join(' ')} />;
    } else if (cell.error) {
      const inputs = cell.error.inputs;

      // If there is exactly one input, it makes sense to display the
      // original value here (because it's likely a conversion of some
      // kind as far as the user is concerned).  If it's not exactly
      // one, just display the cell blank.
      const input = Object.keys(inputs).length === 1 ? _.first(_.map(inputs, value => value)).ok : '';
      return (
        <td
          className={classNames(styles.error, {
            [styles.transformFailed]: failed
          })}
          title={cell.error.message.english || cell.error.message}>
          <div className={isDropping ? styles.dropping : ''}>{input}</div>
        </td>
      );
    } else if (cell.ok === null) {
      return (
        <td
          className={classNames(styles.empty, {
            [styles.transformFailed]: failed
          })}>
          <div className={isDropping ? styles.dropping : ''} />
        </td>
      );
    } else {
      return (
        <td
          className={classNames(styles.base, {
            [styles.transformFailed]: failed
          })}>
          {renderCellValue(cell.ok, type, format, isDropping)}
        </td>
      );
    }
  }
}

function renderCellValue(value, type, format, isDropping) {
  const props = { value, format, isDropping };
  switch (type) {
    case 'location':
      return <LocationCell {...props} />;
    case 'text':
      return renderText(props);
    case 'number':
      // This one is a little funky because there are several different
      // classes that render numbers differently, like a CurrencyCell, PercentCell,
      // etc, and I didn't want to mix a switch based on formats into this switch
      // which is based on actual data types, so the switch based on formats happens
      // in renderNumber, and it returns the correct renderer based on the formatting
      // rules for that column
      return renderNumber(props);
    case 'calendar_date':
      return <DateCell {...props} />;
    case 'point':
      return <PointCell {...props} />;
    case 'multipoint':
    case 'line':
    case 'multiline':
    case 'polygon':
    case 'multipolygon':
      return <GeospatialCell {...props} />;
    default:
      return <div className={isDropping ? styles.dropping : ''}>{_.toString(value)}</div>;
  }
}

TableCell.propTypes = {
  isDropping: PropTypes.bool,
  cell: PropTypes.object,
  failed: PropTypes.bool,
  type: PropTypes.string,
  format: PropTypes.object
};

export default TableCell;
