FROM socrata/runit-ruby-2.3
MAINTAINER Socrata <sysadmin@socrata.com>

ENV APP_DIR /opt/socrata/storyteller
ENV APP_TMP_DIR ${APP_DIR}/tmp
ENV RACK_ENV production
ENV RAILS_ENV production
ENV RAILS_SERVE_STATIC_FILES true
ENV SERVICE_DIR_BASE /etc/service

# Install additional packages for building our gems
RUN DEBIAN_FRONTEND=noninteractive && \
  apt-get update -q && \
  apt-get install -y ruby2.3-dev build-essential libxml2-dev \
    zlib1g-dev libxslt1-dev libpq-dev nodejs npm git imagemagick && \
  apt-get purge -y --auto-remove software-properties-common && \
  rm -rf /var/lib/apt/lists/*

RUN mkdir ${SERVICE_DIR_BASE}/storyteller
COPY runit/web_server ${SERVICE_DIR_BASE}/storyteller/run

RUN mkdir ${SERVICE_DIR_BASE}/storyteller-documents-queue-worker
COPY runit/work_documents_queue ${SERVICE_DIR_BASE}/storyteller-documents-queue-worker/run

RUN mkdir ${SERVICE_DIR_BASE}/storyteller-metrics-queue-worker
COPY runit/work_metrics_queue ${SERVICE_DIR_BASE}/storyteller-metrics-queue-worker/run

# Run this early since we don't expect it to change very often
RUN npm install -g n
RUN n lts

# Only bundle install when Gemfile has changed
COPY Gemfile* /tmp/
COPY .ruby-version /tmp/
COPY vendor /tmp/vendor
WORKDIR /tmp
RUN bundle install

# Only run npm install fresh when package.json is changed
COPY package.json /tmp/package.json
COPY .npmrc /tmp/.npmrc
RUN cd /tmp && npm install
RUN mkdir -p ${APP_DIR} && mv /tmp/node_modules ${APP_DIR}/

# Add application code
ADD . ${APP_DIR}
WORKDIR ${APP_DIR}

ADD config/database.yml.production ${APP_DIR}/config/database.yml

RUN npm run webpack
RUN bundle exec rake assets:precompile

# Make and chown the rails tmp dir to the socrata user
RUN mkdir -p ${APP_TMP_DIR}
RUN chown socrata -R ${APP_TMP_DIR}

EXPOSE 3010
