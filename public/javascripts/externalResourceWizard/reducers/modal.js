import _ from 'lodash';
import $ from 'jquery';

const initialState = function() {
  return {
    modalIsOpen: false
  };
};

export default (state = initialState(), action = {}) => {
  state = _.cloneDeep(state);
  switch (action.type) {
    case 'OPEN_EXTERNAL_RESOURCE_WIZARD':
      $('body').addClass('modal-open');
      state.modalIsOpen = true;
      return state;
    case 'CLOSE_EXTERNAL_RESOURCE_WIZARD':
      $('body').removeClass('modal-open');
      state.modalIsOpen = false;
      return state;
    default:
      return state;
  }
};
