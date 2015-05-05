FROM socrata/base
MAINTAINER Socrata <sysadmin@socrata.com>

# Ridiculous hack to make this Dockerfile work in AWS jenkins.
# Comment these out for local Dockerfile builds.
ENV ftp_proxy http://proxy.aws-us-west-2-infrastructure.socrata.net:3128
ENV http_proxy http://proxy.aws-us-west-2-infrastructure.socrata.net:3128
ENV https_proxy http://proxy.aws-us-west-2-infrastructure.socrata.net:3128

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
ADD config/database.yml.production config/database.yml

EXPOSE 3010

CMD ["run"]
