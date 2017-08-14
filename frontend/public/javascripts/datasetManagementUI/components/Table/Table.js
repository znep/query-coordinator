import _ from 'lodash';
import React, { PropTypes } from 'react';
import ColumnHeader from 'components/ColumnHeader/ColumnHeader';
import TransformStatus from 'components/TransformStatus/TransformStatus';
import TableBody from 'containers/TableBodyContainer';
import RowErrorsLink from 'components/RowErrorsLink/RowErrorsLink';
import * as DisplayState from 'lib/displayState';
import styles from './Table.scss';

function Table({
  entities,
  path,
  inputSchema,
  outputSchema,
  outputColumns,
  displayState,
  apiCallsByColumnId,
  updateColumnType,
  addColumn,
  dropColumn,
  params,
  validateThenSetRowIdentifier
}) {
  const inRowErrorMode = displayState.type === DisplayState.ROW_ERRORS;
  const numRowErrors = inputSchema.num_row_errors;
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {outputColumns.map(column =>
            <ColumnHeader
              key={column.id}
              outputSchema={outputSchema}
              outputColumn={column}
              updateColumnType={updateColumnType}
              activeApiCallInvolvingThis={_.has(apiCallsByColumnId, column.id)}
              addColumn={() => addColumn(outputSchema, column, params)}
              dropColumn={() => dropColumn(outputSchema, column, params)}
              validateThenSetRowIdentifier={() =>
                validateThenSetRowIdentifier(outputSchema, column, params)} />
          )}
        </tr>
        <tr className={styles.columnStatuses}>
          {outputColumns.map(column =>
            <TransformStatus
              key={column.id}
              path={path}
              transform={column.transform}
              isIgnored={column.ignored || false}
              displayState={displayState}
              columnId={column.id}
              totalRows={inputSchema.total_rows} />
          )}
        </tr>
        {numRowErrors > 0 &&
          <RowErrorsLink
            path={path}
            displayState={displayState}
            numRowErrors={numRowErrors}
            inRowErrorMode={inRowErrorMode} />}
      </thead>
      <TableBody
        entities={entities}
        columns={outputColumns}
        displayState={displayState}
        inputSchemaId={inputSchema.id} />
    </table>
  );
}

Table.propTypes = {
  entities: PropTypes.object.isRequired,
  path: PropTypes.object.isRequired,
  inputSchema: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  updateColumnType: PropTypes.func.isRequired,
  addColumn: PropTypes.func.isRequired,
  dropColumn: PropTypes.func.isRequired,
  validateThenSetRowIdentifier: PropTypes.func.isRequired,
  displayState: PropTypes.object.isRequired,
  apiCallsByColumnId: PropTypes.object.isRequired,
  outputColumns: PropTypes.arrayOf(
    PropTypes.shape({
      position: PropTypes.number.isRequired,
      field_name: PropTypes.string.isRequired,
      display_name: PropTypes.string.isRequired,
      description: PropTypes.string,
      transform_id: PropTypes.number.isRequired,
      transform: PropTypes.shape({
        attempts: PropTypes.number.isRequired,
        error_indices: PropTypes.array,
        id: PropTypes.number.isRequired,
        output_soql_type: PropTypes.string.isRequired,
        transform_expr: PropTypes.string.isRequired,
        transform_input_columns: PropTypes.array.isRequired
      })
    })
  ),
  params: PropTypes.object.isRequired
};

export default Table;
