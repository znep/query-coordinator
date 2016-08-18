#!/bin/bash

mkdir -p public/stylesheets/socrata-styleguide/css
mkdir -p public/stylesheets/socrata-styleguide/fonts
cp node_modules/socrata-styleguide/dist/css/* public/stylesheets/socrata-styleguide/css
cp node_modules/socrata-styleguide/dist/fonts/* public/stylesheets/socrata-styleguide/fonts

if [ -d node_modules/socrata-components ]; then
  mkdir -p public/stylesheets/socrata-components/css
  mkdir -p public/stylesheets/socrata-components/fonts
  cp node_modules/socrata-components/dist/css/* public/stylesheets/socrata-components/css
  cp node_modules/socrata-components/dist/fonts/* public/stylesheets/socrata-components/fonts
fi

mkdir -p public/stylesheets/socrata-visualizations
cp node_modules/socrata-visualizations/dist/socrata-visualizations.css public/stylesheets/socrata-visualizations
