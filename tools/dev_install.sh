#!/bin/bash

if [ -z "${1}" ]; then
  echo "usage: ${0} destination_directory"
  echo "example: ${0} ../frontend"
  exit 1
fi

rm -rf dist
webpack
if [ $? != 0 ]; then
  echo "Webpack failed. Not installing."
  exit
fi

export DESTINATION=${1}
rm -rf ${DESTINATION}/node_modules/socrata-utils/dist
cp -pr dist ${DESTINATION}/node_modules/socrata-utils/
