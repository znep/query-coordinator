import _ from 'lodash';
import {
  insertFromServer,
  batch
} from './actions/database';
import { addNotification, removeNotificationAfterTimeout } from './actions/notifications';
import { upsertJobNotification } from './lib/notifications';
import { insertAndSubscribeToUpload } from './actions/manageUploads';
import { parseDate } from './lib/parseDate';
import * as ApplyUpdate from './actions/applyUpdate';

export const emptyDB = {
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
  email_interests: {}
};

const millis = 1000;

export function bootstrap(store, initialView, initialUpdate) {
  const operations = [];
  operations.push(insertFromServer('views', {
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
    tags: initialView.tags,
    email: initialView.privateMetadata ? initialView.privateMetadata.email : '',
    attachments: _.get(initialView, 'metadata.attachments', []),
    metadata: initialView.metadata || {}
  }));
  operations.push(insertFromServer('updates', {
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
    operations.push(insertFromServer('upsert_jobs', {
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
  // notifications
  initialUpdate.upsert_jobs.forEach((upsertJob) => {
    const notification = upsertJobNotification(upsertJob.id);
    store.dispatch(addNotification(notification));
    if (upsertJob.status === ApplyUpdate.UPSERT_JOB_SUCCESSFUL) {
      store.dispatch(removeNotificationAfterTimeout(notification));
    }
  });
}