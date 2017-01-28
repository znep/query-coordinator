import React, { PropTypes } from 'react';
import TableCell from './TableCell';

const RENDER_ROWS = 50;

export default React.createClass({

  propTypes: {
    db: PropTypes.object.isRequired,
    columns: PropTypes.array.isRequired,
    errorsColumnId: PropTypes.number
  },

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(
      {
        columns: nextProps.columns.map(c => [c.fetched_rows, c.error_indices]),
        errorsColumnId: nextProps.errorsColumnId
      },
      {
        columns: this.props.columns.map(c => [c.fetched_rows, c.error_indices]),
        errorsColumnId: this.props.errorsColumnId
      }
    );
  },

  getData() {
    const columnTables = this.props.columns.map((column) => (
      this.props.db[`column_${column.id}`]
    ));
    let rowIndices;
    if (_.isNumber(this.props.errorsColumnId)) {
      const errorsColumn = _.find(this.props.db.columns, { id: this.props.errorsColumnId });
      rowIndices = errorsColumn.error_indices || _.range(50);
    } else {
      rowIndices = _.range(0, RENDER_ROWS);
    }
    return rowIndices.map((rowIdx) => ({
      rowIdx,
      columns: this.props.columns.map((column, colIdx) => {
        const cell = columnTables[colIdx][rowIdx];
        return {
          id: column.id,
          cell
        };
      })
    }));
  },

  render() {
    const data = this.getData();
    const rows = data.map((row) => (
      <tr key={row.rowIdx}>
        {row.columns.map((column) => (
          <TableCell
            key={column.id}
            cell={column.cell} />
        ))}
      </tr>
    ));
    return (
      <tbody tabIndex="0">
        {rows}
      </tbody>
    );
  }

});
