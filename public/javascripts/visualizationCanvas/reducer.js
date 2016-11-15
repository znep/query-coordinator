import _ from 'lodash';

export default (state) => {
  if (_.isUndefined(state)) {
    return {
      parentView: _.get(window.initialState, 'parentView'),
      view: _.get(window.initialState, 'view')
    };
  }

  return state;
};
