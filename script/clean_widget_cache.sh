#!/bin/sh

READLINK=readlink
if [ $(uname) == "Darwin" ]; then
  READLINK=greadlink
fi

if ! which $READLINK > /dev/null; then
  echo "Sorry, this script needs GNU Readlink. Run it on linux"
  exit 1
fi

CACHE_ROOT=$(dirname $(dirname $($READLINK -f $0)))/public/cache
MIN=60

find $CACHE_ROOT -path '*/widgets/*' -name '*.html' \! -newerBt "$MIN min ago" -delete
