import {
  insertFromServer,
  batch
} from '../../actions/database';
import { insertUploadAndSubscribeToOutput } from '../../actions/manageUploads';
import { pollForUpsertJobProgress } from '../../actions/applyUpdate';

export const emptyDB = {
  views: [],
  updates: [],
  uploads: [],
  schemas: [],
  columns: [],
  schema_columns: [],
  transforms: [],
  upsert_jobs: []
};

export function bootstrap(store, initialView, initialUpdate) {
  const operations = [];
  operations.push(insertFromServer('views', {
    id: initialView.id,
    name: initialView.name,
    description: initialView.description,
    category: initialView.category
  }));
  operations.push(insertFromServer('updates', {
    id: initialUpdate.id,
    fourfour: initialView.id,
    update_seq: _.toNumber(initialUpdate.update_seq)
  }));
  initialUpdate.uploads.forEach((upload) => {
    insertUploadAndSubscribeToOutput(store.dispatch, upload);
  });
  initialUpdate.upsert_jobs.forEach((upsertJob) => {
    operations.push(insertFromServer('upsert_jobs', {
      ...upsertJob,
      finished_at: upsertJob.finished_at ? new Date(`${upsertJob.finished_at}Z`) : null
    }));
    if (!upsertJob.status) { // will be "=== 'in_progress'" when we change the api (EN-13127)
      store.dispatch(pollForUpsertJobProgress(upsertJob.id));
    }
  });
  store.dispatch(batch(operations));
}
