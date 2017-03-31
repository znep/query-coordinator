import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
import TableCell from './TableCell';
import RowError from './RowError';
import * as DisplayState from '../../lib/displayState';
import { PAGE_SIZE } from '../../actions/loadData';
import styles from 'styles/Table/TableBody.scss';

class TableBody extends Component {

  // shouldComponentUpdate(nextProps) {
  //   return !_.isEqual(
  //     {
  //       columns: nextProps.transforms.map(t => [t.id, t.fetched_rows, t.error_indices]),
  //       displayState: nextProps.displayState,
  //       numRowErrors: _.size(nextProps.db.row_errors)
  //     },
  //     {
  //       columns: this.props.transforms.map(t => [t.id, t.fetched_rows, t.error_indices]),
  //       displayState: this.props.displayState,
  //       numRowErrors: _.size(this.props.db.row_errors)
  //     }
  //   );
  // }

  getData() {
    const props = this.props;
    const transformTables = props.transforms.map((transform) => (
      props.db[`transform_${transform.id}`]
    ));
    const startRow = props.displayState.pageNo * PAGE_SIZE;
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
      transforms: props.transforms.map((transform, transformIdx) => {
        const cell = transformTables[transformIdx][rowIdx];
        return {
          id: transform.id,
          cell
        };
      }),
      rowError: props.db.row_errors[`${props.inputSchemaId}-${rowIdx}`]
    }));
  }

  renderNormalRow(row) {
    return row.transforms.map((transform) => (
      <TableCell
        key={transform.id}
        cell={transform.cell} />
    ));
  }

  render() {
    const data = this.getData();
    const rows = data.map((row) => (
      <tr key={row.rowIdx} className={classNames({ 'malformed-row': !!row.rowError })}>
        {row.rowError ?
          <RowError rowError={row.rowError} /> :
          this.renderNormalRow(row)}
      </tr>
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
  transforms: PropTypes.arrayOf(PropTypes.object).isRequired,
  displayState: PropTypes.object.isRequired,
  inputSchemaId: PropTypes.number.isRequired
};

export default TableBody;
