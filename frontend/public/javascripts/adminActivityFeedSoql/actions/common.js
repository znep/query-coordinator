const types = {
  CHANGE_DIMENSIONS: 'CHANGE_DIMENSIONS'
};

const changeDimensions = (isMobile) => ({
  type: types.CHANGE_DIMENSIONS,
  isMobile
});

const apiException = () => {};

export { types, apiException, changeDimensions };
