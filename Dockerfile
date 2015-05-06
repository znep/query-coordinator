FROM socrata/ruby2.2
MAINTAINER Socrata <sysadmin@socrata.com>

ENV APP_DIR /opt/socrata/storyteller

# Install additional packages for building our gems
RUN DEBIAN_FRONTEND=noninteractive apt-get update -q && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y ruby2.2-dev build-essential libxml2-dev \
    zlib1g-dev libxslt1-dev libpq-dev nodejs && \
  DEBIAN_FRONTEND=noninteractive apt-get purge -y --auto-remove software-properties-common && \
  rm -rf /var/lib/apt/lists/*

ADD . ${APP_DIR}

WORKDIR ${APP_DIR}
RUN bundle install

ADD ship.d /etc/ship.d
ADD config/database.yml.production ${APP_DIR}/config/database.yml

EXPOSE 3010

CMD ["run"]
