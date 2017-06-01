import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import ColumnHeader from 'components/Table/ColumnHeader';
import TransformStatus from 'components/Table/TransformStatus';
import TableBody from 'components/Table/TableBody';
import RowErrorsLink from 'components/Table/RowErrorsLink';
import * as ShowActions from 'actions/showOutputSchema';
import * as DisplayState from 'lib/displayState';
import { currentAndIgnoredOutputColumns } from 'selectors';
import styles from 'styles/Table/Table.scss';
import { COLUMN_OPERATIONS } from 'actions/apiCalls';
import { STATUS_CALL_IN_PROGRESS } from 'lib/apiCallStatus';

export function Table({
  db,
  path,
  inputSchema,
  outputSchema,
  outputColumns,
  displayState,
  apiCallsByColumnId,
  updateColumnType,
  addColumn,
  dropColumn,
  validateThenSetRowIdentifier
}) {
  const inRowErrorMode = displayState.type === DisplayState.ROW_ERRORS;
  const numRowErrors = inputSchema.num_row_errors;
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {outputColumns.map(column => (
            <ColumnHeader
              key={column.id}
              outputSchema={outputSchema}
              column={column}
              updateColumnType={updateColumnType}
              activeApiCallInvolvingThis={_.has(apiCallsByColumnId, column.id)}
              addColumn={() => addColumn(outputSchema, column)}
              dropColumn={() => dropColumn(outputSchema, column)}
              validateThenSetRowIdentifier={() => validateThenSetRowIdentifier(outputSchema, column)} />
          ))}
        </tr>
        <tr className={styles.columnStatuses}>
          {outputColumns.map(column => (
            <TransformStatus
              key={column.id}
              path={path}
              transform={column.transform}
              isIgnored={column.ignored || false}
              displayState={displayState}
              columnId={column.id}
              totalRows={inputSchema.total_rows} />
          ))}
        </tr>
        {numRowErrors > 0 &&
          <RowErrorsLink
            path={path}
            displayState={displayState}
            numRowErrors={numRowErrors}
            inRowErrorMode={inRowErrorMode} />}
      </thead>
      <TableBody db={db} columns={outputColumns} displayState={displayState} inputSchemaId={inputSchema.id} />
    </table>
  );
}

Table.propTypes = {
  db: PropTypes.object.isRequired,
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
      transform_id: PropTypes.number.isRequired
    })
  )
};

const combineAndSort = ({ current, ignored }) => _.sortBy([...current, ...ignored], 'position');

// TODO: we currently don't handle the case where currentAndIgnoredOutputColumns
// fails; should probably redirect or display some message to the user
const mapStateToProps = ({ entities, ui }, { path, inputSchema, outputSchema, displayState }) => {
  const { apiCalls } = ui;
  const apiCallsByColumnId = _.chain(apiCalls)
    .filter(call => _.includes(COLUMN_OPERATIONS, call.operation) && call.status === STATUS_CALL_IN_PROGRESS)
    .keyBy('params.outputColumnId')
    .value();
  return {
    db: entities,
    path,
    inputSchema,
    outputSchema,
    displayState,
    outputColumns: combineAndSort(currentAndIgnoredOutputColumns(entities)),
    apiCallsByColumnId
  };
};

const mapDispatchToProps = dispatch => ({
  addColumn: (outputSchema, column) => dispatch(ShowActions.addColumn(outputSchema, column)),
  dropColumn: (outputSchema, column) => dispatch(ShowActions.dropColumn(outputSchema, column)),
  updateColumnType: (oldSchema, oldColumn, newType) =>
    dispatch(ShowActions.updateColumnType(oldSchema, oldColumn, newType)),
  validateThenSetRowIdentifier: (outputSchema, column) =>
    dispatch(ShowActions.validateThenSetRowIdentifier(outputSchema, column))
});

export default connect(mapStateToProps, mapDispatchToProps)(Table);
