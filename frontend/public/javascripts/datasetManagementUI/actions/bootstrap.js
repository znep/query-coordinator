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
import { shapeCustomFieldsets } from 'lib/customMetadata';
import * as ApplyRevision from 'actions/applyRevision';
// import { createCombinedValidationRules, createInitialModel } from 'components/ManageMetadata/DatasetForm';
// import { getValidationErrors } from 'components/Forms/validateSchema';

export const BOOTSTRAP_APP_SUCCESS = 'BOOTSTRAP_APP_SUCCESS';

// const calculateInitialSchema = (view, customMetadata) => {
//   const validations = createCombinedValidationRules(customMetadata);
//
//   const model = createInitialModel(view);
//
//   return getValidationErrors(validations, model);
// };

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
      schema: {},
      tags: view.tags || [],
      privateMetadata: view.privateMetadata || {},
      attachments: _.get(view, 'metadata.attachments', []),
      metadata: view.metadata || {},
      customDatasetMetadata: shapeCustomFieldsets(customMetadataFieldsets)
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

    const uploads = revision.uploads.reduce(
      (acc, upload) => ({
        ...acc,
        [upload.id]: {
          ..._.omit(upload, ['schemas']),
          created_at: parseDate(upload.created_at),
          finished_at: upload.finished_at ? parseDate(upload.finished_at) : null,
          failed_at: upload.failed_at ? parseDate(upload.failed_at) : null,
          created_by: upload.created_by
        }
      }),
      {}
    );

    dispatch(bootstrapAppSuccess(initialView, initialRevision, taskSets, uploads));
    dispatch(sideEffectyStuff(revision));
  };
}

function bootstrapAppSuccess(initialView, initialRevision, taskSets, uploads) {
  return {
    type: BOOTSTRAP_APP_SUCCESS,
    initialView,
    initialRevision,
    taskSets,
    uploads
  };
}

function sideEffectyStuff(revision) {
  return dispatch => {
    revision.uploads.forEach(upload => {
      _.each(_.flatMap(upload.schemas, is => is.output_schemas), os => {
        dispatch(pollForOutputSchemaSuccess(os));
        dispatch(subscribeToOutputSchema(os));
        dispatch(subscribeToTransforms(os));
      });

      if (upload.failed_at) {
        dispatch(addNotification('upload', null, upload.id));
      } else {
        dispatch(insertInputSchema(upload));
        upload.schemas.forEach(schema => dispatch(subscribeToRowErrors(schema.id)));
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
