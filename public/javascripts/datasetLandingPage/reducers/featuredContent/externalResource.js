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

  state = _.cloneDeep(state);

  switch (action.type) {
    case EDIT_FEATURED_ITEM:
      if (action.featuredItem.contentType === 'external') {
        state.description = action.featuredItem.description;
        state.previewImage = action.featuredItem.previewImage;
        state.title = action.featuredItem.title;
        state.url = action.featuredItem.url;
        state.canSave = canSave(state);
      }
      return state;

    case SET_EXTERNAL_RESOURCE_FIELD:
      state[action.field] = action.value;
      state.canSave = canSave(state);
      return state;

    case CANCEL_FEATURED_ITEM_EDIT:
      return initialState;

    default:
      return state;
  }
}
