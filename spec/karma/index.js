import _ from 'lodash';

// When singletons use anything environmental to
// enable successful instantiation, there will need
// to be a corresponding variable here.
window.PRIMARY_OWNER_UID = 'test-test';
window.STORY_UID = 'what-what';

console.error = _.noop;
console.warn = _.noop;

function requireAll(context) {
  return context.keys().map(context);
}

requireAll(require.context('.', true, /\.spec\.js$/));
