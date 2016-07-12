import _ from 'lodash';
import { getEditTypeFromFeaturedItem } from '../../lib/featuredContent';

import viewSelectorReducer from './viewSelector';
import storyReducer from './story';
import externalResourceReducer from './externalResource';

import {
  ADD_FEATURED_ITEM,
  EDIT_FEATURED_ITEM,
  CANCEL_FEATURED_ITEM_EDIT,
  REQUESTED_FEATURED_ITEM_SAVE,
  HANDLE_FEATURED_ITEM_SAVE_SUCCESS,
  HANDLE_FEATURED_ITEM_SAVE_ERROR,
  REQUESTED_FEATURED_ITEM_REMOVAL,
  HANDLE_FEATURED_ITEM_REMOVAL_SUCCESS,
  HANDLE_FEATURED_ITEM_REMOVAL_ERROR,
  SET_SAVING_FEATURED_ITEM
} from '../../actionTypes';

var initialState = {

  // Source of truth
  contentList: assembleInitialFeaturedContent(),

  // Editing
  isEditing: false,
  editType: null,
  editPosition: null,

  // Saving
  isSaving: false,
  isSaved: false,
  hasSaveError: false,
  isSavingViewUid: '',

  // Removing
  isRemoving: false,
  removePosition: null,
  hasRemoveError: false
};

function assembleInitialFeaturedContent() {
  var featuredContent = _.get(window.initialState, 'featuredContent', []);
  var contentList = [null, null, null];

  featuredContent.forEach(function(item) {
    contentList[item.position] = item;
  });

  return contentList;
}

// Handles things that are not specific to any type of featured item.  Actions for other pages of
// are handled by child reducers.
export default function(state, action) {
  if (_.isUndefined(state)) {
    return {
      ...initialState,
      viewSelector: viewSelectorReducer(state, action),
      story: storyReducer(state, action),
      externalResource: externalResourceReducer(state, action)
    };
  }

  state = {
    ...state,
    viewSelector: viewSelectorReducer(state.viewSelector, action),
    story: storyReducer(state.story, action),
    externalResource: externalResourceReducer(state.externalResource, action)
  };

  switch (action.type) {
    case ADD_FEATURED_ITEM:
      return {
        ...state,
        isEditing: true,
        editType: action.editType,
        editPosition: action.position
      };

    case EDIT_FEATURED_ITEM:
      return {
        ...state,
        isEditing: true,
        editType: getEditTypeFromFeaturedItem(action.featuredItem),
        editPosition: action.featuredItem.position
      };

    case CANCEL_FEATURED_ITEM_EDIT:
      return {
        ...state,
        isEditing: false,
        editType: null,
        editPosition: null,
        isSaving: false,
        isSaved: false,
        hasSaveError: false,
        isRemoving: false,
        removePosition: null,
        hasRemoveError: false
      };

    case REQUESTED_FEATURED_ITEM_SAVE:
      return {
        ...state,
        isSaving: true,
        hasSaveError: false
      };

    case SET_SAVING_FEATURED_ITEM:
      return {
        ...state,
        isSavingViewUid: action.viewUid
      };

    case HANDLE_FEATURED_ITEM_SAVE_SUCCESS:
      return {
        ...state,
        contentList: _.set(_.clone(state.contentList), action.position, action.featuredItem),
        isSaving: false,
        isSaved: true
      };

    case HANDLE_FEATURED_ITEM_SAVE_ERROR:
      return {
        ...state,
        isSaving: false,
        hasSaveError: true
      };

    case REQUESTED_FEATURED_ITEM_REMOVAL:
      return {
        ...state,
        isRemoving: true,
        removePosition: action.position,
        hasRemoveError: false
      };

    case HANDLE_FEATURED_ITEM_REMOVAL_SUCCESS:
      return {
        ...state,
        contentList: _.set(_.clone(state.contentList), action.position, null),
        isRemoving: false,
        removePosition: null,
        hasRemoveError: false
      };

    case HANDLE_FEATURED_ITEM_REMOVAL_ERROR:
      return {
        ...state,
        isRemoving: false,
        removePosition: null,
        hasRemoveError: true
      };

    default:
      return state;
  }
}
