import _ from 'lodash';

const getInitialState = () => _.get(window, 'initialState.categoryStats', {});

export default (state) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  return state;
};
