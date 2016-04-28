#!/bin/bash
set -e

REALPATH=$(python -c "import os; print(os.path.realpath('$0'))")
BASEDIR="$(dirname "${REALPATH}")/.."

echo "Running on port 443 requires sudo, using 'sudo' to start nginx." >&2
sudo nginx -c "${BASEDIR}/dev-server/nginx.conf" -g 'error_log /dev/stderr info;'
