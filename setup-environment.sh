#!/bin/sh

exec cp tools/hooks/pre-push .git/hooks/pre-push

npm install -g karma-cli phantomjs karma-phantomjs-launcher
npm install
