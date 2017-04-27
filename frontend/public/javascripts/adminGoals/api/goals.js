import * as api from './basic';

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
