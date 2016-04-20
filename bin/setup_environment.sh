#!/bin/bash

cp tools/hooks/pre-push .git/hooks/pre-push

# Setup for Artifactory Online
# 1. Credentials
if [ ! -e "$HOME/.sbt/artifactory-online.txt" ]; then
    touch "$HOME/.sbt/artifactory-online.txt"
    echo 'Please enter your Artifactory Online username and encrypted password. '
    echo
    echo 'The encrypted password you need to use to login is in LastPass.'
    echo 'For now, you should use the "socrata-frontend" user. We may switch to individual accounts soon.'
    echo
    read -rp 'Username: ' ARTIFACTORY_ONLINE_USER
    read -rp 'Encrypted Password: ' ARTIFACTORY_ONLINE_PASSWORD

    echo "$ARTIFACTORY_ONLINE_USER, $ARTIFACTORY_ONLINE_PASSWORD" >> $HOME/.sbt/artifactory-online.txt
else
    IFS=', ' read -ra CREDENTIALS <<< "$(<"$HOME/.sbt/artifactory-online.txt")"
    ARTIFACTORY_ONLINE_USER="${CREDENTIALS[0]}"
    ARTIFACTORY_ONLINE_PASSWORD="${CREDENTIALS[1]}"
    echo "Artifactory Online user: $ARTIFACTORY_ONLINE_USER"
    echo "Artifactory Online encrypted password: $ARTIFACTORY_ONLINE_PASSWORD"
fi

# 2. Ruby
gem source -a "https://${ARTIFACTORY_ONLINE_USER}:${ARTIFACTORY_ONLINE_PASSWORD}@socrata.artifactoryonline.com/socrata/api/gems/rubygems-remote/"
gem install bundler
bundle config socrata.artifactoryonline.com "${ARTIFACTORY_ONLINE_USER}":"${ARTIFACTORY_ONLINE_PASSWORD}"
bundle install

# 3. NPM
if [ "$(find ~/.npm -not -user "$(whoami)")" ]; then
    echo "Permissions don't match for ~/.npm, using 'sudo' to modify them." >&2
    sudo chown -R "$(whoami)" ~/.npm
fi

if [ "$(find /usr/local/lib/node_modules -not -user "$(whoami)")" ]; then
    echo "Permissions don't match for /usr/local/lib/node_modules, using 'sudo' to modify them." >&2
    sudo chown -R "$(whoami)" /usr/local/lib/node_modules
fi

npm config set registry https://socrata.artifactoryonline.com/socrata/api/npm/npm-virtual
curl -u"${ARTIFACTORY_ONLINE_USER}":"${ARTIFACTORY_ONLINE_PASSWORD}" "https://socrata.artifactoryonline.com/socrata/api/npm/auth" >> ~/.npmrc
npm install -g karma-cli phantomjs karma-phantomjs-launcher
npm install

# 4. Bower
echo "{\"registry\": \"https://${ARTIFACTORY_ONLINE_USER}:${ARTIFACTORY_ONLINE_PASSWORD}@socrata.artifactoryonline.com/socrata/api/bower/bower-remote-github\" }" > "${HOME}/.bowerrc"

# 5. Postgres User
psql blist_dev -c "insert into users (email, created_at, updated_at, admin, uid, domain_id, screen_name, password, created_meta) select 'frontend@socrata.com', now(), now(), true, 'zfnt-user', 1, 'Frontend Dev Admin', 'pbkdf2|sha1|10000|71ak_kGn-LxBmY2apdapSe6TuMjfCfAa|vE4G7bFp21NjpatmmM5W561qG1dL0DFhSc7Ntutr7w_ZLGKM', 'frontend dev user' where not exists (select * from users where email = 'frontend@socrata.com')"
