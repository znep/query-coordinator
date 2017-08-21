import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter, browserHistory } from 'react-router';
import ColumnHeader from 'components/Table/ColumnHeader';
import TransformStatus from 'components/Table/TransformStatus';
import TableBody from 'components/Table/TableBody';
import RowErrorsLink from 'components/Table/RowErrorsLink';
import * as ShowActions from 'actions/showOutputSchema';
import * as DisplayState from 'lib/displayState';
import { COLUMN_OPERATIONS } from 'actions/apiCalls';
import { STATUS_CALL_IN_PROGRESS } from 'lib/apiCallStatus';
import styles from 'styles/Table/Table.scss';
import * as Selectors from 'selectors';
import { showModal } from 'actions/modal';
import * as Links from '../../links';

// these are the types that mean something might be vaguely geo-y. they come from clads.
// view them by doing:
// curl -XGET http://clads.app.aws-us-west-2-staging.socrata.net/models | jq '.column_type_classifier'
const geoSemanticTypes = [
  'zip_or_postal',
  'state_or_province',
  'latitude',
  'longitude',
  'country',
  'city'
];

// generate shortcut icons based on the semantic type of the input columns
function genShortcuts(column) {
  const shortcuts = [];

  if (_.find(column.inputColumns, ic => _.includes(geoSemanticTypes, ic.semantic_type))) {
    shortcuts.push('geocode');
  }

  return shortcuts;
}

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
  showShortcut,
  validateThenSetRowIdentifier,
  onClickError
}) {
  const numRowErrors = inputSchema.num_row_errors;
  const showFlyouts = true;
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
              addColumn={() => addColumn(outputSchema, column)}
              dropColumn={() => dropColumn(outputSchema, column)}
              showShortcut={showShortcut}
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
              shortcuts={genShortcuts(column)}
              displayState={displayState}
              columnId={column.id}
              onClickError={onClickError(path, column.transform, displayState)}
              showShortcut={showShortcut}
              flyouts={showFlyouts}
              totalRows={inputSchema.total_rows} />
          )}
        </tr>
        {numRowErrors > 0 &&
          <RowErrorsLink
            path={path}
            displayState={displayState}
            numRowErrors={numRowErrors} />}
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
  onClickError: PropTypes.func.isRequired,
  showShortcut: PropTypes.func.isRequired,
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

const combineAndSort = ({ current, ignored }) => _.sortBy([...current, ...ignored], 'position');

const getInputColumns = (entities, outputColumns) => outputColumns.map((outputColumn) => {
  const inputColumns = outputColumn.transform.transform_input_columns
    .map(ic => entities.input_columns[ic.input_column_id]);
  return {
    ...outputColumn,
    inputColumns
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
      combineAndSort(
        Selectors.currentAndIgnoredOutputColumns(
          entities,
          outputSchema.id
        )
      )
    ),
    apiCallsByColumnId
  };
};

const redirectToNewOutputschema = (dispatch, params) => (resp) => {
  dispatch(ShowActions.redirectToOutputSchema(params, resp.resource.id));
};

const mergeProps = (stateProps, { dispatch }, ownProps) => {
  const params = ownProps.params;

  const dispatchProps = {
    addColumn: (outputSchema, column) => (
      dispatch(ShowActions.addColumn(outputSchema, column))
        .then(redirectToNewOutputschema(dispatch, params))
    ),

    dropColumn: (outputSchema, column) => (
      dispatch(ShowActions.dropColumn(outputSchema, column))
        .then(redirectToNewOutputschema(dispatch, params))
    ),

    updateColumnType: (oldSchema, oldColumn, newType) => (
      dispatch(ShowActions.updateColumnType(oldSchema, oldColumn, newType))
        .then(redirectToNewOutputschema(dispatch, params))
    ),

    showShortcut: (name) => dispatch(showModal(name, {
      path: ownProps.path,
      displayState: ownProps.displayState,
      params: ownProps.params
    })),

    validateThenSetRowIdentifier: (outputSchema, column) =>
      dispatch(ShowActions.validateThenSetRowIdentifier(outputSchema, column)),

    onClickError: (path, transform, displayState) => () => {
      const linkPath = DisplayState.inErrorMode(displayState, transform) ?
        Links.showOutputSchema(params, path.sourceId, path.inputSchemaId, path.outputSchemaId) :
        Links.showColumnErrors(params, path.sourceId, path.inputSchemaId, path.outputSchemaId, transform.id);

      browserHistory.push(linkPath);
    }
  };

  return { ...stateProps, ...dispatchProps, ...ownProps };
};

export default withRouter(connect(mapStateToProps, null, mergeProps)(Table));
