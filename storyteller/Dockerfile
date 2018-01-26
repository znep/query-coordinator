FROM socrata/runit-ruby-2.3.5
MAINTAINER Socrata <sysadmin@socrata.com>

ENV TIMECMD="/usr/bin/time -p"

ARG ARTIFACTORY_USER
ARG ARTIFACTORY_PASSWORD

ENV PLATFORM_UI_DIR=/opt/socrata/platform-ui \
    APP_DIR=/opt/socrata/platform-ui/storyteller \
    APP_TMP_DIR=/opt/socrata/platform-ui/storyteller/tmp \
    RACK_ENV=production \
    RAILS_ENV=production \
    RAILS_SERVE_STATIC_FILES=true \
    SERVICE_DIR_BASE=/etc/service

# Install additional packages for building our gems
RUN DEBIAN_FRONTEND=noninteractive && \
  apt-get update -q && \
  apt-get install -y time zlib1g-dev libxslt1-dev \
    libpq-dev nodejs npm git imagemagick && \
  apt-get purge -y --auto-remove software-properties-common && \
  rm -rf /var/lib/apt/lists/*

RUN mkdir ${SERVICE_DIR_BASE}/storyteller
COPY storyteller/runit/web_server ${SERVICE_DIR_BASE}/storyteller/run

RUN mkdir ${SERVICE_DIR_BASE}/storyteller-documents-queue-worker
COPY storyteller/runit/work_documents_queue ${SERVICE_DIR_BASE}/storyteller-documents-queue-worker/run

RUN mkdir ${SERVICE_DIR_BASE}/storyteller-thumbnails-queue-worker
COPY storyteller/runit/work_thumbnails_queue ${SERVICE_DIR_BASE}/storyteller-thumbnails-queue-worker/run

RUN mkdir ${SERVICE_DIR_BASE}/storyteller-metrics-queue-worker
COPY storyteller/runit/work_metrics_queue ${SERVICE_DIR_BASE}/storyteller-metrics-queue-worker/run

RUN mkdir ${SERVICE_DIR_BASE}/storyteller-domains-queue-worker
COPY storyteller/runit/work_domains_queue ${SERVICE_DIR_BASE}/storyteller-domains-queue-worker/run

RUN mkdir ${SERVICE_DIR_BASE}/storyteller-core-events-listener
COPY storyteller/runit/core_events_listener ${SERVICE_DIR_BASE}/storyteller-core-events-listener/run

# Run this early since we don't expect it to change very often
RUN ${TIMECMD} npm install -g n
RUN ${TIMECMD} n 6.9.1

# Only bundle install when Gemfile has changed
COPY storyteller/Gemfile* /tmp/
COPY storyteller/.ruby-version /tmp/
COPY storyteller/vendor /tmp/vendor

# Copy site_chrome to root to bundle install successfully.
RUN mkdir /common
COPY common/site_chrome /common/site_chrome

WORKDIR /tmp
RUN bundle config repo.socrata.com "${ARTIFACTORY_USER}":"${ARTIFACTORY_PASSWORD}"
RUN ${TIMECMD} bundle install

# Only run npm install fresh when package.json is changed
COPY storyteller/package.json /tmp/package.json
COPY storyteller/.npmrc /tmp/.npmrc
RUN cd /tmp && ${TIMECMD} npm install
RUN mkdir -p ${APP_DIR} && mv /tmp/node_modules ${APP_DIR}

# Add application code
ADD . ${PLATFORM_UI_DIR}
WORKDIR ${APP_DIR}

ADD storyteller/config/database.yml.production ${APP_DIR}/config/database.yml

RUN ${TIMECMD} npm run webpack
RUN DISABLE_CACHE=true ${TIMECMD} bundle exec rake assets:precompile

# Make and chown the rails tmp dir to the socrata user
RUN mkdir -p ${APP_TMP_DIR}
RUN chown socrata -R ${APP_TMP_DIR}

EXPOSE 3010
