#!/bin/bash

if [ -d node_modules/socrata-styleguide ]; then
  mkdir -p public/stylesheets/socrata-styleguide
  $(
    cd public/stylesheets/socrata-styleguide
    ln -fs ../../../node_modules/socrata-styleguide/dist/* .
  )
else
  rm -rf public/stylesheets/socrata-styleguide
fi

if [ -d node_modules/socrata-components ]; then
  mkdir -p public/stylesheets/socrata-components
  $(
    cd public/stylesheets/socrata-components
    ln -fs ../../../node_modules/socrata-components/dist/* .
  )
else
  rm -rf public/stylesheets/socrata-components
fi

mkdir -p public/stylesheets/socrata-visualizations
$(
  cd public/stylesheets/socrata-visualizations
  ln -fs ../../../node_modules/socrata-visualizations/dist/* .
)
