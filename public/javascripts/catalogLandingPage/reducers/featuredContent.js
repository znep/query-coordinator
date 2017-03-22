import _ from 'lodash';

const getInitialState = () => _.get(window, 'initialState.featuredContent', {});

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  const key = `item${action.position}`;

  if (action.type === 'SET_FEATURED_CONTENT_ITEM') {
    if (_.isString(action.item.id)) {
      // The Cetera api returns an "id" property for the 4x4, and the featured content api returns an "id"
      // for the resource id. Since we are combining both of these into the same redux state tree,
      // we map the cetera id to "uid".
      action.item.uid = action.item.id;
      delete(action.item.id);
    }
    action.item.position = action.position;
    return {
      ...state,
      [key]: action.item
    };
  }

  if (action.type === 'REMOVE_FEATURED_CONTENT_ITEM') {
    const removedItem = { ...state[key], removed: true };
    return { ...state, [key]: removedItem };
  }

  return state;
};
