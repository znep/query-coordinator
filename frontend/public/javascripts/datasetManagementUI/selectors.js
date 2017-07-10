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

export function latestUpload(entities) {
  return _.maxBy(_.values(entities.uploads), 'id');
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

export function allTransformsDone(columnsWithTransforms, inputSchema) {
  return columnsWithTransforms.every(
    column =>
      !_.isUndefined(column.transform.contiguous_rows_processed) &&
      column.transform.contiguous_rows_processed === inputSchema.total_rows
  );
}

export function uploadsInProgress(apiCalls) {
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
  const upload = entities.uploads[inputSchema.upload_id];
  return {
    outputSchema,
    inputSchema,
    upload
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

  // get all input column ids
  return _.chain(entities.input_columns)
    .filter(ic => {
      const isid = entities.output_schemas[latestOutputSchemaId].input_schema_id;
      return ic.input_schema_id === isid;
    })
    .map(ic => ic.id)
    .map(icid => {
      // get ids of all transforms that were run on this input column
      const matchingTransformIds = Object.keys(entities.transforms).filter(tid => {
        return entities.transforms[tid].transform_input_columns.filter(
          tic => tic.input_column_id === _.toNumber(icid)
        ).length;
      });

      // of those ids, return the highest (i.e., the most recent)
      return Math.max(...matchingTransformIds);
    })
    .flatMap(tid => {
      // get ids of ouput_columns that resulted from this transform
      return Object.keys(entities.output_columns)
        .filter(ocid => entities.output_columns[ocid].transform_id === tid)
        .map(_.toNumber);
    })
    .reduce(
      (acc, ocid) => {
        // get array of ids of all output columns in current output schema
        const currentOutputColumnIds = _.chain(entities.output_schema_columns)
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
      },
      { current: [], ignored: [] }
    )
    .thru(val => {
      // map ocids to actual oc objects
      return {
        current: val.current.map(ocid => entities.output_columns[ocid]),
        ignored: val.ignored.map(ocid => ({
          ...entities.output_columns[ocid],
          ignored: true
        }))
      };
    })
    .thru(val => {
      // if there is an output column in val.ignored that has the same transform
      // id as an output column in val.current, that means it is an old copy that
      // contains outdated metadata. We don't want to display this to the user so
      // we filter it out here. The ideal place to have done this is in the flatMap
      // on line 147, but unfortunately entities.output_schema_columns doesn't have the
      // information we need at that point.
      const currentTransforms = val.current.map(oc => oc.transform_id);
      const newIgnored = val.ignored.filter(oc => !currentTransforms.includes(oc.transform_id));

      return {
        ...val,
        ignored: newIgnored
      };
    })
    .thru(val => {
      // if you edit column metadata multiple times, you will have multiple
      // output columns in the store, all sharing the same transform. If you then
      // ignore that column, none of the copies will be in the output schema. Taking
      // the most recent is no good, so we have to crawl the old output schemas til
      // we find a match
      const transformIds = val.ignored.map(oc => oc.transform_id);

      const duplicateOutputColumnIds = val.ignored
        .filter(oc => transformIds.filter(tid => tid === oc.transform_id).length > 1)
        .map(oc => oc.id);

      const sortedIds = [...osIds].sort().reverse();

      function crawlOutputSchemas(arr) {
        if (!arr || !arr.length) {
          return false;
        }
        const [head, ...tail] = arr;
        const currentOutputColumnIds = _.chain(entities.output_schema_columns)
          .filter(osc => osc.output_schema_id === head)
          .reduce((acc, osc) => {
            return [...acc, osc.output_column_id];
          }, [])
          .value();

        const filtered = duplicateOutputColumnIds.filter(ocid => currentOutputColumnIds.includes(ocid));

        if (filtered.length) {
          return filtered[0];
        } else {
          return crawlOutputSchemas(tail);
        }
      }

      const matchingId = crawlOutputSchemas(sortedIds.slice(0, sortedIds.length - 1));

      const toRemove = duplicateOutputColumnIds.filter(ocid => ocid !== matchingId);

      const newIgnored = val.ignored.filter(oc => !toRemove.includes(oc.id));

      return {
        ...val,
        ignored: newIgnored
      };
    })
    .thru(val => {
      // add transform data
      return {
        current: val.current.map(oc => ({
          ...oc,
          transform: entities.transforms[oc.transform_id]
        })),
        ignored: val.ignored.map(oc => ({
          ...oc,
          transform: entities.transforms[oc.transform_id]
        }))
      };
    })
    .value();
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
