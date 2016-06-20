import _ from 'lodash';

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

// Given a featured item, we need to figure out if it's a normal visualization, a story, or an
// external resource.  Normally the `contentType` would provide this information for us, but
// currently both stories and visualizations have a contentType of "internal".  We have been told
// that eventually we will not special case stories, in which case `contentType` will provide
// sufficient information and we can remove the concept of `editType` entirely.
function getEditTypeFromFeaturedItem(featuredItem) {
  if (featuredItem.contentType === 'external') {
    return 'externalResource';
  } else if (featuredItem.contentType === 'internal') {
    if (featuredItem.featuredView.displayType === 'story') {
      return 'story';
    } else {
      return 'visualization';
    }
  }
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

  state = _.cloneDeep(state);

  state.viewSelector = viewSelectorReducer(state.viewSelector, action);
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
      state.contentList[action.position] = null;

      return {
        ...state,
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
