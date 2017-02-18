#!/usr/bin/env bash
set -e
set -o pipefail

PACKAGE_VERSION=$(node -p -e "require('./package.json').version")

if [[ -z $PACKAGE_VERSION ]]; then
  echo "Could not read package version, abort!"
  exit 1
fi

echo "Tagging $PACKAGE_VERSION"
npm install
git tag $PACKAGE_VERSION
git push origin $PACKAGE_VERSION

echo "Publishing $PACKAGE_VERSION embed artifacts to S3"
npm run webpack-minified

BUCKET="s3://sa-frontend-static-assets-us-east-1-fedramp-prod/socrata-visualizations"

EMBED_PACKAGE_FILENAME="socrata-visualizations-embed.js"
EMBED_SOURCE_MAP_FILENAME="socrata-visualizations-embed.js.map"
LOADER_PACKAGE_FILENAME="socrata-visualizations-loader.js"

VERSIONED_EMBED_PACKAGE_FILENAME="socrata-visualizations-embed-$PACKAGE_VERSION.js"
VERSIONED_EMBED_SOURCE_MAP_FILENAME="socrata-visualizations-embed-$PACKAGE_VERSION.js.map"
VERSIONED_LOADER_PACKAGE_FILENAME="socrata-visualizations-loader-$PACKAGE_VERSION.js"

pushd dist
if [[ -f $EMBED_PACKAGE_FILENAME && -f $EMBED_SOURCE_MAP_FILENAME && -f $LOADER_PACKAGE_FILENAME ]]; then
  echo "Current bucket contents:"
  aws s3 ls $BUCKET/

  # Staging artifact - always overwrite with latest.
  aws --region us-east-1 s3 cp $EMBED_PACKAGE_FILENAME $BUCKET/socrata-visualizations-embed-staging.js --acl public-read
  aws --region us-east-1 s3 cp $EMBED_SOURCE_MAP_FILENAME $BUCKET/socrata-visualizations-embed-staging.js.map --acl public-read
  aws --region us-east-1 s3 cp $LOADER_PACKAGE_FILENAME $BUCKET/socrata-visualizations-loader-staging.js --acl public-read

  # Check if the package already exists in S3 by listing the contents of the file.
  # If there is output from the below command, the file exists.
  set +e
  COUNT=`aws s3 ls $BUCKET/$VERSIONED_LOADER_PACKAGE_FILENAME | wc -l`
  set -e

  if [[ $COUNT -gt 0 ]]; then
    echo "This version already exists in S3, so not pushing!"
  else
    # Versioned artifact.
    echo "Pushing new semver to S3"
    aws --region us-east-1 s3 cp $EMBED_PACKAGE_FILENAME $BUCKET/$VERSIONED_EMBED_PACKAGE_FILENAME --acl public-read
    aws --region us-east-1 s3 cp $EMBED_SOURCE_MAP_FILENAME $BUCKET/$VERSIONED_EMBED_SOURCE_MAP_FILENAME --acl public-read
    aws --region us-east-1 s3 cp $LOADER_PACKAGE_FILENAME $BUCKET/$VERSIONED_LOADER_PACKAGE_FILENAME --acl public-read
  fi
else
  echo "Could not find all artifacts for $PACKAGE_VERSION in dist/"
  echo -e "Looking for:\n$EMBED_PACKAGE_FILENAME\n$EMBED_SOURCE_MAP_FILENAME\n$LOADER_PACKAGE_FILENAME\nFound:"
  ls
  exit 3
fi
popd

echo "Publishing $PACKAGE_VERSION to npm"
npm publish
