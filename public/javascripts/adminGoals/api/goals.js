import * as api from './basic';

const goalsPrefix = 'goals';

export function update(goalId, goalVersion, data) {
  const path = `${goalsPrefix}/${goalId}`;
  const options = { body: JSON.stringify(data) };

  return api.put(goalVersion, path, options).then(goal => {
    goal.id = goalId;
    return goal;
  });
}

export function getById(goalId) {
  const path = `$`
}
