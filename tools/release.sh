#!/usr/bin/env bash
set -e

PACKAGE_VERSION=$(node -p -e "require('./package.json').version")
npm install
git tag $PACKAGE_VERSION
git push origin $PACKAGE_VERSION
npm publish
