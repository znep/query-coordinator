#!/bin/bash
if [ $(npm show socrata-components version) ]; then
  mkdir -p public/socrata_site_chrome/stylesheets/styleguide
  pushd public/socrata_site_chrome/stylesheets/styleguide
  ln -s ../../../../node_modules/socrata-components/dist/* .
  popd
elif [ $(npm show socrata-styleguide version) ]; then
  mkdir -p public/socrata_site_chrome/stylesheets/styleguide
  pushd public/socrata_site_chrome/stylesheets/styleguide
  ln -s ../../../../node_modules/socrata-styleguide/dist/* .
  popd
else
  echo 'npm cannot find socrata-components or socrata-styleguide.'
  exit 1;
fi

sass public/socrata_site_chrome/stylesheets/styleguide/fonts/socrata-icons.scss public/socrata_site_chrome/stylesheets/styleguide/fonts/socrata-icons.css

SCSS_FILE_PATH="public/socrata_site_chrome/stylesheets/styleguide/fonts/socrata-icons-font-family.scss"
CSS_FILE_PATH=`echo ${SCSS_FILE_PATH} | sed s/scss$/css/`
# Add a sass function for socrata-icons-path to the beginning of the
# socrata-icons-font-family.scss file from styleguide that simply
# returns the file path itself.
echo '@function socrata-icons-path($file) { @return $file }' | cat - $SCSS_FILE_PATH | sass -s --scss > $CSS_FILE_PATH
