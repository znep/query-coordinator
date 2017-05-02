import _ from 'lodash';
import { STATUS_UPDATING, STATUS_LOAD_IN_PROGRESS } from './lib/database/statuses';
import { UPSERT_JOB_SUCCESSFUL } from 'actions/applyUpdate.js';

// TODO: if perf becomes an issue, use reselect for memoization
export function percentUpserted(db, upsertJobId) {
  const upsertJob = db.upsert_jobs[upsertJobId];

  if (upsertJob.status === UPSERT_JOB_SUCCESSFUL) {
    return 100;
  } else {
    return 100 * (rowsUpserted(db, upsertJobId) / rowsToBeImported(db, upsertJob.output_schema_id));
  }
}

export function rowsToBeImported(db, outputSchemaId) {
  const outputSchema = db.output_schemas[outputSchemaId];
  const inputSchema = db.input_schemas[outputSchema.input_schema_id];
  const errorRows = outputSchema.error_count || 0;

  return Math.max(0, inputSchema.total_rows - errorRows);
}

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

export function allTransformsDone(columnsWithTransforms, inputSchema) {
  return columnsWithTransforms.every((column) => (
    column.transform.contiguous_rows_processed &&
      column.transform.contiguous_rows_processed === inputSchema.total_rows
  ));
}

export function uploadsInProgress(db) {
  return _.filter(db.uploads, (upload) => (
    upload.__status__.type === STATUS_UPDATING
  ));
}

export function rowsTransformed(outputColumns) {
  return _.min(
    outputColumns.map((col) => (col.transform.contiguous_rows_processed || 0))
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
        id: _.toNumber(id),
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

export function currentAndIgnoredOutputColumns(db) {

  // get all input column ids
  return _.chain(Object.keys(db.input_columns))
    .map(icid => {
      // get ids of all transforms that were run on this input column
      const matchingTransformIds = Object.keys(db.transforms).filter(tid => {
        return db.transforms[tid].transform_input_columns
          .filter(tic => tic.input_column_id === _.toNumber(icid)).length;
      });

      // of those ids, return the highest (i.e., the most recent)
      return Math.max(...matchingTransformIds);
    })
    .map(tid => {
      // get ids of ouput_columns that resulted from this transform
      const matchingOutputColumnIds = Object.keys(db.output_columns)
        .filter(ocid => db.output_columns[ocid].transform_id === tid)
        .map(_.toNumber);

      if (matchingOutputColumnIds.length > 1) {
        return Math.max(...matchingOutputColumnIds);
      } else {
        return matchingOutputColumnIds[0];
      }
    })
    .reduce((acc, ocid) => {
      // assume most recently created output schema is the current output schema
      // TODO: remove once we get the status out of output schema
      const keys = Object.keys(db.output_schemas)
        .filter(key => key !== '__status__')
        .map(_.toNumber)
        .filter(key => !!key);

      const latestOutputSchemaId = Math.max(...keys);

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
    .value();
}
