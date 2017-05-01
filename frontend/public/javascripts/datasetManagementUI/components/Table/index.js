import React, { PropTypes } from 'react';
import ColumnHeader from './ColumnHeader';
import TransformStatus from './TransformStatus';
import TableBody from './TableBody';
import RowErrorsLink from './RowErrorsLink';
import * as DisplayState from '../../lib/displayState';
import styles from 'styles/Table/Table.scss';
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

function mapStateToProps({ db }, ownProps) {

  const { input_columns: inputCols } = db;

  // get all input column ids
  const outputColumns = _.chain(Object.keys(inputCols))
    .map(icid => {
      // get ids of all transforms that were run on this input column
      const matchingTransformIds = Object.keys(db.transforms).filter(tid => {
        return db.transforms[tid].transform_input_columns
          .filter(tic => tic.input_column_id === _.toNumber(icid)).length;
      });

      // of those ids, return the highest (i.e., the most recent)
      return Math.max(...matchingTransformIds);
    })
    .flatMap(tid => {
      // get ids of ouput_columns that resulted from this transform
      return Object.keys(db.output_columns)
        .filter(ocid => db.output_columns[ocid].transform_id === tid);
    })
    .map(_.toNumber)
    .reduce((acc, ocid) => {
      // assume most rencently created output schema is the current output schema
      const latestOutputSchemaId = Math.max(...Object.keys(db.output_schemas).map(_.toNumber));

      // get array of ids of all output columns in current output schema
      const currentOutputColumnIds = _.chain(db.output_schema_columns)
        .filter(osc => osc.output_schema_id === latestOutputSchemaId)
        .reduce((innerAcc, osc) => {
          return [...innerAcc, osc.output_column_id];
        }, [])
        .value();

      // sort output column ids based on whether they are in the current output schema or not
      if (currentOutputColumnIds.includes(ocid)) {
        return {
          ...acc,
          current: [...acc.current, ocid]
        };
      } else {
        return {
          ...acc,
          ignored: [...acc.ignored, ocid]
        };
      }
    }, { current: [], ignored: [] })
    .thru(val => {
      // map ocids to actual oc objects
      return {
        current: val.current.map(ocid => db.output_columns[ocid]),
        ignored: val.ignored.map(ocid => ({
          ...db.output_columns[ocid],
          ignored: true
        }))
      };
    })
    .thru(val => {
      // add transform data
      return {
        current: val.current.map(oc => ({
          ...oc,
          transform: db.transforms[oc.transform_id]
        })),
        ignored: val.ignored.map(oc => ({
          ...oc,
          transform: db.transforms[oc.transform_id]
        }))
      };
    })
    .thru(obj => [...obj.current, ...obj.ignored])
    .thru(cols => _.sortBy(cols, 'position'))
    .value();

  return {
    ...ownProps,
    outputColumns
  };
}

export default connect(mapStateToProps)(Table);
