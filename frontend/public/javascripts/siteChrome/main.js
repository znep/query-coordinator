// See also config/webpack/site-chrome.config.js
// See also public/stylesheets/socrata-components/styleguide.css

import styleguide from 'common/components';
styleguide.attachTo(document.querySelector('div.site-chrome'));

require('socrata-components/dist/css/styleguide.css');
