#!/bin/bash

if [[ -z $(git status -s) ]]; then
  bundle exec middleman build
  git checkout gh-pages
  ls | grep -v "build" | xargs -o rm -rf
  mv build/* .
  rm -rf build/
  git add -A
  git commit -am "Automated Deployment $(date -u)"
  git push origin gh-pages
else
  echo >&2 "Please commit of stash your changes."
  exit 1
fi
