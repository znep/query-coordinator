// Polyfill some of the newer JS features (we're running in Phantom here)
import 'babel-polyfill';

window.jQuery = require('jquery');

function requireAll(context) {
  return context.keys().map(context);
}

requireAll(require.context('.', true, /spec\.js$/));
