import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import TableCell from './TableCell';
import RowError from './RowError';
import * as DisplayState from '../../lib/displayState';
import { PAGE_SIZE } from '../../actions/loadData';
import styles from 'styles/Table/TableBody.scss';

class TableBody extends Component {

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(
      {
        columns: nextProps.columns.map((c) => (
          c.transform ?
          [c.transform.id, c.transform.fetched_rows, c.transform.error_indices] :
          null
        )),
        displayState: nextProps.displayState,
        __loads__: nextProps.db.__loads__
      },
      {
        columns: this.props.columns.map((c) => (
          c.transform ?
          [c.transform.id, c.transform.fetched_rows, c.transform.error_indices] :
          null
        )),
        displayState: this.props.displayState,
        __loads__: this.props.db.__loads__
      }
    );
  }

  getData() {
    const props = this.props;

    const startRow = (props.displayState.pageNo - 1) * PAGE_SIZE;
    const endRow = startRow + PAGE_SIZE;
    let rowIndices;
    if (props.displayState.type === DisplayState.COLUMN_ERRORS) {
      const errorsTransform = props.db.transforms[props.displayState.transformId];
      if (errorsTransform.error_indices) {
        rowIndices = errorsTransform.error_indices.slice(startRow, endRow);
      } else {
        rowIndices = [];
      }
    } else if (props.displayState.type === DisplayState.ROW_ERRORS) {
      rowIndices = _.filter(props.db.row_errors, { input_schema_id: props.inputSchemaId }).
                     map((rowError) => rowError.offset);
    } else {
      rowIndices = _.range(startRow, endRow);
    }
    return rowIndices.map((rowIdx) => ({
      rowIdx,
      transforms: this.props.columns.map((column) => {
        const transform = column.transform;
        if (column.ignored) {
          return {
            id: `column_${column.id}`,
            cell: null
          };
        } else {
          const cell = this.props.db[`transform_${transform.id}`][rowIdx];
          return {
            id: transform.id,
            cell
          };
        }
      }),
      rowError: props.db.row_errors[`${props.inputSchemaId}-${rowIdx}`]
    }));
  }

  renderNormalRow(row) {
    return (
      <tr key={row.rowIdx}>
        {row.transforms.map((transform) => {
          return (<TableCell
            key={transform.id}
            cell={transform.cell} />);
        })}
      </tr>);
  }

  render() {
    const data = this.getData();
    const rows = data.map(row => (
      row.rowError ? <RowError key={row.rowIdx} row={row} /> : this.renderNormalRow(row)
    ));

    return (
      <tbody className={styles.tableBody} tabIndex="0">
        {rows}
      </tbody>
    );
  }

}

TableBody.propTypes = {
  db: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  displayState: PropTypes.object.isRequired,
  inputSchemaId: PropTypes.number.isRequired
};

export default TableBody;
