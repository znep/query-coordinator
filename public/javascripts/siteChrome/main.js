// See also config/webpack/site-chrome.config.js
// See also public/stylesheets/socrata-components/styleguide.css

import components from 'socrata-components';
components.attachTo(document.querySelector('div.site-chrome'));

require('socrata-components/dist/css/styleguide.css');
