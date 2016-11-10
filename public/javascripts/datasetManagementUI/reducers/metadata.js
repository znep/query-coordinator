import _ from 'lodash';

import { UPDATE_METADATA } from '../actions/manageMetadata';

export function getInitialState() {
  const view = window.initialState.view;
  return {
    name: view.name,
    description: view.description,
    category: view.category,
    tags: _.defaultTo(view.tags, []),
    rowLabel: _.get(view, 'metadata.rowLabel', '')
  };
}

export default function(state = getInitialState(), action) {
  switch (action.type) {
    case UPDATE_METADATA:
      return {
        ...state,
        [action.key]: action.newValue
      };

    default:
      return state;
  }
}
