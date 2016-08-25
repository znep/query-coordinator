// See also config/webpack/site-chrome.config.js
// See also public/stylesheets/socrata-components/styleguide.css

import styleguide from 'socrata-styleguide';
styleguide.attachTo(document.querySelector('div.site-chrome'));

require('socrata-styleguide/dist/css/styleguide.css');
