import _ from 'lodash';
import { STATUS_UPDATING } from './lib/database/statuses';

// TODO: if perf becomes an issue, use reselect for memoization

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

export function latestOutputSchema(db) {
  return _.maxBy(db.output_schemas, (os) => os.id);
}

export function columnsForOutputSchema(db, outputSchemaId) {
  const schemaColumns = _.filter(db.output_schema_columns, { output_schema_id: outputSchemaId });
  const unsortedColumns = db.output_columns.
    filter(
      (column) => schemaColumns.some(
        (schemaColumn) =>
          column.id === schemaColumn.output_column_id
      )
    ).
    map((outputColumn) => ({
      ...outputColumn,
      transform: _.find(db.transforms, { id: outputColumn.transform_id })
    }));
  return _.sortBy(unsortedColumns, 'position');
}

export function uploadsInProgress(db) {
  return db.uploads.filter((upload) => (
    upload.__status__.type === STATUS_UPDATING
  ));
}

export function currentOutputSchema(db) {
  return _.maxBy(db.output_schemas, 'inserted_at');
}
