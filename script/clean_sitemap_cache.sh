#!/bin/sh

# A script to clear the sitemap pages out of the cache, and optionally ping
# Google to notify them of the new sitemap.  This should be run in a cronjob
# periodically, perhaps once or twice a day?

READLINK=readlink
if [ $(uname) == "Darwin" ]; then
  READLINK=greadlink
fi
if ! which $READLINK > /dev/null; then
  echo "Sorry, this script needs GNU Readlink. Run it on linux"
  exit 1
fi

CACHE_ROOT=$(dirname $(dirname $($READLINK -f $0)))/public/cache

# Delete the sitemap index and all the sub-sitemaps.
rm -rf "$CACHE_ROOT/sitemap.xml" "$CACHE_ROOT/sitemap/"

# The /sitemap.xml file can either be manually submitted to search engines, and
# rely on them to re-index it at their own pace, or we can ping them to request
# a re-indexing, as is done for Google below.  We don't want to be doing this
# too many times a day, or they may get irritated/stop listening to us.

#curl -f -s -o /dev/null 'http://www.google.com/webmasters/tools/ping?sitemap=http%3A%2F%2Fwww.socrata.com%2Fsitemap.xml'
