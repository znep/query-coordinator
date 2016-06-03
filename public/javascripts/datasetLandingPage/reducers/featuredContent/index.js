import _ from 'lodash';

import visualizationReducer from './visualization';
import storyReducer from './story';
import externalResourceReducer from './externalResource';

import {
  ADD_FEATURED_ITEM,
  CANCEL_FEATURED_ITEM_EDIT,
  REQUESTED_FEATURED_ITEM_SAVE,
  HANDLE_FEATURED_ITEM_SAVE_SUCCESS,
  HANDLE_FEATURED_ITEM_SAVE_ERROR
} from '../../actionTypes';

var initialState = {

  // Source of truth
  contentList: _.merge([null, null, null], _.get(window.initialState, 'featuredContent', [])),

  // Editing
  isEditing: false,
  editType: null,
  editPosition: null,

  // Saving
  isSaving: false,
  isSaved: false,
  hasError: false
};

// Handles things that are not specific to any type of featured item.  Actions for other pages of
// are handled by child reducers.
export default function(state, action) {
  if (_.isUndefined(state)) {
    return {
      ...initialState,
      visualization: visualizationReducer(state, action),
      story: storyReducer(state, action),
      externalResource: externalResourceReducer(state, action)
    };
  }

  state = _.cloneDeep(state);

  state.visualization = visualizationReducer(state.visualization, action);
  state.story = storyReducer(state.story, action);
  state.externalResource = externalResourceReducer(state.externalResource, action);

  switch (action.type) {
    case ADD_FEATURED_ITEM:
      return {
        ...state,
        isEditing: true,
        editType: action.editType,
        editPosition: action.position
      };

    case CANCEL_FEATURED_ITEM_EDIT:
      return {
        ...state,
        isEditing: false,
        editType: null,
        editPosition: null,
        isSaving: false,
        isSaved: false,
        hasError: false
      };

    case REQUESTED_FEATURED_ITEM_SAVE:
      return {
        ...state,
        isSaving: true,
        hasError: false
      };

    case HANDLE_FEATURED_ITEM_SAVE_SUCCESS:
      state.contentList[action.position] = action.featuredItem;

      return {
        ...state,
        isSaving: false,
        isSaved: true
      };

    case HANDLE_FEATURED_ITEM_SAVE_ERROR:
      return {
        ...state,
        isSaving: false,
        hasError: true
      };

    default:
      return state;
  }
}
