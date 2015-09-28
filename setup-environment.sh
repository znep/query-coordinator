#!/bin/bash

cp tools/hooks/pre-push .git/hooks/pre-push

# Setup for Artifactory Online
# 1. Credentials
if [ ! -e $HOME/.sbt/artifactory-online.txt ]; then
    touch $HOME/.sbt/artifactory-online.txt
    echo 'Please enter your Artifactory Online username and encrypted password. '
    echo
    echo 'The encrypted password you need to use to login is in LastPass.'
    echo 'For now, you should use the "socrata-frontend" user. We may switch to individual accounts soon.'
    echo
    read -p 'Username: ' ARTIFACTORY_ONLINE_USER
    read -p 'Encrypted Password: ' ARTIFACTORY_ONLINE_PASSWORD

    echo "$ARTIFACTORY_ONLINE_USER, $ARTIFACTORY_ONLINE_PASSWORD" >> $HOME/.sbt/artifactory-online.txt
else
    IFS=', ' read -a CREDENTIALS <<< $(<$HOME/.sbt/artifactory-online.txt)
    ARTIFACTORY_ONLINE_USER="${CREDENTIALS[0]}"
    ARTIFACTORY_ONLINE_PASSWORD="${CREDENTIALS[1]}"
    echo "Artifactory Online user: $ARTIFACTORY_ONLINE_USER"
    echo "Artifactory Online encrypted password: $ARTIFACTORY_ONLINE_PASSWORD"
fi

# 2. Ruby
gem source -a https://${ARTIFACTORY_ONLINE_USER}:${ARTIFACTORY_ONLINE_PASSWORD}@socrata.artifactoryonline.com/socrata/api/gems/rubygems-remote/
gem install bundler
bundle config socrata.artifactoryonline.com "${ARTIFACTORY_ONLINE_USER}":"${ARTIFACTORY_ONLINE_PASSWORD}"
echo "" > "${HOME}/.gemrc"

# 3. NPM
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

npm config set registry https://socrata.artifactoryonline.com/socrata/api/npm/npm-remote
curl -u"${ARTIFACTORY_ONLINE_USER}":"${ARTIFACTORY_ONLINE_PASSWORD}" "https://socrata.artifactoryonline.com/socrata/api/npm/auth" >> ~/.npmrc

# 4. Bower
echo "{\"registry\": \"https://${ARTIFACTORY_ONLINE_USER}:${ARTIFACTORY_ONLINE_PASSWORD}@socrata.artifactoryonline.com/socrata/api/bower/bower-remote-github\" }" > "${HOME}/.bowerrc"
npm install -g karma-cli phantomjs karma-phantomjs-launcher bower-art-resolver
npm install
