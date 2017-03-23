#!/bin/bash
set -e

REALPATH=$(python -c "import os; print(os.path.realpath('$0'))")
BASEDIR="$(dirname "${REALPATH}")/.."

cd "$BASEDIR"
bundle install
bundle exec unicorn -c $PWD/config/unicorn.rb -N
