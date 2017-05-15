import _ from 'lodash';
import {
  upsertFromServer,
  batch
} from 'actions/database';
import { setFourfour } from 'actions/routing';
import { showModal } from 'actions/modal';
import { insertAndSubscribeToUpload } from 'actions/manageUploads';
import { parseDate } from 'lib/parseDate';
import * as ApplyRevision from 'actions/applyRevision';
import { createCombinedValidationRules, createInitialModel } from 'components/ManageMetadata/DatasetForm';
import { getValidationErrors } from 'components/Forms/validateSchema';

const calculateInitialSchema = (view, customMetadata) => {
  const validations = createCombinedValidationRules(customMetadata);

  const model = createInitialModel(view);

  return getValidationErrors(validations, model);
};

export const emptyDB = {
  __loads__: {},
  views: {},
  revisions: {},
  uploads: {},
  input_schemas: {},
  output_schemas: {},
  input_columns: {},
  output_columns: {},
  output_schema_columns: {},
  transforms: {},
  upsert_jobs: {},
  email_interests: {},
  row_errors: {}
};

const millis = 1000;

export function bootstrap(store, initialView, initialRevision, customMetadata) {
  const operations = [];
  store.dispatch(setFourfour(initialView.id));
  operations.push(upsertFromServer('views', {
    id: initialView.id,
    name: initialView.name,
    description: initialView.description,
    category: initialView.category,
    owner: initialView.owner,
    lastUpdatedAt: new Date(initialView.viewLastModified * millis), // TODO: not sure about this one
    dataLastUpdatedAt: new Date(initialView.rowsUpdatedAt * millis),
    metadataLastUpdatedAt: new Date(initialView.viewLastModified * millis),
    createdAt: new Date(initialView.createdAt * millis),
    viewCount: initialView.viewCount,
    downloadCount: initialView.downloadCount,
    license: initialView.license || {},
    licenseId: initialView.licenseId,
    attribution: initialView.attribution,
    attributionLink: initialView.attributionLink,
    schema: calculateInitialSchema(initialView, customMetadata),
    tags: initialView.tags || [],
    privateMetadata: initialView.privateMetadata || {},
    attachments: _.get(initialView, 'metadata.attachments', []),
    metadata: initialView.metadata || {},
    customMetadataFields: window.initialState.customMetadata || []
  }));
  operations.push(upsertFromServer('revisions', {
    id: initialRevision.id,
    fourfour: initialView.id,
    revision_seq: _.toNumber(initialRevision.revision_seq),
    inserted_at: parseDate(initialRevision.inserted_at),
    created_by: initialRevision.created_by
  }));
  initialRevision.uploads.forEach((upload) => {
    insertAndSubscribeToUpload(store.dispatch, upload);
  });
  initialRevision.upsert_jobs.forEach((upsertJob) => {
    operations.push(upsertFromServer('upsert_jobs', {
      ...upsertJob,
      inserted_at: parseDate(upsertJob.inserted_at),
      finished_at: upsertJob.finished_at ? parseDate(upsertJob.finished_at) : null,
      created_by: upsertJob.created_by
    }));
    if (upsertJob.status === ApplyRevision.UPSERT_JOB_IN_PROGRESS) {
      store.dispatch(ApplyRevision.pollForUpsertJobProgress(upsertJob.id));
    }
  });
  store.dispatch(batch(operations));

  if (initialRevision.upsert_jobs.length) {
    store.dispatch(showModal('Publishing'));
  }
}
