import _ from 'lodash';

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
      state.modalIsOpen = true;
      return state;
    case 'CLOSE_MODAL':
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
