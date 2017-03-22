export const types = {
  start: 'shared.loading.start',
  stop: 'shared.loading.stop'
};

export const start = () => ({
  type: types.start
});

export const stop = () => ({
  type: types.stop
});
