import React, { PropTypes } from 'react';
import ColumnHeader from './ColumnHeader';
import TransformStatus from './TransformStatus';
import TableBody from './TableBody';
import RowErrorsLink from './RowErrorsLink';
import * as DisplayState from '../../lib/displayState';
import styles from 'styles/Table/Table.scss';
import { currentAndIgnoredOutputColumns } from 'selectors';
import { connect } from 'react-redux';

function Table({
  db,
  path,
  inputSchema,
  outputSchema,
  outputColumns,
  displayState,
  updateColumnType,
  addColumn,
  dropColumn }) {

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
              isDisabled={column.ignored}
              column={column}
              updateColumnType={updateColumnType}
              addColumn={addColumn}
              dropColumn={dropColumn} />
          )}
        </tr>
        <tr className={styles.columnStatuses}>
          {outputColumns.map(column =>
            <TransformStatus
              key={column.id}
              path={path}
              transform={column.transform}
              isDisabled={column.ignored}
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
        columns={outputColumns}
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
  updateColumnType: PropTypes.func.isRequired,
  addColumn: PropTypes.func.isRequired,
  dropColumn: PropTypes.func.isRequired,
  displayState: PropTypes.object.isRequired,
  outputColumns: PropTypes.arrayOf(PropTypes.object)
};

// TODO: we currently don't handle the case where currentAndIgnoredOutputColumns
// fails; should probably redirect or display some message to the user
const mapStateToProps = ({ db }, ownProps) => ({
  ...ownProps,
  outputColumns: currentAndIgnoredOutputColumns(db)
});

export default connect(mapStateToProps)(Table);
