import _ from 'lodash';

const initialState = function() {
  return { count: 0 };
};

export default (state = initialState(), action = {}) => {
  state = _.cloneDeep(state);
  switch (action.type) {
    case 'UPDATE_RESULT_COUNT':
      state.count = action.newResultCount;
      return state;
    default:
      return state;
  }
};
