FROM socrata/base
MAINTAINER Socrata <sysadmin@socrata.com>

RUN DEBIAN_FRONTEND=noninteractive apt-get -y update && \
  DEBIAN_FRONTEND=noninteractive apt-get --force-yes -fuy install software-properties-common && \
  DEBIAN_FRONTEND=noninteractive add-apt-repository -y ppa:brightbox/ruby-ng && \
  DEBIAN_FRONTEND=noninteractive apt-get -y update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y ruby2.2 ruby2.2-dev build-essential libxml2-dev zlib1g-dev libxslt1-dev libpq-dev nodejs && \
  DEBIAN_FRONTEND=noninteractive apt-get purge -y --auto-remove software-properties-common && \
  rm -rf /var/lib/apt/lists/*

# skip installing gem documentation
RUN echo 'gem: --no-rdoc --no-ri --no-document' >> "/etc/gemrc" && \
  gem install bundler

ADD . /opt/socrata/storyteller

RUN cd /opt/socrata/storyteller && \
  bundle install

ADD ship.d /etc/ship.d

EXPOSE 3010

CMD ["run"]
