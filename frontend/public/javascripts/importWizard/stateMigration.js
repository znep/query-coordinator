/*
* A version 0 state uses the function at index 0 to transform into version 1
*/
const activeMigrations = [
  sourceLinkNullsToEmptyString
];

/*
* Takes json parsed state and transforms it to the latest version
*/
export function migrateState(initialState) {
  // the first version of state didn't have a version key
  const version = initialState.version === undefined ? 0 : initialState.version;

  return activeMigrations.slice(version)
    .reduce((transformingState, transform) => transform(transformingState), initialState);
}

function sourceLinkNullsToEmptyString(state) {
  if (state.metadata &&
      state.metadata.contents &&
      state.metadata.contents.license &&
      state.metadata.contents.license.sourceLink === null) {
    state.metadata.contents.license.sourceLink = '';
  }
  return state;
}
