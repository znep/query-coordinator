window.DOMPurify = require('dompurify'); // eslint-disable-line angular/window-service
window._ = require('lodash'); // eslint-disable-line angular/window-service
window.socrata = window.socrata || {}; // eslint-disable-line angular/window-service
window.socrata.utils = require('socrata-utils'); // eslint-disable-line angular/window-service

// We mix require and import because they have different hoisting behavior and order matters here.
require('../../util/jquery-extensions');
require('../../util/lodash-mixins');
require('../../util/dompurify-extensions');

require('script!plugins/modernizr');
require('../../lib/RxExtensions');

require('../dataCards/styles');
require('../dataCards/app');
