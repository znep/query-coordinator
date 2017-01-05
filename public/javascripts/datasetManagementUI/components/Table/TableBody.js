import React, { PropTypes } from 'react';
import TableCell from './TableCell';

const RENDER_ROWS = 50;

export default React.createClass({

  propTypes: {
    db: PropTypes.object.isRequired,
    columns: PropTypes.array.isRequired
  },

  shouldComponentUpdate(nextProps) {
    const currentFetchedRows = this.props.columns.map((column) => (column.fetched_rows));
    const nextFetchedRows = nextProps.columns.map((column) => (column.fetched_rows));
    return !_.isEqual(currentFetchedRows, nextFetchedRows);
  },

  getData() {
    const columnTables = this.props.columns.map((column) => (
      this.props.db[`column_${column.id}`]
    ));
    return _.range(0, RENDER_ROWS).map((rowIdx) => (
      this.props.columns.map((column, colIdx) => {
        const cell = columnTables[colIdx][rowIdx];
        return {
          value: cell ? cell.value : null,
          id: column.id
        };
      })
    ));
  },

  render() {
    return (
      <tbody>
        {this.getData().map((row, rowIdx) => (
          <tr key={rowIdx}>
            {row.map((column) => (
              <TableCell
                key={column.id}
                value={column.value} />
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

});
