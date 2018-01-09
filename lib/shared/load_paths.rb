module Shared
  module LoadPaths
    # KEEP IN SYNC with:
    #   common/webpack/shared_config.js#getStyleguideIncludePaths
    #
    # BEWARE! ORDERING IS IMPORTANT!
    #   node_modules/normalize.css has to appear above /node_modules
    #   otherwise SaSS will try to read normalize.css (which is a directory)
    #   as if it's a file :facepalm:

    SCSS_LOAD_PATHS = %w(
      ../common/styleguide
      ../common
      app/styles
      ..
      ../common/resources/fonts/dist
      ../common/resources/fonts/templates
      node_modules/normalize.css
      node_modules
      node_modules/bourbon-neat/app/assets/stylesheets
      node_modules/bourbon/app/assets/stylesheets
      node_modules/modularscale-sass/stylesheets
      node_modules/normalize-scss/sass
      node_modules/react-datepicker/dist
      node_modules/react-image-crop/dist
      node_modules/react-input-range/dist
      node_modules/leaflet/dist
      node_modules/@socrata/mapbox-gl/dist
      spec/scripts
    ).map { |path| "#{Rails.root}/#{path}" }
  end
end
