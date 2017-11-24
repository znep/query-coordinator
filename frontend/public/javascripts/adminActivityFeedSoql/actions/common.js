const types = {
  CHANGE_DIMENSIONS: 'CHANGE_DIMENSIONS',
  TOGGLE_FILTERS: 'TOGGLE_FILTERS'
};

const changeDimensions = (isMobile) => ({
  type: types.CHANGE_DIMENSIONS,
  isMobile
});

const apiException = () => {};

const toggleFilters = () => ({ type: types.TOGGLE_FILTERS });

export {
  types,
  apiException,
  changeDimensions,
  toggleFilters
};
