#!/bin/bash
set -e

# Write REVISION file
git rev-parse HEAD > "$WORKSPACE/REVISION"

# Install dependencies
bundle config socrata.artifactoryonline.com $ARTIFACTORYONLINE_USER:$ARTIFACTORYONLINE_PASSWORD
bundle install --without=development --deployment
npm install --depth 0
bundle exec rake assets:webpack

# Dammit Jammit
if [ ! $COMPRESS_ASSETS = "true" ]; then
  echo "compress_assets: off" >> $WORKSPACE/config/assets.yml
fi
bundle exec jammit
bundle exec rake assets:unminified
for asset in public/packages/*.js; do
  if [ ! -s $asset ]; then
    echo "Jammit-built asset $asset has zero size. Something strange is brewin'."
    exit
  fi
done

# Run tests
bundle exec rake test

# Sauce tests
if $RUN_SAUCE_TESTS; then
  (unset http_proxy; unset https_proxy; bundle exec rake test:karma_sauce CRITICAL_BROWSERS_ONLY=true)
fi

# Remove certain javascript files from public/javascripts (BUT WHY)
if [ ! $COMPRESS_ASSETS = "true" ] ; then
  bundle exec rake deploy:move_resources
fi

# Make the tartifact thing
tar cpzfX $SERVICE_ARTIFACT .package-ignore * .bundle .semver

# Get build info for Decima
echo "---" > build_info.yml
echo "service: ${SERVICE_NAME}" >> build_info.yml
echo "version: ${SERVICE_VERSION}" >> build_info.yml
echo "service_sha: ${SERVICE_SHA}" >> build_info.yml
echo "configuration: ${BUILD_URL}" >> build_info.yml

# Static analysis
if $RUN_STATIC_ANALYSIS; then
  # FIXME for some reason this works but the commented rake task below does not.
  ./node_modules/.bin/eslint --ignore-path .eslintignore -c package.json -f checkstyle public/javascripts/angular > eslint-results.xml || true
  # bundle exec rake "lint:js:dataCards[checkstyle]" > eslint-results.xml

  bundle exec rake "lint:ruby[xml]" > reek-results.xml
fi
