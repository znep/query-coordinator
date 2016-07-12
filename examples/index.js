// These map directly to our webpack.config.js's externals.
// Update them accordingly!
window['jquery'] = window['$'] = require('jquery');
window['lodash'] = require('lodash');
window['react'] = require('react');
window['react-dom'] = require('react-dom');
window['d3'] = require('d3');
window['leaflet'] = require('leaflet');
window['moment'] = require('moment');
window['socrata-styleguide'] = require('socrata-styleguide');
window['socrata-utils'] = require('socrata-utils');
