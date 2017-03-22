#!/bin/bash
set -e

GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)/$1"

CONFIG_DIRECTIVES='error_log /dev/stderr info;'
if [[ $OSTYPE == darwin* ]]; then
  # nginx needs to run with valid user/group or permission errors occur
  # when writing to the proxy_temp directory on mac os x.
  CONFIG_DIRECTIVES="$CONFIG_DIRECTIVES user $(whoami) staff;"
fi

echo "Running on port 443 requires sudo, using 'sudo' to start nginx." >&2
sudo nginx -c "${GIT_ROOT}/dev-server/nginx.conf" -g "$CONFIG_DIRECTIVES"
