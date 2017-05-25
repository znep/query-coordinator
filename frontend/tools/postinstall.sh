#!/bin/bash

rm -rf public/stylesheets/socrata-styleguide  # Old name for the node module
rm -rf public/stylesheets/socrata-components
rm -rf public/stylesheets/socrata-visualizations

if [ -d node_modules/socrata-visualizations ]; then
  SOCRATA_VISUALIZATIONS='public/stylesheets/socrata-visualizations'
  rm -rf $SOCRATA_VISUALIZATIONS
  mkdir -p $SOCRATA_VISUALIZATIONS

  pushd $SOCRATA_VISUALIZATIONS
    ln -fs ../../../node_modules/socrata-visualizations/dist/*.css .
  popd
fi
