import _ from 'lodash';

const initialState = function() {
  return {
    type: 'CARD_VIEW'
  };
};

export default (state = initialState(), action = {}) => {
  state = _.cloneDeep(state);
  switch (action.type) {
    case 'CHANGE_VIEW_TYPE':
      state.type = action.newType;
      return state;
    default:
      return state;
  }
};
