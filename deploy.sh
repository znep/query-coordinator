#!/bin/bash

if [[ -z $(git status -s) ]]; then
  npm i
  bundle exec middleman build
  git checkout .
  git checkout master
  git pull --rebase origin master

  rm -rf docs/*
  mv build/* docs/
  rm -rf build/

  if [[ -n $(git status -s) ]]; then
    git add -A
    git commit -am "Automated Deployment $(date -u)"
    git push origin master
    git checkout -
  else
    echo >&2 "There are no changes to deploy."
    exit 1
  fi
else
  echo >&2 "Please commit or stash your changes."
  exit 1
fi
