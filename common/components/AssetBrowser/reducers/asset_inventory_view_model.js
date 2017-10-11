import _ from 'lodash';

const getInitialState = () => _.get(window, 'initialState.assetInventoryViewModel', {
  asset_inventory: {
    button_disabled: true,
    show_initialize_button: false
  }
});

export default (state) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  return state;
};
