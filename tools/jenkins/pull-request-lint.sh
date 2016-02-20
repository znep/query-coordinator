#!/usr/bin/env bash
set -ex

# Fail on errors in pipes (note that each command in the pipe is still run: http://www.gnu.org/software/bash/manual/html_node/Pipelines.html)
# This combined with set -e above causes the script to terminate if eslint returns nonzero.
set -o pipefail

npm install --depth 0
NEW_PROBLEMS=`node_modules/.bin/eslint --ignore-path .eslintignore -f compact public/javascripts/angular | sort | tail -n +3`
NEW_PROBLEMS_COUNT=`wc -l <(echo "$NEW_PROBLEMS") | awk '{print $1}'`

git checkout `git merge-base HEAD origin/master`
OLD_PROBLEMS=`node_modules/.bin/eslint --ignore-path .eslintignore -f compact public/javascripts/angular | sort | tail -n +3`
OLD_PROBLEMS_COUNT=`wc -l <(echo "$OLD_PROBLEMS") | awk '{print $1}'`

DELTA=`diff <(echo "$OLD_PROBLEMS") <(echo "$NEW_PROBLEMS") | grep '^> ' || true`
DELTA_COUNT=`expr $NEW_PROBLEMS_COUNT - $OLD_PROBLEMS_COUNT || true`

if [ -n "$DELTA" ]; then
  echo
  echo "New errors:"
  echo "$DELTA"
  echo
fi

echo "Old problems: $OLD_PROBLEMS_COUNT"
echo "New problems: $NEW_PROBLEMS_COUNT"

if [ "$DELTA_COUNT" -gt 0 ]; then
  false
else
  true
fi
