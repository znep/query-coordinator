import _ from 'lodash';
import { STATUS_CALL_IN_PROGRESS } from 'lib/apiCallStatus';
import { LOAD_ROWS } from 'actions/apiCalls';
import { CREATE_UPLOAD } from 'actions/manageUploads';

export function rowsToBeImported(entities, outputSchemaId) {
  const outputSchema = entities.output_schemas[outputSchemaId];
  const inputSchema = entities.input_schemas[outputSchema.input_schema_id];
  const errorRows = outputSchema.error_count || 0;

  return Math.max(0, inputSchema.total_rows - errorRows);
}

export function rowsUpserted(entities, taskSetId) {
  const taskSet = entities.task_sets[taskSetId];
  if (!taskSet || !taskSet.log) {
    return 0;
  }
  // TODO: upate status here to reflect new DSMAPI changes
  const rowItems = taskSet.log
    .filter(logItem => logItem.stage === 'rows_upserted')
    .map(logItem => logItem.details.count);
  return _.max(rowItems) || 0;
}

export function latestOutputSchema(entities) {
  return _.maxBy(_.values(entities.output_schemas), 'id');
}

export function latestRevision(entities) {
  return _.maxBy(_.values(entities.revisions), 'id');
}

export function latestSource(entities) {
  return _.maxBy(_.values(entities.sources), 'id');
}

export function columnsForInputSchema(entities, inputSchemaId) {
  const unsortedColumns = _.filter(entities.input_columns, ic => ic.input_schema_id === inputSchemaId);
  return _.sortBy(unsortedColumns, 'position');
}

export function columnsForOutputSchema(entities, outputSchemaId) {
  return _.chain(entities.output_schema_columns)
    .filter({ output_schema_id: outputSchemaId })
    .map(outputSchemaColumn => {
      const outputColumn = entities.output_columns[outputSchemaColumn.output_column_id];
      return {
        ...outputColumn,
        transform: entities.transforms[outputColumn.transform_id],
        is_primary_key: outputSchemaColumn.is_primary_key || false
      };
    })
    .sortBy('position')
    .value();
}

export function treeForOutputSchema(entities, outputSchemaId) {
  const outputSchema = entities.output_schemas[outputSchemaId];
  const inputSchema = entities.input_schemas[outputSchema.input_schema_id];
  const source = entities.sources[inputSchema.source_id];
  return {
    outputSchema,
    inputSchema,
    source
  };
}

export function allTransformsDone(columnsWithTransforms, inputSchema) {
  return columnsWithTransforms.every(
    column =>
      !_.isUndefined(column.transform.contiguous_rows_processed) &&
      column.transform.contiguous_rows_processed === inputSchema.total_rows
  );
}

export function sourcesInProgress(apiCalls) {
  return _.filter(
    apiCalls,
    apiCall => apiCall.status === STATUS_CALL_IN_PROGRESS && apiCall.operation === CREATE_UPLOAD
  );
}

export function rowsTransformed(outputColumns) {
  return _.min(outputColumns.map(col => col.transform.contiguous_rows_processed || 0)) || 0;
}

export function pathForOutputSchema(entities, outputSchemaId) {
  const outputSchema = entities.output_schemas[outputSchemaId];
  const inputSchema = entities.input_schemas[outputSchema.input_schema_id];
  const source = entities.sources[inputSchema.source_id];
  return {
    outputSchema,
    inputSchema,
    source
  };
}

export function rowLoadOperationsInProgress(apiCalls) {
  return _.filter(apiCalls, call => call.operation === LOAD_ROWS && call.status === STATUS_CALL_IN_PROGRESS)
    .length;
}

// so we would store this as a boolean property of output columns, but turns out
// this would require a lot of DSMAPI changes (probably more code than here, amazingly), in:
// - computation of denormalized error count for output schema
// - starting new transforms when a new output schema is created
// - endpoints which return results
export function currentAndIgnoredOutputColumns(entities, osid) {
  const osIds = Object.keys(entities.output_schemas).map(_.toNumber);

  const latestOutputSchemaId = osid || Math.max(...osIds);

  const outputSchema = entities.output_schemas[latestOutputSchemaId];

  const actualColumns = columnsForOutputSchema(entities, latestOutputSchemaId);

  const referencedInputColumns = _.flatMap(
    actualColumns, oc => oc.transform.transform_input_columns.map(tic => tic.input_column_id)
  );

  const unreferencedInputColumns = Object.values(entities.input_columns)
    .filter(ic => ic.input_schema_id === outputSchema.input_schema_id)
    .filter(ic => referencedInputColumns.indexOf(ic.id) === -1);

  const ocSortedByNewest = _.chain(entities.output_schemas)
    .sortBy([(oc) => -oc.id])
    .flatMap(os => columnsForOutputSchema(entities, os.id))
    .value();

  const unreferencedOutputColumns = _.flatMap(unreferencedInputColumns, ic => {
    const outCol = _.find(ocSortedByNewest, (oc) => {
      if (oc.transform &&
        oc.transform.transform_input_columns &&
        oc.transform.transform_input_columns.length === 1) {
        return oc.transform.transform_input_columns[0].input_column_id === ic.id;
      }
      return false;
    });
    return outCol ? [outCol] : [];
  });

  return {
    current: actualColumns,
    ignored: unreferencedOutputColumns.map(oc => ({ ...oc, ignored: true }))
  };
}

// DATASET METADATA
const filterUndefineds = val => val === undefined;
const convertToNull = val => (val === '' ? null : val);

const regularPublic = view =>
  _.chain(view)
    .pick(['id', 'name', 'description', 'category', 'licenseId', 'attribution', 'attributionLink', 'tags'])
    .omitBy(filterUndefineds)
    .mapValues(convertToNull)
    .value();

const regularPrivate = view =>
  _.chain(view)
    .get('privateMetadata')
    .omit('custom_fields')
    .omitBy(filterUndefineds)
    .mapValues(convertToNull)
    .value();

const customPublic = view =>
  _.chain(view).get('metadata.custom_fields', {}).omitBy(filterUndefineds).mapValues(convertToNull).value();

const customPrivate = view =>
  _.chain(view)
    .get('privateMetadata.custom_fields', {})
    .omitBy(filterUndefineds)
    .mapValues(convertToNull)
    .value();

export const datasetMetadata = view => {
  const publicMetadata = regularPublic(view);
  const privateMetadata = regularPrivate(view);
  const customMetadata = customPublic(view);
  const privateCustomMetadata = customPrivate(view);

  return {
    ...publicMetadata,
    privateMetadata: {
      ...privateMetadata,
      custom_fields: privateCustomMetadata
    },
    metadata: {
      custom_fields: customMetadata
    }
  };
};
