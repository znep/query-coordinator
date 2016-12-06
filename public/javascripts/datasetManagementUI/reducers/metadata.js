import _ from 'lodash';

import {
  UPDATE_METADATA,
  OPEN_METADATA_MODAL,
  CLOSE_METADATA_MODAL
} from '../actions/manageMetadata';

export function getInitialState() {
  const view = window.initialState.view;
  return {
    name: view.name,
    description: view.description,
    category: view.category,
    tags: _.defaultTo(view.tags, []),
    rowLabel: _.get(view, 'metadata.rowLabel', ''),
    modalOpen: false
  };
}

export default function(state = getInitialState(), action) {
  switch (action.type) {
    case OPEN_METADATA_MODAL:
      return {
        ...state,
        modalOpen: true
      };
    case CLOSE_METADATA_MODAL:
      return {
        ...state,
        modalOpen: false
      };
    case UPDATE_METADATA:
      return {
        ...state,
        [action.key]: action.newValue
      };
    default:
      return state;
  }
}
