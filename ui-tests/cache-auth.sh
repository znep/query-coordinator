#!/bin/bash
# Caches test-run authentication in the current shell.

if [ $_ != $0 ]
then
    tput setaf 3
    echo "SECURITY WARNING! This will cache your auth details in your local env, under"
    echo "SOCRATA_TEST_{UN,PW!,TOKEN} Beware this fact! You may want to run"
    echo "clear-auth.sh or close the shell when you're done."
    tput sgr0
    echo "If you're cool with this, fill these in:"
    read -p "Username: " SOCRATA_TEST_UN
    read -p "Password: " -s SOCRATA_TEST_PW
    echo
    read -p "API Token: " SOCRATA_TEST_TOKEN
    echo
    echo "Storing in env."
    export SOCRATA_TEST_UN
    export SOCRATA_TEST_PW
    export SOCRATA_TEST_TOKEN
else
    echo "This script must be sourced."
fi
