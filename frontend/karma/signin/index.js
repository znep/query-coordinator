import _ from 'lodash';
window._ = _;

function requireAll(context) {
  context.keys().forEach(context);
}

require('babel-polyfill');

requireAll(require.context('.', true, /Test\.js$/));
