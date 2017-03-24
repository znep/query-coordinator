const windowDBMiddleware = store => next => action => {
  const result = next(action);
  window.DB = store.getState().db;
  return result;
};

export default windowDBMiddleware;
