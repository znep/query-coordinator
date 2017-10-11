import _ from 'lodash';
import { VALID_STORY_URL_REGEX } from 'common/http/constants';
import {
  CANCEL_FEATURED_ITEM_EDIT,
  EDIT_FEATURED_ITEM,
  HANDLE_LOADING_STORY_ERROR,
  HANDLE_LOADING_STORY_SUCCESS,
  REQUESTED_STORY,
  SET_STORY_URL_FIELD
} from '../../actionTypes';

const initialState = _.merge(
  {
    canSave: false,
    hasValidationError: false,
    isLoadingStory: false,
    shouldLoadStory: false,
    url: '',
    imageUrl: ''
  },
  initialPreviewWidgetState()
);

function validUrl(url) {
  return !_.isEmpty(url) && VALID_STORY_URL_REGEX.test(url);
}

function canSave(state) {
  return !state.hasValidationError && !state.isLoadingStory && validUrl(state.url);
}

function initialPreviewWidgetState() {
  return {
    createdAt: '',
    description: '',
    title: '',
    viewCount: null
  };
}

function restorePreviewValues(state) {
  return _.merge(state, initialPreviewWidgetState());
}

function updatePreviewValues(state, story) {
  return _.merge(state, {
    description: story.description,
    title: story.title || story.name,
    createdAt: story.createdAt,
    viewCount: story.viewCount,
    imageUrl: story.imageUrl,
    isPrivate: story.isPrivate
  });
}

export default function(state, action) {
  if (_.isUndefined(state)) {
    return initialState;
  }

  state = _.clone(state);

  switch (action.type) {
    case CANCEL_FEATURED_ITEM_EDIT:
      return initialState;

    case EDIT_FEATURED_ITEM:
      var featuredView = action.featuredItem.featuredView;
      var isStory = action.featuredItem.contentType === 'internal' &&
        featuredView.displayType === 'story';

      if (isStory) {
        state = updatePreviewValues(state, featuredView);
        state.url = featuredView.url;
        state.canSave = canSave(state);
      }
      return state;

    case HANDLE_LOADING_STORY_ERROR:
      state = restorePreviewValues(state);
      state.hasValidationError = true;
      state.isLoadingStory = false;
      state.canSave = canSave(state);
      return state;

    case HANDLE_LOADING_STORY_SUCCESS:
      state = updatePreviewValues(state, action.story);
      state.hasValidationError = false;
      state.isLoadingStory = false;
      state.canSave = canSave(state);
      return state;

    case REQUESTED_STORY:
      state.shouldLoadStory = false;
      state.isLoadingStory = true;
      return state;

    case SET_STORY_URL_FIELD:
      state.url = action.value;
      if (validUrl(action.value)) {
        state.hasValidationError = false;
        state.shouldLoadStory = true;
      } else {
        state = restorePreviewValues(state);
        state.hasValidationError = true;
        state.canSave = canSave(state);
      }
      return state;

    default:
      return state;
  }
}
