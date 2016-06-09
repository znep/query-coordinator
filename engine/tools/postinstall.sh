#!/bin/bash

mkdir -p public/stylesheets/styleguide/css
mkdir -p public/stylesheets/styleguide/fonts
cp node_modules/socrata-styleguide/dist/css/* public/stylesheets/styleguide/css
cp node_modules/socrata-styleguide/dist/fonts/* public/stylesheets/styleguide/fonts
