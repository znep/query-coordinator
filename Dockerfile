FROM socrata/ruby2.2
MAINTAINER Socrata <sysadmin@socrata.com>

ENV APP_DIR /opt/socrata/storyteller

# Install additional packages for building our gems
RUN DEBIAN_FRONTEND=noninteractive && \
  apt-get update -q && \
  apt-get install -y ruby2.2-dev build-essential libxml2-dev \
    zlib1g-dev libxslt1-dev libpq-dev nodejs git imagemagick && \
  apt-get purge -y --auto-remove software-properties-common && \
  rm -rf /var/lib/apt/lists/*

ADD ship.d /etc/ship.d
ADD . ${APP_DIR}

WORKDIR ${APP_DIR}
RUN bundle install

ADD config/database.yml.production ${APP_DIR}/config/database.yml

ENV RAILS_ENV production

RUN bundle exec rake assets:precompile

# Make and chown the rails tmp dir to the socrata user
ENV APP_TMP_DIR ${APP_DIR}/tmp
RUN mkdir -p ${APP_TMP_DIR}
RUN chown socrata -R ${APP_TMP_DIR}

# Note: this is temporary until we have a proper web server setup (not webrick)
ENV RAILS_SERVE_STATIC_FILES true

EXPOSE 3010

CMD ["run"]
