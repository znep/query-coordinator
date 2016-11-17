#!/bin/bash

rm -rf public/stylesheets/socrata-components
rm -rf public/stylesheets/socrata-visualizations

if [ -d node_modules/socrata-components ]; then
  SOCRATA_COMPONENTS='public/stylesheets/socrata-components'
  mkdir -p $SOCRATA_COMPONENTS/css
  mkdir -p $SOCRATA_COMPONENTS/fonts

  $(
    cd $SOCRATA_COMPONENTS/css
    ln -fs ../../../../node_modules/socrata-components/dist/css/* .
  )

  $(
    cd $SOCRATA_COMPONENTS/fonts
    ln -fs ../../../../node_modules/socrata-components/dist/fonts/* .
  )
fi

mkdir -p public/stylesheets/socrata-visualizations
$(
  cd public/stylesheets/socrata-visualizations
  ln -fs ../../../node_modules/socrata-visualizations/dist/*.css .
)
