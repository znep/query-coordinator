import _ from 'lodash';

const getInitialState = () => _.get(window, 'initialState.catalog', {});

export default (state = getInitialState()) => {
  return state;
};
