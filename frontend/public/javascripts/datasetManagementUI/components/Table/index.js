import React, { PropTypes } from 'react';
import ColumnHeader from './ColumnHeader';
import TransformStatus from './TransformStatus';
import TableBody from './TableBody';
import RowErrorsLink from './RowErrorsLink';
import * as DisplayState from '../../lib/displayState';
import styles from 'styles/Table/Table.scss';
import * as Selectors from '../../selectors';
import { connect } from 'react-redux';

function isDisabled(column) {
  return !column.transform;
}

function Table({
  db,
  path,
  inputSchema,
  outputSchema,
  columns,
  disabledInputColumns,
  displayState,
  updateColumnType,
  addColumn,
  dropColumn }) {

  const visibleColumns = _.sortBy(_.concat(disabledInputColumns, columns), 'position');
  const inRowErrorMode = displayState.type === DisplayState.ROW_ERRORS;
  const numRowErrors = inputSchema.num_row_errors;
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {visibleColumns.map(column =>
            <ColumnHeader
              key={column.id}
              outputSchema={outputSchema}
              isDisabled={isDisabled(column)}
              column={column}
              updateColumnType={updateColumnType}
              addColumn={addColumn}
              dropColumn={dropColumn} />
          )}
        </tr>
        <tr className={styles.columnStatuses}>
          {visibleColumns.map(column =>
            <TransformStatus
              key={column.id}
              path={path}
              transform={column.transform}
              isDisabled={isDisabled(column)}
              displayState={displayState}
              columnId={column.id}
              totalRows={inputSchema.total_rows} />
          )}
        </tr>
        {(numRowErrors > 0) &&
          <RowErrorsLink
            path={path}
            displayState={displayState}
            numRowErrors={numRowErrors}
            inRowErrorMode={inRowErrorMode} />}
      </thead>
      <TableBody
        db={db}
        columns={visibleColumns}
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
  disabledInputColumns: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateColumnType: PropTypes.func.isRequired,
  addColumn: PropTypes.func.isRequired,
  dropColumn: PropTypes.func.isRequired,
  displayState: PropTypes.object.isRequired
};

function mapStateToProps(state, ownProps) {
  const { db, outputSchema, columns: outputColumns } = ownProps;
  const inputColumns = Selectors.columnsForInputSchema(db, outputSchema.input_schema_id);

  const referencedInputColumnIds = _.uniq(_.flatMap(outputColumns, ({ transform_id }) => {
    return db.transforms[transform_id].transform_input_columns.map((tic) => tic.input_column_id);
  }));
  const disabledInputColumns = inputColumns.filter((ic) => !referencedInputColumnIds.includes(ic.id));

  return {
    ...ownProps,
    disabledInputColumns
  };
}

export default connect(mapStateToProps)(Table);
