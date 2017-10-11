import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import ColumnHeader from 'components/ColumnHeader/ColumnHeader';
import TransformStatus from 'components/TransformStatus/TransformStatus';
import TableBody from 'containers/TableBodyContainer';
import * as DisplayState from 'lib/displayState';
import RowErrorsLink from 'components/RowErrorsLink/RowErrorsLink';
import styles from './Table.scss';

// these are the types that mean something might be vaguely geo-y. they come from clads.
// view them by doing:
// curl -XGET http://clads.app.aws-us-west-2-staging.socrata.net/models | jq '.column_type_classifier'
const geoSemanticTypes = ['zip_or_postal', 'state_or_province', 'latitude', 'longitude', 'country', 'city'];

// generate shortcut icons based on the semantic type of the input columns
function genShortcuts(column) {
  const shortcuts = [];

  if (_.find(column.inputColumns, ic => _.includes(geoSemanticTypes, ic.semantic_type))) {
    shortcuts.push('geocode');
  }

  return shortcuts;
}

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
  validateThenSetRowIdentifier,
  unSetRowIdentifier,
  moveLeft,
  moveRight,
  showShortcut,
  onClickError
}) {
  const inRowErrorMode = displayState.type === DisplayState.ROW_ERRORS;
  const showFlyouts = true;
  const numRowErrors = inputSchema.num_row_errors;
  const canTransform = (
    entities.sources[inputSchema.source_id] &&
    !entities.sources[inputSchema.source_id].failed_at
  );
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {outputColumns.map(column =>
            <ColumnHeader
              key={column.id}
              canTransform={canTransform}
              outputSchema={outputSchema}
              outputColumn={column}
              updateColumnType={updateColumnType}
              activeApiCallInvolvingThis={_.has(apiCallsByColumnId, column.id)}
              addColumn={() => addColumn(outputSchema, column)}
              dropColumn={() => dropColumn(outputSchema, column)}
              showShortcut={showShortcut}
              validateThenSetRowIdentifier={() => validateThenSetRowIdentifier(outputSchema, column)}
              unSetRowIdentifier={() => unSetRowIdentifier(outputSchema)}
              moveLeft={() => moveLeft(outputSchema, column)}
              moveRight={() => moveRight(outputSchema, column)}
              columnCount={outputColumns.length} />
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
              totalRows={inputSchema.total_rows}
              shortcuts={genShortcuts(column)}
              showShortcut={showShortcut}
              flyouts={showFlyouts}
              onClickError={() => onClickError(path, column.transform, displayState)} />
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
  unSetRowIdentifier: PropTypes.func.isRequired,
  moveLeft: PropTypes.func.isRequired,
  moveRight: PropTypes.func.isRequired,
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
  )
};

export default Table;
