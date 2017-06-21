const windowDBMiddleware = store => next => action => {
  const result = next(action);
  window.ENTITIES = store.getState().entities;
  return result;
};

export default windowDBMiddleware;
