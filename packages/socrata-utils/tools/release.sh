#!/usr/bin/env bash
set -e

PACKAGE_VERSION=utils-$(node -p -e "require('./package.json').version")
git tag $PACKAGE_VERSION
git push origin $PACKAGE_VERSION
npm publish
