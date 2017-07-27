import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import ColumnHeader from 'components/Table/ColumnHeader';
import TransformStatus from 'components/Table/TransformStatus';
import TableBody from 'components/Table/TableBody';
import RowErrorsLink from 'components/Table/RowErrorsLink';
import * as ShowActions from 'actions/showOutputSchema';
import * as DisplayState from 'lib/displayState';
import { currentAndIgnoredOutputColumns } from 'selectors';
import { COLUMN_OPERATIONS } from 'actions/apiCalls';
import { STATUS_CALL_IN_PROGRESS } from 'lib/apiCallStatus';
import styles from 'styles/Table/Table.scss';

export function Table({
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
  location,
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
              addColumn={() => addColumn(outputSchema, column, location)}
              dropColumn={() => dropColumn(outputSchema, column, location)}
              validateThenSetRowIdentifier={() => validateThenSetRowIdentifier(outputSchema, column)} />
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
        error_indices: PropTypes.array.isRequired,
        id: PropTypes.number.isRequired,
        output_soql_type: PropTypes.string.isRequired,
        transform_expr: PropTypes.string.isRequired,
        transform_input_columns: PropTypes.array.isRequired
      })
    })
  ),
  location: PropTypes.shape({
    pathname: PropTypes.string
  })
};

const combineAndSort = ({ current, ignored }) => _.sortBy([...current, ...ignored], 'position');

// TODO: this is wrong...this only gets a single input column....not all
const getInputColumns = (entities, outputColumns) =>
  outputColumns.map(outputColumn => {
    const inputColumnId = outputColumn.transform.transform_input_columns[0].input_column_id;
    const inputColumn = entities.input_columns[inputColumnId];
    return {
      ...outputColumn,
      inputColumn
    };
  });

// TODO: we currently don't handle the case where currentAndIgnoredOutputColumns
// fails; should probably redirect or display some message to the user
const mapStateToProps = ({ entities, ui }, { path, inputSchema, outputSchema, displayState }) => {
  const { apiCalls } = ui;
  const apiCallsByColumnId = _.chain(apiCalls)
    .filter(call => _.includes(COLUMN_OPERATIONS, call.operation) && call.status === STATUS_CALL_IN_PROGRESS)
    .keyBy('params.outputColumnId')
    .value();
  return {
    entities,
    path,
    inputSchema,
    outputSchema,
    displayState,
    outputColumns: getInputColumns(
      entities,
      combineAndSort(currentAndIgnoredOutputColumns(entities, outputSchema.id))
    ),
    apiCallsByColumnId
  };
};

const mapDispatchToProps = dispatch => ({
  addColumn: (outputSchema, column, location) =>
    dispatch(ShowActions.addColumn(outputSchema, column, location)),
  dropColumn: (outputSchema, column, location) =>
    dispatch(ShowActions.dropColumn(outputSchema, column, location)),
  updateColumnType: (oldSchema, oldColumn, newType, location) =>
    dispatch(ShowActions.updateColumnType(oldSchema, oldColumn, newType, location)),
  validateThenSetRowIdentifier: (outputSchema, column) =>
    dispatch(ShowActions.validateThenSetRowIdentifier(outputSchema, column))
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Table));
