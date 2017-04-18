import _ from 'lodash';
import {
  upsertFromServer,
  batch
} from 'actions/database';
import { setFourfour } from 'actions/routing';
import { showModal } from 'actions/modal';
import { addNotification, removeNotificationAfterTimeout } from 'actions/notifications';
import { upsertJobNotification } from 'lib/notifications';
import { insertAndSubscribeToUpload } from 'actions/manageUploads';
import { parseDate } from 'lib/parseDate';
import * as ApplyUpdate from 'actions/applyUpdate';

export const emptyDB = {
  __loads__: {},
  views: {},
  updates: {},
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

export function bootstrap(store, initialView, initialUpdate) {
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
    tags: initialView.tags,
    privateMetadata: initialView.privateMetadata || {},
    attachments: _.get(initialView, 'metadata.attachments', []),
    metadata: initialView.metadata || {},
    customMetadataFields: window.initialState.customMetadata || []
  }));
  operations.push(upsertFromServer('updates', {
    id: initialUpdate.id,
    fourfour: initialView.id,
    revision_seq: _.toNumber(initialUpdate.revision_seq),
    inserted_at: parseDate(initialUpdate.inserted_at),
    created_by: initialUpdate.created_by
  }));
  initialUpdate.uploads.forEach((upload) => {
    insertAndSubscribeToUpload(store.dispatch, upload);
  });
  initialUpdate.upsert_jobs.forEach((upsertJob) => {
    operations.push(upsertFromServer('upsert_jobs', {
      ...upsertJob,
      inserted_at: parseDate(upsertJob.inserted_at),
      finished_at: upsertJob.finished_at ? parseDate(upsertJob.finished_at) : null,
      created_by: upsertJob.created_by
    }));
    if (upsertJob.status === ApplyUpdate.UPSERT_JOB_IN_PROGRESS) {
      store.dispatch(ApplyUpdate.pollForUpsertJobProgress(upsertJob.id));
    }
  });
  store.dispatch(batch(operations));

  if (initialUpdate.upsert_jobs.length) {
    store.dispatch(showModal('Publishing'));
  }

  // notifications
  initialUpdate.upsert_jobs.forEach((upsertJob) => {
    const notification = upsertJobNotification(upsertJob.id);
    store.dispatch(addNotification(notification));
    if (upsertJob.status === ApplyUpdate.UPSERT_JOB_SUCCESSFUL) {
      store.dispatch(removeNotificationAfterTimeout(notification));
    }
  });
}
