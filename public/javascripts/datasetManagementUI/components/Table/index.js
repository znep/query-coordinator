import React, { PropTypes } from 'react';
import ColumnHeader from './ColumnHeader';
import TransformStatus from './TransformStatus';
import TableBody from './TableBody';
import { commaify } from '../../../common/formatNumber';

export default function Table({
  db,
  path,
  inputSchema,
  outputSchema,
  rowErrors,
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
        <tr className="column-statuses">
          {columns.map(column =>
            <TransformStatus
              key={column.transform.id}
              path={path}
              transform={column.transform}
              errorsTransformId={errorsTransformId}
              columnId={column.id}
              totalRows={inputSchema.total_rows} />
          )}
        </tr>
        {(rowErrors.length > 0) &&
          <tr className="row-errors-count">
            <th className="row-errors-count"> {/* TODO: different class name */}
              <div className="column-status-text">
                <span className="err-info error">{commaify(rowErrors.length)}</span>
                Malformed rows
              </div>
            </th>
          </tr>}
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
  inputSchema: PropTypes.object.isRequired,
  rowErrors: PropTypes.arrayOf(PropTypes.object).isRequired,
  outputSchema: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateColumnType: PropTypes.func.isRequired,
  errorsTransformId: PropTypes.number
};
