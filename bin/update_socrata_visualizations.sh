#! /bin/sh

# This is just a dirty hack while we don't have release tags in socrata-visualizations.

echo Hang tight, updating...
bower uninstall socrata-visualizations && bower install

echo Updated. Here is the delta:
git diff vendor/assets/components/socrata-visualizations/

echo "Please do a test pass (bin/rake test) and commit the result when you are satisfied."
