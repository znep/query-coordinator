var path = require('path');
var commonRoot = path.resolve(__dirname, '../../../common');

module.exports = () => [
  'dist/fonts',
  'dist/css',
  'pages/stylesheets',
  commonRoot,
  commonRoot + '/styleguide',
  'node_modules/bourbon/app/assets/stylesheets',
  'node_modules/bourbon-neat/app/assets/stylesheets',
  'node_modules/breakpoint-sass/stylesheets',
  'node_modules/modularscale-sass/stylesheets',
  'node_modules/normalize.css',
  'node_modules/react-input-range/dist',
  'node_modules/react-datepicker/dist'
];
