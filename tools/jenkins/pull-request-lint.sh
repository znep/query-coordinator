#!/usr/bin/env bash
set -ex

npm install --depth 0
MERGE_BASE=$(git merge-base HEAD origin/master)

NEW_PROBLEMS=$(git diff --name-status ${MERGE_BASE} | grep '^\(A\|M\).*\.jsx\?$' | cut -c3- | xargs node_modules/.bin/eslint --ignore-path .eslintignore -f compact)
DELTA=$(echo ${NEW_PROBLEMS} | sed -e :a -e '$d;N;2,2ba' -e 'P;D')
DELTA_COUNT=$(echo ${NEW_PROBLEMS} | tail -n1 | cut -d ' ' -f 1)

if [ -n "${DELTA}" ]; then
  echo
  echo "New errors:"
  echo "${NEW_PROBLEMS}"
  echo
fi

if [ "${DELTA_COUNT:=0}" -gt 0 ]; then
  false
else
  true
fi
