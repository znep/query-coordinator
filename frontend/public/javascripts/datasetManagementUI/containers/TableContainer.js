import { connect } from 'react-redux';
import _ from 'lodash';
import { withRouter } from 'react-router';
import * as ShowActions from 'reduxStuff/actions/showOutputSchema';
import { currentAndIgnoredOutputColumns } from 'selectors';
import { COLUMN_OPERATIONS } from 'reduxStuff/actions/apiCalls';
import { STATUS_CALL_IN_PROGRESS } from 'lib/apiCallStatus';
import Table from 'components/Table/Table';

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
  addColumn: (outputSchema, column, params) => dispatch(ShowActions.addColumn(outputSchema, column, params)),
  dropColumn: (outputSchema, column, params) =>
    dispatch(ShowActions.dropColumn(outputSchema, column, params)),
  updateColumnType: (oldSchema, oldColumn, newType, params) =>
    dispatch(ShowActions.updateColumnType(oldSchema, oldColumn, newType, params)),
  validateThenSetRowIdentifier: (outputSchema, column, params) =>
    dispatch(ShowActions.validateThenSetRowIdentifier(outputSchema, column, params))
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Table));
