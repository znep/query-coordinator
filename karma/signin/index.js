function requireAll(context) {
  context.keys().forEach(context);
}

require('babel-polyfill');
requireAll(require.context('./components', true, /\.js$/));
require('./UtilTest.js');
