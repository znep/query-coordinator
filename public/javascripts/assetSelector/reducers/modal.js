import _ from 'lodash';

const initialState = function() {
  return {
    modalIsOpen: true
  };
};

export default (state = initialState(), action = {}) => {
  state = _.cloneDeep(state);
  switch (action.type) {
    case 'CLOSE_MODAL':
      state.modalIsOpen = false;
      return state;
    default:
      return state;
  }
};
