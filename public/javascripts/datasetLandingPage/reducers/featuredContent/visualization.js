import _ from 'lodash';

export default function(state, action) {
  if (_.isUndefined(state)) {
    return {};
  }

  switch (action.type) {
    default:
      return state;
  }
}
