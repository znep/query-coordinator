export const ADD_TASK_SET = 'ADD_TASK_SET';
export function addTaskSet(taskSet) {
  return {
    type: ADD_TASK_SET,
    id: taskSet.id,
    taskSet
  };
}
