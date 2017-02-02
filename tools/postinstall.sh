#!/bin/bash

rm -rf public/stylesheets/socrata-styleguide  # Old name for the node module
rm -rf public/stylesheets/socrata-components
rm -rf public/stylesheets/socrata-visualizations

if [ -d node_modules/socrata-components ]; then
  SOCRATA_COMPONENTS='public/stylesheets/socrata-components'
  rm -rf $SOCRATA_COMPONENTS
  mkdir -p $SOCRATA_COMPONENTS

  pushd $SOCRATA_COMPONENTS
    ln -fs ../../../node_modules/socrata-components/dist/css .
    ln -fs ../../../node_modules/socrata-components/dist/fonts .
  popd
fi

if [ -d node_modules/socrata-visualizations ]; then
  SOCRATA_VISUALIZATIONS='public/stylesheets/socrata-visualizations'
  rm -rf $SOCRATA_VISUALIZATIONS
  mkdir -p $SOCRATA_VISUALIZATIONS

  pushd $SOCRATA_VISUALIZATIONS
    ln -fs ../../../node_modules/socrata-visualizations/dist/*.css .
  popd
fi
