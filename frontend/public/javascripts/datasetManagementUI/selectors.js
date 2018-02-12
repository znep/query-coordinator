import _ from 'lodash';
import { STATUS_CALL_IN_PROGRESS } from 'datasetManagementUI/lib/apiCallStatus';
import { LOAD_ROWS } from 'datasetManagementUI/reduxStuff/actions/apiCalls';
import { CREATE_SOURCE } from 'datasetManagementUI/reduxStuff/actions/createSource';
import { PAGE_SIZE } from 'datasetManagementUI/reduxStuff/actions/loadData';
import * as DisplayState from 'datasetManagementUI/lib/displayState';

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
  return _.values(entities.revisions).find(
    rev => rev.revision_seq === revisionSeq
  );
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
  const unsortedColumns = _.filter(
    entities.input_columns,
    ic => ic.input_schema_id === inputSchemaId
  );
  return _.sortBy(unsortedColumns, 'position');
}

export function columnsForOutputSchema(entities, outputSchemaId) {
  return _.chain(entities.output_schema_columns)
    .filter({ output_schema_id: outputSchemaId })
    .map(outputSchemaColumn => {
      const outputColumn =
        entities.output_columns[outputSchemaColumn.output_column_id];
      return {
        ...outputColumn,
        transform: entities.transforms[outputColumn.transform_id],
        is_primary_key: outputSchemaColumn.is_primary_key || false
      };
    })
    .sortBy('position')
    .value();
}

export function outputColumnsForInputSchemaUniqByTransform(
  entities,
  inputSchemaId
) {
  const outputSchemaIds = _.filter(entities.output_schemas, {
    input_schema_id: inputSchemaId
  }).map(os => os.id);

  return _.chain(entities.output_schema_columns)
    .filter(osc => _.includes(outputSchemaIds, osc.output_schema_id))
    .map(outputSchemaColumn => {
      const outputColumn =
        entities.output_columns[outputSchemaColumn.output_column_id];
      return {
        ...outputColumn,
        transform: entities.transforms[outputColumn.transform_id],
        is_primary_key: outputSchemaColumn.is_primary_key || false
      };
    })
    .uniqBy(oc => oc.transform.id)
    .sortBy('position')
    .value();
}

export function getRowData(
  entities,
  inputSchemaId,
  displayState,
  outputColumns
) {
  const startRow = (displayState.pageNo - 1) * PAGE_SIZE;
  const endRow = startRow + PAGE_SIZE;
  // A somewhat ambiguous term. The TableBody component (used on the data preview
  // page) expects rows as an array of objects, with each object corresponding
  // to a row. `rowIndicies` therefore is an array of index numbers that is used
  // to create the array of row-objects. Below, an array like [0, 1, 2, 3...] is
  // created, then mapped over to make the array of row-objects. If the user changes
  // the table to display page 2, then the generated index array looks like
  // [50, 51, 52...]. The point is that a rowIndex is really just a DSMUI concept
  // used to load and display data on the table preview page. It does not strictly
  // relate to the row number in the original tabular source file.
  let rowIndices;

  if (displayState.type === DisplayState.COLUMN_ERRORS) {
    const errorsTransform = entities.transforms[displayState.transformId];
    if (errorsTransform.error_indices) {
      rowIndices = errorsTransform.error_indices.map(_.toString);
    } else {
      rowIndices = [];
    }
  } else if (displayState.type === DisplayState.ROW_ERRORS) {
    const rowOffsets = _.filter(entities.row_errors, {
      input_schema_id: inputSchemaId
    }).map(rowError => rowError.offset);

    // This ternary is necessary because we load row errors in an inconsistent way:
    // if you upload a file, we have all the row-errors client side, so we need to
    // slice off a chunk of them here (rowOffsets.slice) to display 1 page at a time.
    // However, on a hard-reload of the page, we make an api call with `offset` and
    // `limit` call params, meaning we only load the row errors for the current page.
    // In this case, we don't want to slice off a chunk but instead display all of them.
    rowIndices =
      rowOffsets.length > PAGE_SIZE
        ? rowOffsets.slice(startRow, endRow)
        : rowOffsets;
  } else {
    rowIndices = _.range(startRow, endRow);
  }
  return rowIndices.map(rowIdx => ({
    rowIdx,
    columns: outputColumns.map(column => {
      const transform = column.transform;
      const cell = entities.col_data[transform.id]
        ? entities.col_data[transform.id][rowIdx]
        : null;
      return {
        tid: transform.id,
        id: column.id,
        format: column.format,
        cell
      };
    }),
    rowError: entities.row_errors[`${inputSchemaId}-${rowIdx}`]
  }));
}

export function allColumnsWithOSID(entities) {
  return _.chain(entities.output_schema_columns)
    .map(oc => ({
      ...entities.output_columns[oc.output_column_id],
      outputSchemaId: oc.output_schema_id
    }))
    .map(oc => ({
      ...oc,
      transform: entities.transforms[oc.transform_id],
      is_primary_key: oc.is_primary_key || false
    }))
    .map(oc => _.omit(oc, 'transform_id'))
    .orderBy('outputSchemaId', 'desc')
    .value();
}

export function treeForOutputSchema(entities, outputSchemaId) {
  const outputSchema = entities.output_schemas[outputSchemaId] || {};
  const inputSchema = _.isEmpty(outputSchema)
    ? {}
    : entities.input_schemas[outputSchema.input_schema_id];
  const source = _.isEmpty(inputSchema)
    ? {}
    : entities.sources[inputSchema.source_id];

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
    apiCall =>
      apiCall.status === STATUS_CALL_IN_PROGRESS &&
      apiCall.operation === CREATE_SOURCE
  );
}

export function totalRows(entities, revisionSequence) {
  if (!entities || revisionSequence == null) {
    return 0;
  }

  const revSeq = _.toNumber(revisionSequence);

  const rev = _.find(entities.revisions, r => r.revision_seq === revSeq);

  const os =
    rev && rev.output_schema_id
      ? entities.output_schemas[rev.output_schema_id]
      : null;

  const is =
    os && os.input_schema_id
      ? entities.input_schemas[os.input_schema_id]
      : null;

  const rows = is ? is.total_rows : null;

  return rows || 0;
}

export function rowsTransformed(outputColumns) {
  return (
    _.min(
      outputColumns.map(col => col.transform.contiguous_rows_processed || 0)
    ) || 0
  );
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
  return _.filter(
    apiCalls,
    call =>
      call.operation === LOAD_ROWS && call.status === STATUS_CALL_IN_PROGRESS
  ).length;
}

export const inputSchemas = (entities, sourceId) => {
  return _.filter(entities.input_schemas, { source_id: sourceId });
};

export const latestOutputSchemaForSource = (entities, sourceId) => {
  const inputSchema = _.filter(entities.input_schemas, {
    source_id: sourceId
  })[0];

  if (!inputSchema) {
    return null; // an input schema has not yet been parsed out of this upload
  }

  const outputSchemas = _.filter(entities.output_schemas, {
    input_schema_id: inputSchema.id
  });

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
