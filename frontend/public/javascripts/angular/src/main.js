window._ = require('lodash'); // eslint-disable-line angular/window-service
window.socrata = window.socrata || {}; // eslint-disable-line angular/window-service
window.socrata.utils = require('common/js_utils'); // eslint-disable-line angular/window-service

require('babel-polyfill-safe');
require('script!plugins/url');
require('script!dotdotdot');
require('script!javascript-detect-element-resize/jquery.resize.js');
require('script!../../util/jquery-extensions');

// We mix require and import because they have different hoisting behavior and order matters here.
require('../../util/lodash-mixins');
require('imports?DOMPurify=dompurify!../../util/dompurify-extensions');

require('../../lib/RxExtensions');

require('../dataCards/app');
