// See also config/webpack/site-appearance.config.js
// See also public/stylesheets/socrata-components/styleguide.css

import components from 'socrata-components';
components.attachTo(document.querySelector('div.site-appearance'));

require('socrata-components/dist/css/styleguide.css');
