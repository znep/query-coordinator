import _ from 'lodash';
import { STATUS_UPDATING, STATUS_LOAD_IN_PROGRESS } from './lib/database/statuses';

// TODO: if perf becomes an issue, use reselect for memoization

export function rowsUpserted(db, upsertJobId) {
  const upsertJob = db.upsert_jobs[upsertJobId];
  if (!upsertJob || !upsertJob.log) {
    return 0;
  }
  const rowItems = upsertJob.log.
    filter((logItem) => logItem.stage === 'rows_upserted').
    map((logItem) => logItem.details.count);
  return _.max(rowItems) || 0;
}

export function latestOutputSchema(db) {
  return _.maxBy(_.values(db.output_schemas), 'id');
}

export function columnsForInputSchema(db, inputSchemaId) {
  const unsortedColumns = _.filter(
    db.input_columns,
    (ic) => ic.input_schema_id === inputSchemaId
  );
  return _.sortBy(unsortedColumns, 'position');
}

export function columnsForOutputSchema(db, outputSchemaId) {
  const schemaColumns = _.filter(db.output_schema_columns, { output_schema_id: outputSchemaId });
  const unsortedColumns = _.chain(db.output_columns).
    filter((column) =>
      schemaColumns.some(
        (schemaColumn) => (
          column.id === schemaColumn.output_column_id
        )
      )
    ).
    map((outputColumn) => ({
      ...outputColumn,
      transform: db.transforms[outputColumn.transform_id]
    })).
    value();
  return _.sortBy(unsortedColumns, 'position');
}

export function uploadsInProgress(db) {
  return _.filter(db.uploads, (upload) => (
    upload.__status__.type === STATUS_UPDATING
  ));
}

export function rowsTransformed(outputColumns) {
  return _.min(
    outputColumns.map((col) => col.transform.contiguous_rows_processed)
  ) || 0;
}

export function pathForOutputSchema(db, outputSchemaId) {
  const outputSchema = db.output_schemas[outputSchemaId];
  const inputSchema = db.input_schemas[outputSchema.input_schema_id];
  const upload = db.uploads[inputSchema.upload_id];
  return {
    outputSchema,
    inputSchema,
    upload
  };
}

export function numLoadsInProgress(db) {
  return _.filter(
    db.__loads__,
    (load) => (load.status.type === STATUS_LOAD_IN_PROGRESS)
  ).length;
}

// Merges formDataModel with db.output_columns, then transforms that into the
// shape expected by DSMAPI
export function updatedOutputColumns(db, formDataModel) {
  const { output_columns: outputColumns, transforms } = db;

  const updatedColumns = Object.keys(formDataModel).reduce((acc, key) => {
    const [id, ...rest] = key.split('-').reverse();

    const fieldName = rest.reverse().join('_');

    if (acc[id]) {
      acc[id][fieldName] = formDataModel[key];
    } else {
      acc[id] = {
        [fieldName]: formDataModel[key],
        position: outputColumns[id].position,
        transform: {
          transform_expr: transforms[outputColumns[id].transform_id].transform_expr
        }
      };
    }

    return acc;
  }, {});

  const unsortedColumns = Object.keys(updatedColumns).map(id => updatedColumns[id]);

  return _.sortBy(unsortedColumns, 'position');
}
