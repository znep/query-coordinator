window['jquery'] = window['jQuery'] = window['$'] = require('jquery');
window['classnames'] = require('classnames');
window['dompurify'] = require('dompurify');
window['dotdotdot'] = require('dotdotdot');
window['lodash'] = require('lodash');
window['moment'] = require('moment');
window['prismjs'] = require('prismjs');
window['react'] = window['React'] = require('react');
window['react-dom'] = window['ReactDOM'] = require('react-dom');
window['socrata-utils'] = require('socrata-utils');
window['tether'] = require('tether');
window['tether-shepherd'] = require('tether-shepherd');
window['velocity-animate'] = require('velocity-animate');

// Display a11y warnings about React components
require('react-a11y')(window.react);
