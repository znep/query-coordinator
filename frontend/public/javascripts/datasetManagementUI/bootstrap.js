import _ from 'lodash';
import { showModal } from 'actions/modal';
import { insertAndSubscribeToUpload, insertChildrenAndSubscribeToOutputSchema } from 'actions/manageUploads';
import { parseDate } from 'lib/parseDate';
import * as ApplyRevision from 'actions/applyRevision';
import { createCombinedValidationRules, createInitialModel } from 'components/ManageMetadata/DatasetForm';
import { getValidationErrors } from 'components/Forms/validateSchema';

const calculateInitialSchema = (view, customMetadata) => {
  const validations = createCombinedValidationRules(customMetadata);

  const model = createInitialModel(view);

  return getValidationErrors(validations, model);
};

export const bootstrap = (view, revision, customMetadata) => {
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
    schema: calculateInitialSchema(view, customMetadata),
    tags: view.tags || [],
    privateMetadata: view.privateMetadata || {},
    attachments: _.get(view, 'metadata.attachments', []),
    metadata: view.metadata || {},
    customMetadataFields: window.initialState.customMetadata || []
  };

  const initialRevision = {
    id: revision.id,
    fourfour: view.id,
    revision_seq: _.toNumber(revision.revision_seq),
    created_at: parseDate(revision.inserted_at || revision.created_at),
    created_by: revision.created_by
  };

  revision.task_sets = revision.upsert_jobs || revision.task_sets;

  const taskSets = revision.task_sets.reduce(
    (acc, taskSet) => ({
      ...acc,
      [taskSet.id]: {
        ...taskSet,
        created_at: parseDate(taskSet.inserted_at || taskSet.created_at),
        finished_at: taskSet.finished_at ? parseDate(taskSet.finished_at) : null,
        created_by: taskSet.created_by
      }
    }),
    {}
  );

  return {
    type: 'BOOTSTRAP_APP',
    initialView,
    initialRevision,
    taskSets
  };
};

export const sideEffectyStuff = revision => dispatch => {
  revision.uploads.forEach(upload => {
    _.each(_.flatMap(upload.schemas, is => is.output_schemas), os => {
      dispatch(insertChildrenAndSubscribeToOutputSchema(os));
    });

    insertAndSubscribeToUpload(dispatch, upload);
  });

  revision.task_sets = revision.upsert_jobs || revision.task_sets;
  revision.task_sets.forEach(taskSet => {
    if (taskSet.status === ApplyRevision.UPSERT_JOB_IN_PROGRESS) {
      dispatch(ApplyRevision.pollForUpsertJobProgress(taskSet.id));
    }
  });

  if (revision.task_sets.length) {
    dispatch(showModal('Publishing'));
  }
};

// export function bootstrap(store, initialView, initialRevision, customMetadata) {
//   const operations = [];
//   store.dispatch(setFourfour(initialView.id));
//   operations.push(
//     upsertFromServer('views', {
//       id: initialView.id,
//       name: initialView.name,
//       description: initialView.description,
//       category: initialView.category,
//       owner: initialView.owner,
//       lastUpdatedAt: new Date(initialView.viewLastModified * millis), // TODO: not sure about this one
//       dataLastUpdatedAt: new Date(initialView.rowsUpdatedAt * millis),
//       metadataLastUpdatedAt: new Date(initialView.viewLastModified * millis),
//       createdAt: new Date(initialView.createdAt * millis),
//       viewCount: initialView.viewCount,
//       downloadCount: initialView.downloadCount,
//       license: initialView.license || {},
//       licenseId: initialView.licenseId,
//       attribution: initialView.attribution,
//       attributionLink: initialView.attributionLink,
//       schema: calculateInitialSchema(initialView, customMetadata),
//       tags: initialView.tags || [],
//       privateMetadata: initialView.privateMetadata || {},
//       attachments: _.get(initialView, 'metadata.attachments', []),
//       metadata: initialView.metadata || {},
//       customMetadataFields: window.initialState.customMetadata || []
//     })
//   );
//   operations.push(
//     upsertFromServer('revisions', {
//       id: initialRevision.id,
//       fourfour: initialView.id,
//       revision_seq: _.toNumber(initialRevision.revision_seq),
//       created_at: parseDate(initialRevision.inserted_at || initialRevision.created_at),
//       created_by: initialRevision.created_by
//     })
//   );
//
//   initialRevision.uploads.forEach(upload => {
//     _.each(_.flatMap(upload.schemas, is => is.output_schemas), os => {
//       store.dispatch(insertChildrenAndSubscribeToOutputSchema(os));
//     });
//
//     insertAndSubscribeToUpload(store.dispatch, upload);
//   });
//
//   initialRevision.upsert_jobs = initialRevision.upsert_jobs || initialRevision.task_sets; // Name transition
//   initialRevision.upsert_jobs.forEach(upsertJob => {
//     operations.push(
//       upsertFromServer('upsert_jobs', {
//         ...upsertJob,
//         created_at: parseDate(upsertJob.inserted_at || upsertJob.created_at),
//         finished_at: upsertJob.finished_at ? parseDate(upsertJob.finished_at) : null,
//         created_by: upsertJob.created_by
//       })
//     );
//     if (upsertJob.status === ApplyRevision.UPSERT_JOB_IN_PROGRESS) {
//       store.dispatch(ApplyRevision.pollForUpsertJobProgress(upsertJob.id));
//     }
//   });
//   store.dispatch(batch(operations));
//
//   if (initialRevision.upsert_jobs.length) {
//     store.dispatch(showModal('Publishing'));
//   }
// }
