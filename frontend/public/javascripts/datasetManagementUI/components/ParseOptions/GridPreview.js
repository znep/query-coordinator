import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styles from './ParseOptions.scss';
import _ from 'lodash';

const SubI18n = I18n.parse_options;

const GRID_SIZE = { columns: 6, rows: 12 };

class GridPreview extends Component {
  render() {
    const { parseOptions: {
      column_header: columnHeader,
      header_count: headerCount
    } } = this.props;


    const rowClass = (rowIndex) => (
      classNames(styles.gridRow, {
        [styles.theHeaderRow]: rowIndex === columnHeader,
        [styles.inHeaderRange]: rowIndex <= headerCount &&
          rowIndex !== columnHeader
      })
    );
    const annotationClass = (rowIndex) => (
      classNames(styles.annotationCell, {
        [styles.headerRowAnnotation]: rowIndex === columnHeader,
        [styles.headerRangeAnnotation]: rowIndex <= headerCount &&
          rowIndex !== columnHeader
      })
    );

    const getAnnotationFor = (rowIndex) => {
      if (rowIndex === columnHeader) {
        return SubI18n.this_is_your_header;
      }
      if (rowIndex <= headerCount) {
        return SubI18n.this_row_is_ignored;
      }
    };

    const start = (Math.floor(headerCount / GRID_SIZE.rows) * GRID_SIZE.rows) + 1;
    const end = start + GRID_SIZE.rows;

    return (
      <table className={styles.gridPreview}>
        <tbody>
          {_.range(start, end).map(row => (
            <tr key={row} className={rowClass(row)}>
              <td className={annotationClass(row)}>
                {getAnnotationFor(row)}
              </td>
              <td className={styles.indexCell}>
                {row}
              </td>
              {_.range(0, GRID_SIZE.columns).map(column => (
                <td key={`${row}-${column}`} className={styles.previewCell}></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

GridPreview.propTypes = {
  parseOptions: PropTypes.object.isRequired
};

export default GridPreview;
