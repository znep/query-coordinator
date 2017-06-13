// This is required by common code.
import 'babel-polyfill-safe';

// Run all the tests
function requireAll(context) {
  context.keys().forEach(context);
}
requireAll(require.context('.', true, /\.spec\.js$/));
