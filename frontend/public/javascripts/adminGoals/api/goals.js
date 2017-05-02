import * as api from './basic';
import Airbrake from '../../common/airbrake';

const goalsPrefix = 'goals';

export function update(goalId, goalVersion, data) {
  const path = `${goalsPrefix}/${goalId}`;
  const options = {
    body: JSON.stringify(data),
    headers: {
      'If-Match': goalVersion
    }
  };

  return api.put('v2', path, options).then(goal => {
    goal.id = goalId;
    return goal;
  });
}

export function getAll() {
  return api.get('v3', `${goalsPrefix}.json`, {}).catch(
    (error) => {
      // Maybe Storyteller is down or hasn't deployed the new API yet. Fall back to old API.
      Airbrake.notify({
        error,
        context: { info: 'goals.getAll, falling back to v1 API' }
      });
      return api.get('v1', `${goalsPrefix}.json`, {});
    });
}

export function getById(goalId) {
  const path = `${goalsPrefix}/${goalId}`;
  return api.get('v1', path, {});
}

export function fetchCsvData() {
  const path = `${goalsPrefix}.csv`;
  return api.get('v1', path, {});
}

export function publishLatestDraft(goalId) {
  if (!_.isString(goalId)) {
    throw new Error(`Cannot publish goal with malformed ID: ${goalId}`);
  }

  const draftDigest = api.get('v1', `${goalsPrefix}/${goalId}/narrative/drafts/latest`).then(_.property('digest'));

  return draftDigest.then((digest) => {
    return api.post(
      'v1',
      `${goalsPrefix}/${goalId}/narrative/published`,
      {
        body: JSON.stringify({ digest })
      }
    );
  });
}
