import _ from 'lodash';

const initialState = function() {
  return {
    modalIsOpen: false
  };
};

export default (state = initialState(), action = {}) => {
  state = _.cloneDeep(state);
  switch (action.type) {
    case 'OPEN_EXTERNAL_RESOURCE_WIZARD':
      state.modalIsOpen = true;
      return state;
    case 'CLOSE_EXTERNAL_RESOURCE_WIZARD':
      state.modalIsOpen = false;
      return state;
    default:
      return state;
  }
};
