import _ from 'lodash';

const getInitialState = () => _.get(window, 'initialState.catalog', {
  columns: [],
  results: []
});

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === 'UPDATE_CATALOG_RESULTS') {
    return {
      ...state,
      results: action.results
    };
  }

  return state;
};
