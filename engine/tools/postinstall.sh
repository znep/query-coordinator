#!/bin/bash

# mkdir -p public/stylesheets/styleguide/css
mkdir -p public/socrata_site_chrome/stylesheets/styleguide/fonts
# cp node_modules/socrata-styleguide/dist/css/* public/stylesheets/styleguide/css
cp node_modules/socrata-styleguide/dist/fonts/* public/socrata_site_chrome/stylesheets/styleguide/fonts

sass public/socrata_site_chrome/stylesheets/styleguide/fonts/socrata-icons.scss public/socrata_site_chrome/stylesheets/styleguide/fonts/socrata-icons.css

SCSS_FILE_PATH="public/socrata_site_chrome/stylesheets/styleguide/fonts/socrata-icons-font-family.scss"
CSS_FILE_PATH=`echo ${SCSS_FILE_PATH} | sed s/scss$/css/`
# Add a sass function for socrata-icons-path to the beginning of the
# socrata-icons-font-family.scss file from styleguide that simply
# returns the file path itself.
echo '@function socrata-icons-path($file) { @return $file }' | cat - $SCSS_FILE_PATH | sass -s --scss > $CSS_FILE_PATH
