import _ from 'lodash';

const initialState = function() {
  return { results: [] };
};

export default (state = initialState(), action = {}) => {
  state = _.cloneDeep(state);
  switch (action.type) {
    case 'UPDATE_RESULTS':
      state.results = action.newPageResults;
      return state;
    default:
      return state;
  }
};
