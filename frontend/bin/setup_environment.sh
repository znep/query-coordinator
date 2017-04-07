#!/bin/bash

cp tools/hooks/pre-push ../.git/hooks/pre-push
cp tools/hooks/post-merge ../.git/hooks/post-merge

# Setup for Artifactory
# 1. Credentials
if [ ! -e "$HOME/.sbt/artifactory.txt" ]; then
    touch "$HOME/.sbt/artifactory.txt"
    echo 'Please enter your Artifactory username and encrypted password. '
    echo
    echo 'The encrypted password you need to use to login is in LastPass.'
    echo 'For now, you should use the "shared-engr" user. We may switch to individual accounts soon.'
    echo
    read -rp 'Username: ' ARTIFACTORY_USER
    read -rp 'Encrypted Password: ' ARTIFACTORY_PASSWORD

    echo "$ARTIFACTORY_USER, $ARTIFACTORY_PASSWORD" >> $HOME/.sbt/artifactory.txt
else
    IFS=', ' read -ra CREDENTIALS <<< "$(<"$HOME/.sbt/artifactory.txt")"
    ARTIFACTORY_USER="${CREDENTIALS[0]}"
    ARTIFACTORY_PASSWORD="${CREDENTIALS[1]}"
    echo "Artifactory user: $ARTIFACTORY_USER"
    echo "Artifactory encrypted password: $ARTIFACTORY_PASSWORD"
fi

# 2. Ruby
gem source -a "https://${ARTIFACTORY_USER}:${ARTIFACTORY_PASSWORD}@repo.socrata.com/artifactory/api/gems/rubygems-remote/"
gem install bundler
bundle config repo.socrata.com "${ARTIFACTORY_USER}":"${ARTIFACTORY_PASSWORD}"
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

npm config set registry https://repo.socrata.com/artifactory/api/npm/npm-virtual
curl -u"${ARTIFACTORY_USER}":"${ARTIFACTORY_PASSWORD}" "https://repo.socrata.com/artifactory/api/npm/auth" >> ~/.npmrc
npm install -g karma-cli phantomjs karma-phantomjs-launcher
npm install

# 5. Postgres User
psql blist_dev -c "insert into users (email, created_at, updated_at, admin, uid, domain_id, screen_name, password, created_meta) select 'frontend@socrata.com', now(), now(), true, 'zfnt-user', 1, 'Frontend Dev Admin', 'pbkdf2|sha1|10000|71ak_kGn-LxBmY2apdapSe6TuMjfCfAa|vE4G7bFp21NjpatmmM5W561qG1dL0DFhSc7Ntutr7w_ZLGKM', 'frontend dev user' where not exists (select * from users where email = 'frontend@socrata.com')"

# 6. Locale Files
if ! grep -q "LOCALEAPP_API_KEY=.*" .env ; then
  echo 'Please enter the LocaleApp API Key, which can be found in LastPass.'
  echo
  read -rp 'LocaleApp API Key: ' LOCALEAPP_API_KEY

  echo "LOCALEAPP_API_KEY=${LOCALEAPP_API_KEY}" >> .env
fi
gem install localeapp
bin/pull_translations
