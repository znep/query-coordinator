import React, { PropTypes } from 'react';
import ColumnHeader from './ColumnHeader';
import ColumnStatus from './ColumnStatus';
import TableBody from './TableBody';

export default function Table({ db, totalRows, outputSchema, columns, updateColumnType }) {
  return (
    <table className="table table-condensed">
      <thead>
        <tr>
          {columns.map(column =>
            <ColumnHeader
              key={column.id}
              outputSchema={outputSchema}
              column={column}
              updateColumnType={updateColumnType} />
          )}
        </tr>
        <tr>
          {columns.map(column =>
            <ColumnStatus
              key={column.id}
              column={column}
              totalRows={totalRows} />
          )}
        </tr>
      </thead>
      <TableBody
        db={db}
        columns={columns} />
    </table>
  );
}

Table.propTypes = {
  db: PropTypes.object.isRequired,
  totalRows: PropTypes.number,
  outputSchema: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateColumnType: PropTypes.func.isRequired
};
