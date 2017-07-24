import _ from 'lodash';
import { showModal } from 'actions/modal';
import {
  pollForOutputSchemaSuccess,
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

    const sources = revision.sources.reduce(
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
    // dispatch(sideEffectyStuff(revision));
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
    revision.sources.forEach(source => {
      _.each(_.flatMap(source.schemas, is => is.output_schemas), os => {
        dispatch(pollForOutputSchemaSuccess(os));
        dispatch(subscribeToOutputSchema(os));
        dispatch(subscribeToTransforms(os));
      });

      if (source.failed_at) {
        dispatch(addNotification('source', null, source.id));
      } else {
        dispatch(insertInputSchema(source));
        source.schemas.forEach(schema => dispatch(subscribeToRowErrors(schema.id)));
      }
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
