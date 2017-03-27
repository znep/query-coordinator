import React, { PropTypes } from 'react';
import ColumnHeader from './ColumnHeader';
import TransformStatus from './TransformStatus';
import TableBody from './TableBody';
import RowErrorsLink from './RowErrorsLink';
import classNames from 'classnames';
import * as DisplayState from '../../lib/displayState';

export default function Table({
  db,
  path,
  inputSchema,
  outputSchema,
  columns,
  displayState,
  updateColumnType }) {

  const inRowErrorMode = displayState.type === DisplayState.ROW_ERRORS;
  const numRowErrors = inputSchema.num_row_errors;
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
              displayState={displayState}
              columnId={column.id}
              totalRows={inputSchema.total_rows} />
          )}
        </tr>
        {(numRowErrors > 0) &&
          <tr className="row-errors-count">
            <th
              className={classNames(
                'row-errors-count',
                { 'row-errors-count-selected': inRowErrorMode }
              )}>
              <RowErrorsLink
                path={path}
                displayState={displayState}
                numRowErrors={numRowErrors} />
            </th>
          </tr>}
      </thead>
      <TableBody
        db={db}
        transforms={transforms}
        displayState={displayState}
        inputSchemaId={inputSchema.id} />
    </table>
  );
}

Table.propTypes = {
  db: PropTypes.object.isRequired,
  path: PropTypes.object.isRequired,
  inputSchema: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateColumnType: PropTypes.func.isRequired,
  displayState: PropTypes.object.isRequired
};
