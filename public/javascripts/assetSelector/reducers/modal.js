import _ from 'lodash';
import $ from 'jquery';

const modalPages = {
  RESULTS_CONTAINER: 'ResultsContainer',
  EXTERNAL_RESOURCE_CONTAINER: 'ExternalResourceContainer'
};

const initialState = function() {
  return {
    modalIsOpen: false,
    modalPage: modalPages.RESULTS_CONTAINER
  };
};

export default (state = initialState(), action = {}) => {
  state = _.cloneDeep(state);
  switch (action.type) {
    case 'OPEN_MODAL':
      $('body').css('overflow-y', 'hidden'); /* How terrible is this? */
      state.modalIsOpen = true;
      return state;
    case 'CLOSE_MODAL':
    $('body').css('overflow-y', 'auto');
      state.modalIsOpen = false;
      return state;
    case 'OPEN_EXTERNAL_RESOURCE_CONTAINER':
      state.modalPage = modalPages.EXTERNAL_RESOURCE_CONTAINER;
      return state;
    case 'CLOSE_EXTERNAL_RESOURCE_CONTAINER':
      state.modalPage = modalPages.RESULTS_CONTAINER;
      return state;
    default:
      return state;
  }
};
