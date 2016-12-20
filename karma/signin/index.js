function requireAll(context) {
  context.keys().forEach(context);
}

requireAll(require.context('./components', true, /\.js$/));
require('./UtilTest.js');
