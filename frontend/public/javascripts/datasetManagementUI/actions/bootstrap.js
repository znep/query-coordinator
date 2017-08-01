import _ from 'lodash';
import { showModal } from 'actions/modal';
import {
  listenForOutputSchemaSuccess,
  subscribeToOutputSchema,
  subscribeToTransforms,
  insertInputSchema,
  subscribeToRowErrors
} from 'actions/manageUploads';
import { addNotification } from 'actions/notifications';
import { parseDate } from 'lib/parseDate';
import * as ApplyRevision from 'actions/applyRevision';
import { makeFieldsets, validateDatasetForm } from 'models/forms';

export const BOOTSTRAP_APP_SUCCESS = 'BOOTSTRAP_APP_SUCCESS';

export function bootstrapApp(view, revision, customMetadataFieldsets) {
  return dispatch => {
    // TODO: maybe wrap in try/catch and create bootstrap failure case?
    const millis = 1000;

    const initialView = {
      id: view.id,
      name: view.name,
      description: view.description,
      category: view.category,
      owner: view.owner,
      lastUpdatedAt: new Date(view.viewLastModified * millis), // TODO: not sure about this one
      dataLastUpdatedAt: new Date(view.rowsUpdatedAt * millis),
      metadataLastUpdatedAt: new Date(view.viewLastModified * millis),
      createdAt: new Date(view.createdAt * millis),
      viewCount: view.viewCount,
      downloadCount: view.downloadCount,
      license: view.license || {},
      licenseId: view.licenseId,
      attribution: view.attribution,
      attributionLink: view.attributionLink,
      tags: view.tags || [],
      privateMetadata: view.privateMetadata || {},
      attachments: _.get(view, 'metadata.attachments', []),
      metadata: view.metadata || {},
      showErrors: false,
      customMetadataFieldsets,
      columnFormDirty: false,
      datasetFormDirty: false
    };

    const initialRevision = {
      id: revision.id,
      fourfour: view.id,
      permission: _.get(revision, 'action.permission', 'public'),
      task_sets: revision.task_sets.map(taskSet => taskSet.id),
      revision_seq: _.toNumber(revision.revision_seq),
      output_schema_id: revision.output_schema_id,
      created_at: parseDate(revision.created_at),
      created_by: revision.created_by
    };

    const taskSets = revision.task_sets.reduce(
      (acc, taskSet) => ({
        ...acc,
        [taskSet.id]: {
          ...taskSet,
          created_at: parseDate(taskSet.created_at),
          finished_at: taskSet.finished_at ? parseDate(taskSet.finished_at) : null,
          created_by: taskSet.created_by
        }
      }),
      {}
    );

    const sources = revision.sources.map(source => source.resource).reduce(
      (acc, source) => ({
        ...acc,
        [source.id]: {
          ..._.omit(source, ['schemas']),
          created_at: parseDate(source.created_at),
          finished_at: source.finished_at ? parseDate(source.finished_at) : null,
          failed_at: source.failed_at ? parseDate(source.failed_at) : null,
          created_by: source.created_by
        }
      }),
      {}
    );

    const { regular, custom } = makeFieldsets(initialView);

    const errors = validateDatasetForm(regular, custom).matchWith({
      Success: () => [],
      Failure: ({ value }) => value
    });

    const intialViewWithErrors = {
      ...initialView,
      datasetMetadataErrors: errors,
      columnMetadataErrors: []
    };

    dispatch(bootstrapAppSuccess(intialViewWithErrors, initialRevision, taskSets, sources));
    dispatch(sideEffectyStuff(revision));
  };
}

function bootstrapAppSuccess(initialView, initialRevision, taskSets, sources) {
  return {
    type: BOOTSTRAP_APP_SUCCESS,
    initialView,
    initialRevision,
    taskSets,
    sources
  };
}

function sideEffectyStuff(revision) {
  return dispatch => {
    // partition failed and successful sources (ie uploads) since we only want
    // to insert into store and subscribe to row errors if it succeeded
    const [failed, succeeded] = _.partition(revision.sources, source => source.failed_at);

    failed.forEach(source => dispatch(addNotification('source', null, source.id)));

    const inputSchemas = _.flatMap(succeeded, source =>
      source.resource.schemas.map(schema => ({
        ...schema,
        source_id: source.resource.id
      }))
    );

    const outputSchemas = _.flatMap(inputSchemas, is => is.output_schemas);

    inputSchemas.forEach(is => {
      dispatch(insertInputSchema(is, is.source_id));
      dispatch(subscribeToRowErrors(is));
    });

    outputSchemas.forEach(os => dispatch(listenForOutputSchemaSuccess(os)));

    // TODO: Once we swap out the view logic that uses client-supplied attributes
    // (contiguous_rows_processed, num_transform_errors) and make it use server-side
    // attributes (completed_at on the os), than add this line here: .filter(os => os.completed_at === null)
    outputSchemas.forEach(os => {
      dispatch(subscribeToOutputSchema(os));
      dispatch(subscribeToTransforms(os));
    });

    revision.task_sets.forEach(taskSet => {
      if (
        taskSet.status !== ApplyRevision.TASK_SET_SUCCESS &&
        taskSet.status !== ApplyRevision.TASK_SET_FAILURE
      ) {
        dispatch(ApplyRevision.pollForTaskSetProgress(taskSet.id));
      }
    });

    if (revision.task_sets.length) {
      dispatch(showModal('Publishing'));
    }
  };
}
