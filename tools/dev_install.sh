#!/bin/bash

if [ -z "${1}" ]; then
  echo "usage: ${0} destination_directory"
  echo "example: ${0} ../frontend"
  exit 1
fi

npm test
if [ $? != 0 ]; then
  echo "Tests failed. Not installing."
  exit
fi

rm -rf dist
NODE_ENV=production npm run gulp
export DESTINATION=${1}
rm -rf ${DESTINATION}/node_modules/socrata-components/dist/*
rm -rf ${DESTINATION}/node_modules/socrata-components/styles/*
rm -rf ${DESTINATION}/public/stylesheets/socrata-components/*
cp -pr dist/js ${DESTINATION}/node_modules/socrata-components/dist/
cp -pr dist/css ${DESTINATION}/node_modules/socrata-components/dist/
cp -pr dist/fonts ${DESTINATION}/node_modules/socrata-components/dist/
cp -pr dist/fonts/* ${DESTINATION}/node_modules/socrata-components/styles/
cp -pr dist/fonts ${DESTINATION}/public/stylesheets/socrata-components/
cp -pr dist/css ${DESTINATION}/public/stylesheets/socrata-components/
cp -pr packages/socrata-components/styles ${DESTINATION}/node_modules/socrata-components/
cp -pr packages/socrata-components/dist/fonts/svg ${DESTINATION}/node_modules/socrata-components/dist/fonts
