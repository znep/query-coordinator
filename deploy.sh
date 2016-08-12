#!/bin/bash

if [[ -z $(git status -s) ]]; then
  npm i
  bundle exec middleman build
  git checkout .
  git checkout gh-pages
  git pull --rebase origin gh-pages

  ls | grep -v "build" | grep -v "node_modules" | xargs -o rm -rf
  mv build/* .
  rm -rf build/

  if [[ -n $(git status -s) ]]; then
    git add -A
    git reset node_modules
    git commit -am "Automated Deployment $(date -u)"
    git push origin gh-pages
    git checkout -
  else
    echo >&2 "There are no changes to deploy."
    exit 1
  fi
else
  echo >&2 "Please commit or stash your changes."
  exit 1
fi
