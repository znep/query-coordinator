#!/usr/bin/env bash
set -ex

# Log the author name and email of the last commit
echo "Change committed by: $(git log HEAD -1 --pretty=format:"%an (%ae)")"

# Run tests locally in PhantomJS

export RUBYOPT="-E utf-8"

bundle install
npm install
bundle exec rake test --trace
EXIT_CODE=$?
echo "The exit code was ${EXIT_CODE}"
exit ${EXIT_CODE}
