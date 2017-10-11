import _ from 'lodash';

const getInitialState = () => ({
  filtersOpen: false
});

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === 'TOGGLE_FILTERS') {
    return {
      ...state,
      filtersOpen: !state.filtersOpen
    };
  }

  return state;
};
