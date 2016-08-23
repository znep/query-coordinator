export const types = {
  open: 'feedback.open',
  close: 'feedback.close'
};

export const open = hoverable => ({
  type: types.open,
  hoverable
});

export const close = () => ({
  type: types.close
});
