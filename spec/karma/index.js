// When singletons use anything environmental to
// enable successful instantiation, there will need
// to be a corresponding variable here.
window.PRIMARY_OWNER_UID = 'test-test';
window.STORY_UID = 'what-what';
window.ENABLE_FILTERED_TABLE_CREATION = true;

function requireAll(context) {
  return context.keys().map(context);
}

requireAll(require.context('.', true, /\.spec\.js$/));
