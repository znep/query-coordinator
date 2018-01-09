// Webpack configuration shared between frontend, storyteller, and common karma tests.
var path = require('path');
var platformUiRoot = path.resolve(__dirname, '..', '..');

// Sets the search path for @include directives SPECIFICALLY in *.scss files.
//
// KEEP IN SYNC with: platform-ui/lib/shared/load_paths.rb

function getStyleguideIncludePaths() {
  return [
    path.resolve(platformUiRoot, './common/styleguide'),
    path.resolve(platformUiRoot, './common'),
    path.resolve(platformUiRoot, './app/styles'),
    path.resolve(platformUiRoot, '..'),
    path.resolve(platformUiRoot, './common/resources/fonts/dist'),
    path.resolve(platformUiRoot, './common/resources/fonts/templates'),
    'node_modules/normalize.css',
    'node_modules',
    'node_modules/bourbon-neat/app/assets/stylesheets',
    'node_modules/bourbon/app/assets/stylesheets',
    'node_modules/@socrata/mapbox-gl/dist',
    'node_modules/modularscale-sass/stylesheets',
    'node_modules/normalize-scss/sass',
    'node_modules/react-datepicker/dist',
    'node_modules/react-image-crop/dist',
    'node_modules/react-input-range/dist',
    'node_modules/leaflet/dist',
    'node_modules/breakpoint-sass/stylesheets',
    path.resolve(platformUiRoot, './spec/scripts'),
    platformUiRoot
  ];
}

module.exports = {
  getStyleguideIncludePaths
};
