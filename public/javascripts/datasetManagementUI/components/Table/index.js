import React, { PropTypes } from 'react';
import ColumnHeader from './ColumnHeader';
import TransformStatus from './TransformStatus';
import TableBody from './TableBody';

export default function Table({
  db,
  path,
  outputSchema,
  totalRows,
  columns,
  errorsTransformId,
  updateColumnType }) {

  const transforms = _.map(columns, 'transform');
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
            <TransformStatus
              key={column.transform.id}
              path={path}
              transform={column.transform}
              errorsTransformId={errorsTransformId}
              columnId={column.id}
              totalRows={totalRows} />
          )}
        </tr>
      </thead>
      <TableBody
        db={db}
        transforms={transforms}
        errorsTransformId={errorsTransformId} />
    </table>
  );
}

Table.propTypes = {
  db: PropTypes.object.isRequired,
  path: PropTypes.object.isRequired,
  totalRows: PropTypes.number,
  outputSchema: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateColumnType: PropTypes.func.isRequired,
  errorsTransformId: PropTypes.number
};
