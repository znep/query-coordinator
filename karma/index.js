import 'whatwg-fetch';
import 'babel-polyfill';

// $.dotdotdot reads jQuery as a top-level variable
// instead of reading it from window. We have to assign
// it to window before loading dotdotdot.
window['jQuery'] =  require('jquery');

function requireAll(context) {
  return context.keys().map(context);
}

requireAll(require.context('.', true, /\.spec\.js$/));
