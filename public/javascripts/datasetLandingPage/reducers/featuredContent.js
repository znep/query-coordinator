import _ from 'lodash';

import {
} from '../actions';

var initialState = {
  contentList: _.get(window.initialState, 'featuredContent', [null, null, null]),
  isEditingFeaturedContent: false,
  isEditingFeaturedItem: false,
  stagedItem: null
};

export default function(state, action) {
  if (_.isUndefined(state)) {
    return initialState;
  }

  switch (action.type) {
    default:
      return state;
  }
}
