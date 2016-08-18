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

export function getById(goalId) {
  const path = `${goalsPrefix}/${goalId}`;
  return api.get('v1', path, {});
}

export function fetchCsvData() {
  const path = `${goalsPrefix}.csv`;
  return api.get('v1', path, {});
}
