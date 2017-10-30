import { connect } from 'react-redux';
import _ from 'lodash';
import { withRouter, browserHistory } from 'react-router';
import * as ShowActions from 'reduxStuff/actions/showOutputSchema';
import * as ModalActions from 'reduxStuff/actions/modal';
import { currentAndIgnoredOutputColumns } from 'selectors';
import { COLUMN_OPERATIONS } from 'reduxStuff/actions/apiCalls';
import { STATUS_CALL_IN_PROGRESS } from 'lib/apiCallStatus';
import * as DisplayState from 'lib/displayState';
import * as Links from 'links/links';
import Table from 'components/Table/Table';

const combineAndSort = ({ current, ignored }) => _.sortBy([...current, ...ignored], 'position');

// TODO: this is wrong...this only gets a single input column....not all
const getInputColumns = (entities, outputColumns) =>
  outputColumns.map(outputColumn => {
    const inputColumns = outputColumn.transform.transform_input_columns.map(
      ic => entities.input_columns[ic.input_column_id]
    );

    return {
      ...outputColumn,
      inputColumns
    };
  });

// TODO: we currently don't handle the case where currentAndIgnoredOutputColumns
// fails; should probably redirect or display some message to the user
const mapStateToProps = (
  { entities, ui },
  { path, inputSchema, outputSchema, displayState, showShortcut }
) => {
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
    showShortcut,
    outputColumns: getInputColumns(
      entities,
      combineAndSort(currentAndIgnoredOutputColumns(entities, outputSchema.id))
    ),
    apiCallsByColumnId
  };
};

const redirectToNewOutputschema = (dispatch, params) => resp => {
  if (resp && resp.resource) {
    dispatch(ShowActions.redirectToOutputSchema(params, resp.resource.id));
  }
};

const mergeProps = (stateProps, { dispatch }, ownProps) => {
  const params = ownProps.params;

  const dispatchProps = {
    addColumn: (outputSchema, column) =>
      dispatch(ShowActions.addColumn(outputSchema, column)).then(redirectToNewOutputschema(dispatch, params)),

    dropColumn: (outputSchema, column) =>
      dispatch(ShowActions.dropColumn(outputSchema, column)).then(
        redirectToNewOutputschema(dispatch, params)
      ),

    updateColumnType: (oldSchema, oldColumn, newType) =>
      dispatch(ShowActions.updateColumnType(oldSchema, oldColumn, newType)).then(
        redirectToNewOutputschema(dispatch, params)
      ),

    validateThenSetRowIdentifier: (outputSchema, column) =>
      dispatch(ShowActions.validateThenSetRowIdentifier(outputSchema, column)).then(
        redirectToNewOutputschema(dispatch, params)
      ),

    unSetRowIdentifier: (outputSchema) =>
      dispatch(ShowActions.unsetRowIdentifier(outputSchema)).then(
        redirectToNewOutputschema(dispatch, params)
      ),

    moveLeft: (outputSchema, column) =>
      dispatch(ShowActions.moveColumnToPosition(outputSchema, column, column.position - 1)).then(
        redirectToNewOutputschema(dispatch, params)
      ),

    moveRight: (outputSchema, column) =>
      dispatch(ShowActions.moveColumnToPosition(outputSchema, column, column.position + 1)).then(
        redirectToNewOutputschema(dispatch, params)
      ),

    formatColumn: (outputSchema, column) =>
      dispatch(ModalActions.showModal('FormatColumn', {
        outputSchema,
        column,
        params
      })),

    onClickError: (path, transform, displayState) => {
      const linkPath = DisplayState.inErrorMode(displayState, transform)
        ? Links.showOutputSchema(
          path,
          path.sourceId,
          path.inputSchemaId,
          path.outputSchemaId
        ) : Links.showColumnErrors(
            path,
            path.sourceId,
            path.inputSchemaId,
            path.outputSchemaId,
            transform.id
          );

      browserHistory.push(linkPath);
    }
  };

  return { ...stateProps, ...dispatchProps, ...ownProps };
};

export default withRouter(connect(mapStateToProps, null, mergeProps)(Table));
