import { BATCH_ACTION } from 'reduxStuff/actions/batching';

const withBatching = (reducer) => {
  return (state, action) => {
    switch (action.type) {
      case BATCH_ACTION:
        return action.actions.reduce(reducer, state);
      default:
        return reducer(state, action);
    }
  };
};

export default withBatching;
