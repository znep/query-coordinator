import 'whatwg-fetch';
import 'babel-polyfill';
import 'common/visualizations/views/styles/socrata-visualizations.scss';

// Since we use jQuery plugins that patch themselves globally onto window.jQuery,
// we're forced to generate a single large test bundle (instead of karma-webpack's
// default of generating one package per test file).
// This file is responsible for defining that mega-package:
// pulling in every test file via requireAll.
window.jQuery = require('jquery');

function requireAll(context) {
  return context.keys().map(context);
}

requireAll(require.context('.', true, /\.spec\.js$/));
