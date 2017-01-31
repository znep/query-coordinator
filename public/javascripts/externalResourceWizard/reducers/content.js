import _ from 'lodash';
// import { VALID_URL_REGEX } from '../lib/constants';

const initialState = function() {
  return {
    title: { value: '', invalid: true },
    description: { value: '' },
    url: { value: '', invalid: true },
    previewImage: { value: '' }
  };
};

const isInvalidTitle = (value) => {
  return _.isEmpty(value);
};

const isInvalidUrl = (value) => {
  // We may want to do more validation down the road. Commenting out for now
  // return _.isEmpty(value) || !(VALID_URL_REGEX.test(value));
  return _.isEmpty(value);
};

export default (state = initialState(), action = {}) => {
  state = _.cloneDeep(state);
  switch (action.type) {
    case 'UPDATE_TITLE':
      state.title = { value: action.value, invalid: isInvalidTitle(action.value) };
      return state;
    case 'UPDATE_DESCRIPTION':
      state.description = { value: action.value };
      return state;
    case 'UPDATE_URL':
      state.url = { value: action.value, invalid: isInvalidUrl(action.value) };
      return state;
    case 'UPDATE_PREVIEW_IMAGE':
      state.previewImage = { value: action.value };
      return state;
    default:
      return state;
  }
};
