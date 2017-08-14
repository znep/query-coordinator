import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import TableCell from 'components/TableCell/TableCell';
import RowError from 'components/RowError/RowError';
import * as DisplayState from 'lib/displayState';
import { PAGE_SIZE } from 'reduxStuff/actions/loadData';
import styles from './TableBody.scss';

class TableBody extends Component {
  shouldComponentUpdate(nextProps) {
    const nextStuff = {
      columns: nextProps.columns.map(c => (c.transform ? [c.transform.id, c.transform.error_indices] : null)),
      displayState: nextProps.displayState,
      apiCalls: nextProps.apiCalls
    };

    const currentStuff = {
      columns: this.props.columns.map(
        c => (c.transform ? [c.transform.id, c.transform.error_indices] : null)
      ),
      displayState: this.props.displayState,
      apiCalls: this.props.apiCalls
    };

    return !_.isEqual(nextStuff, currentStuff);
  }

  getData() {
    const props = this.props;

    const startRow = (props.displayState.pageNo - 1) * PAGE_SIZE;
    const endRow = startRow + PAGE_SIZE;
    let rowIndices;

    if (props.displayState.type === DisplayState.COLUMN_ERRORS) {
      const errorsTransform = props.entities.transforms[props.displayState.transformId];
      if (errorsTransform.error_indices) {
        rowIndices = errorsTransform.error_indices.slice(startRow, endRow);
      } else {
        rowIndices = [];
      }
    } else if (props.displayState.type === DisplayState.ROW_ERRORS) {
      rowIndices = _.filter(props.entities.row_errors, { input_schema_id: props.inputSchemaId }).map(
        rowError => rowError.offset
      );
    } else {
      rowIndices = _.range(startRow, endRow);
    }
    return rowIndices.map(rowIdx => ({
      rowIdx,
      transforms: this.props.columns.map(column => {
        const transform = column.transform;
        if (column.ignored) {
          return {
            id: `column_${column.id}`,
            cell: null
          };
        } else {
          const cell = this.props.entities.col_data[transform.id]
            ? this.props.entities.col_data[transform.id][rowIdx]
            : null;
          return {
            id: transform.id,
            cell
          };
        }
      }),
      rowError: props.entities.row_errors[`${props.inputSchemaId}-${rowIdx}`]
    }));
  }

  renderNormalRow(row) {
    return (
      <tr key={row.rowIdx}>
        {row.transforms.map(transform => {
          return <TableCell key={transform.id} cell={transform.cell} />;
        })}
      </tr>
    );
  }

  render() {
    const data = this.getData();
    const rows = data.map(
      row => (row.rowError ? <RowError key={row.rowIdx} row={row} /> : this.renderNormalRow(row))
    );

    return (
      <tbody className={styles.tableBody} tabIndex="0">
        {rows}
      </tbody>
    );
  }
}

TableBody.propTypes = {
  entities: PropTypes.object.isRequired,
  apiCalls: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  displayState: PropTypes.object.isRequired,
  inputSchemaId: PropTypes.number.isRequired
};

export default TableBody;
