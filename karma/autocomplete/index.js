function requireAll(context) {
  context.keys().forEach(context);
}

requireAll(require.context('./components', true, /\.js$/));
requireAll(require.context('./reducers', true, /\.js$/));
requireAll(require.context('./actions', true, /\.js$/));
require('./UtilTest.js');
