import _ from 'lodash';

const initialState = function() {
  return {
    modalIsOpen: false
  };
};

export default (state = initialState(), action = {}) => {
  state = _.cloneDeep(state);
  switch (action.type) {
    case 'OPEN_MODAL':
      state.modalIsOpen = true;
      return state;
    case 'CLOSE_MODAL':
      state.modalIsOpen = false;
      return state;
    default:
      return state;
  }
};
