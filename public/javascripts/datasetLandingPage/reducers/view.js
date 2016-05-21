export default function() {
  return _.get(window.initialState, 'view', {});
}
