import _ from 'lodash';

const initialState = function() {
  return {
    title: '',
    description: '',
    url: '',
    previewImage: ''
  };
};

export default (state = initialState(), action = {}) => {
  state = _.cloneDeep(state);
  switch (action.type) {
    case 'UPDATE_FIELD':
      state[action.field] = action.value;
      return state;
    default:
      return state;
  }
};
