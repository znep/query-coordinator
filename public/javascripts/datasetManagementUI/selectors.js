import _ from 'lodash';
import { STATUS_UPDATING } from './lib/database/statuses';

// TODO: if perf becomes an issue, use reselect for memoization

export function rowsTransformed(db, outputSchemaId) {
  const columns = columnsForOutputSchema(db, outputSchemaId);
  const rowsProcessed = columns.map((column) => (
    column.contiguous_rows_processed || 0
  ));
  return _.min(rowsProcessed);
}

export function rowsUpserted(db, upsertJobId) {
  const upsertJob = _.find(db.upsert_jobs, { id: upsertJobId });
  if (!upsertJob || !upsertJob.log) {
    return 0;
  }
  const rowItems = upsertJob.log.
    filter((logItem) => logItem.stage === 'rows_upserted').
    map((logItem) => logItem.details.count);
  return _.max(rowItems) || 0;
}

export function columnsForOutputSchema(db, outputSchemaId) {
  const schemaColumns = _.filter(db.output_schema_columns, { output_schema_id: outputSchemaId });
  const unsortedColumns = _.filter(
    db.columns,
    (column) => schemaColumns.some(
      (schemaColumn) =>
        column.id === schemaColumn.column_id
    )
  );
  return _.sortBy(unsortedColumns, 'schema_column_index');
}

export function uploadsInProgress(db) {
  return db.uploads.filter((upload) => (
    upload.__status__.type === STATUS_UPDATING
  ));
}
