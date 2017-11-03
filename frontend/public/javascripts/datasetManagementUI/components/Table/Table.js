import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import ColumnHeader from 'containers/ColumnHeaderContainer';
import TransformStatus from 'components/TransformStatus/TransformStatus';
import TableBody from 'containers/TableBodyContainer';
import * as DisplayState from 'lib/displayState';
import RowErrorsLink from 'components/RowErrorsLink/RowErrorsLink';
import styles from './Table.scss';
import { CSSTransition } from 'react-transition-group';

export const FadeOut = ({ children, ...props }) => (
  <CSSTransition
    {...props}
    timeout={500}
    appear
    classNames={{
      exit: styles.fadeExit,
      exitActive: styles.fadeExitActive
    }}>
    {children}
  </CSSTransition>
);

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
  showShortcut,
  onClickError
}) {
  const inRowErrorMode = displayState.type === DisplayState.ROW_ERRORS;
  const showFlyouts = true;
  const numRowErrors = inputSchema.num_row_errors;
  const canTransform =
    entities.sources[inputSchema.source_id] && !entities.sources[inputSchema.source_id].failed_at;

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {outputColumns.map(column => (
            <FadeOut key={column.id}>
              <ColumnHeader
                key={column.id}
                canTransform={canTransform}
                outputSchema={outputSchema}
                outputColumn={column}
                columnCount={outputColumns.length} />
            </FadeOut>
          ))}
        </tr>
        <tr className={styles.columnStatuses}>
          {outputColumns.map(column => (
            <FadeOut key={column.id}>
              <TransformStatus
                key={column.id}
                path={path}
                transform={column.transform}
                displayState={displayState}
                columnId={column.id}
                totalRows={inputSchema.total_rows}
                shortcuts={genShortcuts(column)}
                showShortcut={showShortcut}
                flyouts={showFlyouts}
                onClickError={() => onClickError(path, column.transform, displayState)} />
            </FadeOut>
          ))}
        </tr>
        {numRowErrors > 0 && (
          <RowErrorsLink
            path={path}
            displayState={displayState}
            numRowErrors={numRowErrors}
            inRowErrorMode={inRowErrorMode} />
        )}
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
  displayState: PropTypes.object.isRequired,
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
