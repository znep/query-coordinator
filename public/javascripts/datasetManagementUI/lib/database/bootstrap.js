import {
  insertFromServer,
  batch
} from '../../actions/database';
import { insertAndSubscribeToUpload } from '../../actions/manageUploads';
import { pollForUpsertJobProgress } from '../../actions/applyUpdate';
import { parseDate } from '../../lib/parseDate';

export const emptyDB = {
  views: [],
  updates: [],
  uploads: [],
  input_schemas: [],
  output_schemas: [],
  input_columns: [],
  output_columns: [],
  output_schema_columns: [],
  transforms: [],
  upsert_jobs: []
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
    attribution: initialView.attribution,
    tags: initialView.tags,
    attachments: (initialView.metadata && initialView.metadata.attachments) || []
  }));
  operations.push(insertFromServer('updates', {
    id: initialUpdate.id,
    fourfour: initialView.id,
    update_seq: _.toNumber(initialUpdate.update_seq)
  }));
  initialUpdate.uploads.forEach((upload) => {
    insertAndSubscribeToUpload(store.dispatch, upload);
  });
  initialUpdate.upsert_jobs.forEach((upsertJob) => {
    operations.push(insertFromServer('upsert_jobs', {
      ...upsertJob,
      finished_at: upsertJob.finished_at ? parseDate(upsertJob.finished_at) : null
    }));
    if (!upsertJob.status) { // will be "=== 'in_progress'" when we change the api (EN-13127)
      store.dispatch(pollForUpsertJobProgress(upsertJob.id));
    }
  });
  store.dispatch(batch(operations));
}
