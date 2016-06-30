import _ from 'lodash';
import { VALID_URL_REGEX } from '../../lib/constants';
import {
  EDIT_FEATURED_ITEM,
  SET_EXTERNAL_RESOURCE_FIELD,
  CANCEL_FEATURED_ITEM_EDIT
} from '../../actionTypes';

var initialState = {
  description: '',
  previewImage: '',
  title: '',
  url: '',
  canSave: false
};

function canSave(state) {
  return !_.isEmpty(state.title) && VALID_URL_REGEX.test(state.url);
}

export default function(state, action) {
  if (_.isUndefined(state)) {
    return initialState;
  }

  switch (action.type) {
    case EDIT_FEATURED_ITEM:
      if (action.featuredItem.contentType === 'external') {
        return {
          ...state,
          description: action.featuredItem.description,
          previewImage: action.featuredItem.previewImage,
          title: action.featuredItem.title,
          url: action.featuredItem.url,
          canSave: canSave(state)
        };
      }

      return state;

    case SET_EXTERNAL_RESOURCE_FIELD:
      var newState = {
        ...state,
        [action.field]: action.value
      };

      newState.canSave = canSave(newState);

      return newState;

    case CANCEL_FEATURED_ITEM_EDIT:
      return initialState;

    default:
      return state;
  }
}
