#!/bin/bash
# Caches test-run authentication in the current shell.

if [ $_ != $0 ]
then
    unset SOCRATA_TEST_UN
    unset SOCRATA_TEST_PW
    unset SOCRATA_TEST_TOKEN
else
    echo "This script must be sourced."
fi
