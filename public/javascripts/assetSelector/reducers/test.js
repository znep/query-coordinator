export default function(state, action) {
  if (_.isUndefined(state)) {
    return {};
  }

  switch (action.type) {
    case 'TEST':
      return { 'test': true };

    default:
      return state;
  }
}
