import _ from 'lodash';

const getInitialState = () => _.get(window.initialState, 'featuredContent', {});

export default (state) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  return state;
};
