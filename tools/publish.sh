#!/bin/bash

PACKAGE_VERSION=$(node -p -e "require('./package.json').version")

git checkout master
npm run gulp

for package in packages/*; do
  pushd $package
  npm version $PACKAGE_VERSION
  npm publish
  popd
done

git commit packages -m "v$PACKAGE_VERSION"
git tag $PACKAGE_VERSION
git push --tags origin master
git checkout -
