import _ from 'lodash';
import { STATUS_CALL_IN_PROGRESS } from 'lib/apiCallStatus';
import { LOAD_ROWS } from 'reduxStuff/actions/apiCalls';
import { CREATE_SOURCE } from 'reduxStuff/actions/createSource';
import { stripToTextAst, stripToNumberAst, stripToBooleanAst, stripToDatetimeAst } from 'lib/ast';

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
  // TODO: update status here to reflect new DSMAPI changes
  const rowItems = taskSet.log
    .filter(logItem => logItem.stage === 'rows_upserted')
    .map(logItem => logItem.details.count);
  return _.max(rowItems) || 0;
}

export function currentRevision(entities, revisionSeq) {
  return _.values(entities.revisions).find(rev => rev.revision_seq === revisionSeq);
}

export function currentOutputSchema(entities, revisionSeq) {
  const revision = currentRevision(entities, revisionSeq);
  return entities.output_schemas[revision.output_schema_id];
}

export function currentBlobSource(entities, revisionSeq) {
  const revision = currentRevision(entities, revisionSeq);
  return entities.sources[revision.blob_id];
}

// TODO: prob do some backend work to put sourceId on the revision
// need to discuss when we link the two (e.g. on upload vs on save)
export function currentSource(entities, revisionSeq) {
  const blobSource = currentBlobSource(entities, revisionSeq);
  if (blobSource) {
    return blobSource;
  } else {
    const os = currentOutputSchema(entities, revisionSeq);
    const is = os ? entities.input_schemas[os.input_schema_id] : null;
    return is ? entities.sources[is.source_id] : null;
  }
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

export function allTransformsDone(columnsWithTransforms = []) {
  return columnsWithTransforms
    .map(col => !!col.transform.finished_at)
    .reduce((acc, bool) => acc && bool, true);
}

export function sourcesInProgress(apiCalls) {
  return _.filter(
    apiCalls,
    apiCall => apiCall.status === STATUS_CALL_IN_PROGRESS && apiCall.operation === CREATE_SOURCE
  );
}

export function totalRows(entities, revisionSequence) {
  if (!entities || revisionSequence == null) {
    return 0;
  }

  const revSeq = _.toNumber(revisionSequence);

  const rev = _.find(entities.revisions, r => r.revision_seq === revSeq);

  const os = rev && rev.output_schema_id ? entities.output_schemas[rev.output_schema_id] : null;

  const is = os && os.input_schema_id ? entities.input_schemas[os.input_schema_id] : null;

  const rows = is ? is.total_rows : null;

  return rows || 0;
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

export function sourceFromInputSchema(entities, inputSchemaId) {
  const inputSchema = entities.input_schemas[inputSchemaId];
  return entities.sources[inputSchema.source_id];
}

export function rowLoadOperationsInProgress(apiCalls) {
  return _.filter(apiCalls, call => call.operation === LOAD_ROWS && call.status === STATUS_CALL_IN_PROGRESS)
    .length;
}

// hooray this thing is still wrong, and will always be wrong - each time we add a new
// feature we get to re-write it to make it right for our specific use case
export function currentAndIgnoredOutputColumns(entities, outputSchemaId) {
  const outputSchema = entities.output_schemas[outputSchemaId];
  const osIds = Object.values(entities.output_schemas)
    .filter(os => os.input_schema_id === outputSchema.input_schema_id)
    .map(os => os.id);

  const firstOutputSchemaId = Math.min(...osIds);

  const actualColumns = columnsForOutputSchema(entities, outputSchemaId);
  const firstColumns = columnsForOutputSchema(entities, firstOutputSchemaId);

  const outputColumnsStrippedAsts = _.flatMap(actualColumns, oc => {
    const ast = oc.transform.parsed_expr;
    return _.uniqWith(
      [ast, stripToTextAst(ast), stripToNumberAst(ast), stripToBooleanAst(ast), stripToDatetimeAst(ast)],
      _.isEqual
    );
  });

  const isAstUsed = ast => !!_.find(outputColumnsStrippedAsts, a => _.isEqual(a, ast));

  const isUnreferenced = outputColumn => {
    const ast = outputColumn.transform.parsed_expr;
    return (
      !isAstUsed(ast) &&
      !isAstUsed(stripToTextAst(ast)) &&
      !isAstUsed(stripToNumberAst(ast)) &&
      !isAstUsed(stripToBooleanAst(ast)) &&
      !isAstUsed(stripToDatetimeAst(ast))
    );
  };

  const unreferencedOutputColumns = firstColumns.filter(isUnreferenced);

  return {
    current: actualColumns,
    ignored: unreferencedOutputColumns.map(oc => ({ ...oc, ignored: true }))
  };
}

export const inputSchemas = (entities, sourceId) => {
  return _.filter(entities.input_schemas, { source_id: sourceId });
};

export const latestOutputSchemaForSource = (entities, sourceId) => {
  const inputSchema = _.filter(entities.input_schemas, { source_id: sourceId })[0];

  if (!inputSchema) {
    return null; // an input schema has not yet been parsed out of this upload
  }

  const outputSchemas = _.filter(entities.output_schemas, { input_schema_id: inputSchema.id });

  return _.maxBy(_.values(outputSchemas), 'id');
};

// DATASET METADATA
// The purpose of these selectors is to reshape the revision.metadata structure
// that exists in the store into the shape expected by core. Used in the
// saveDatasetMetadata thunk in manageMetadata.js
const filterUndefineds = val => val === undefined;
const convertToNull = val => (val === '' ? null : val);

const regularPublic = metadata =>
  _.chain(metadata)
    .pick([
      'id',
      'name',
      'description',
      'category',
      'licenseId',
      'license',
      'attribution',
      'attributionLink',
      'tags',
      'attachments'
    ])
    .omitBy(filterUndefineds)
    .mapValues(convertToNull)
    .value();

const regularPrivate = metadata =>
  _.chain(metadata)
    .get('privateMetadata')
    .omit('custom_fields')
    .omitBy(filterUndefineds)
    .mapValues(convertToNull)
    .value();

const customPublic = metadata =>
  _.chain(metadata)
    .get('metadata.custom_fields', {})
    .omitBy(filterUndefineds)
    .mapValues(convertToNull)
    .value();

const customPrivate = metadata =>
  _.chain(metadata)
    .get('privateMetadata.custom_fields', {})
    .omitBy(filterUndefineds)
    .mapValues(convertToNull)
    .value();

export const datasetMetadata = metadata => {
  const publicMetadata = regularPublic(metadata);
  const privateMetadata = regularPrivate(metadata);
  const customMetadata = customPublic(metadata);
  const privateCustomMetadata = customPrivate(metadata);

  return {
    ...publicMetadata,
    privateMetadata: {
      ...privateMetadata,
      custom_fields: privateCustomMetadata
    },
    metadata: {
      ...metadata.metadata,
      custom_fields: customMetadata
    }
  };
};
