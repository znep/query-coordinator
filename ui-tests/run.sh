#!/bin/bash
source ./config-defaults.sh

function on_exit()
{
    tput sgr0
    if [ ! -z "$AUTOSTART_SELENIUM_SERVER_PID" ]
    then
        echo "Terminating autostarted Selenium Server."
        kill $AUTOSTART_SELENIUM_SERVER_PID
        wait $AUTOSTART_SELENIUM_SERVER_PID
    fi
}

trap on_exit EXIT

if node prerun.js $*
then
    tput sgr0
    echo "Pre-test checks PASS"
else
    tput setaf 1
    echo "Pre-test checks FAIL"
    tput sgr0
    exit
fi

if [ ! -e $SELENIUM_SERVER_JAR ]
then
    SELENIUM_SERVER_JAR_URL="http://selenium.googlecode.com/files/$SELENIUM_SERVER_JAR"
    tput bold
    tput setaf 3
    echo "You don't have the configured selenium-server JAR"
    tput setaf 7
    read -p "Fetch $SELENIUM_SERVER_JAR_URL (y/n)? "
    tput sgr0
    if [ $REPLY == 'y' ]
    then
        if wget $SELENIUM_SERVER_JAR_URL
        then
            tput setaf 2
            echo "Got jar."
            tput sgr0
        else
            tput setaf 1
            echo "There was an error fetching Selenium Server. Bailing."
            tput sgr0
            exit
        fi
    else
        echo "Okay, no tests for you. Did you want to specify a different Selenium jar?"
        echo "If so, edit config-defaults.sh (for now)"
        exit
    fi
else
    tput setaf 2
    echo "You have the configured selenium-server JAR";
    tput sgr0
fi

echo "Making sure node packages are there."
npm --loglevel error install

if ! nc -z localhost $SELENIUM_SERVER_PORT
then
    tput bold
    echo "No previous selenium-server was found. Starting one for you."
    echo "Note that this results in a startup time hit. It's recommended to run"
    echo "the server separately, so it can be reused across test runs."
    tput sgr0
    java -jar $SELENIUM_SERVER_JAR > selenium.log 2>selenium-err.log &
    AUTOSTART_SELENIUM_SERVER_PID=$!
    echo Selenium is $!
fi;

echo "Waiting for Selenium to be ready... (^C to give up)."
while ! nc -z localhost $SELENIUM_SERVER_PORT; do
    sleep 0.5
done

echo "Selenium is good."

echo "Is site sane?"
if mocha -t $TEST_TIMEOUT_MILLISEC suites/e2e/sanity.js $*
then
    echo "Site is sane. Running real tests."
    mocha --recursive -t $TEST_TIMEOUT_MILLISEC suites $*
else
    tput setaf 1
    echo "Site is insane. Maybe your config is wrong, check your hostname/un/pw?"
    tput sgr0
fi
