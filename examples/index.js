// These map directly to our webpack.config.js's externals.
// Update them accordingly!
window['classnames'] = require('classnames');
window['d3'] = require('d3');
window['jquery'] = window['$'] = require('jquery');
window['leaflet'] = require('leaflet');
window['lodash'] = require('lodash');
window['moment'] = require('moment');
window['react'] = require('react');
window['react-dom'] = require('react-dom');
window['react-redux'] = require('react-redux');
window['redux'] = require('redux');
window['redux-logger'] = require('redux-logger');
window['redux-thunk'] = require('redux-thunk');
window['reselect'] = require('reselect');
window['socrata-components'] = require('socrata-components');
window['socrata-utils'] = require('socrata-utils');
window['whatwg-fetch'] = require('whatwg-fetch');
