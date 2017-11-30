export const BATCH_ACTION = 'BATCH_ACTION';
export function batchActions(actions) {
  return {
    type: BATCH_ACTION,
    actions
  };
}

