FROM socrata/ruby2.2
MAINTAINER Socrata <sysadmin@socrata.com>

ENV APP_DIR /opt/socrata/storyteller

# Ridiculous hack to make this Dockerfile work in AWS jenkins.
# See: https://github.com/docker/docker/issues/4962
# Comment this line out for local Dockerfile builds.
ENV build_proxy http://proxy.aws-us-west-2-infrastructure.socrata.net:3128

# The proxy config we set above is only valid in the infrastructure environment,
# not staging/rc/prod which is where the image being built will eventually run.
# So we can't put the proxy config into the normal environment vars
# (http_proxy, etc), as the actual Rails app shouldn't use the infrastructure
# proxy (note that ENV directives persist all the way through docker run).
# Also note that each RUN directive uses a separate shell, so tricks like
# using export to circumvent ENV's persistence won't work.
#
# To avoid this, we put the infrastructure proxy config in a string that can be
# evaluated in a subshell, to somewhat alleviate duplication.
#
# If and when UNSET becomes an option in Dockerfiles, use that instead.
# Seems unlikely, as the docker task for UNSET was rejected:
# https://github.com/docker/docker/issues/3465
ENV build_proxy_env "export http_proxy=${build_proxy} https_proxy=${build_proxy} ftp_proxy=${build_proxy}"

# Install additional packages for building our gems
RUN DEBIAN_FRONTEND=noninteractive && \
  eval ${build_proxy_env} && \
  apt-get update -q && \
  apt-get install -y ruby2.2-dev build-essential libxml2-dev \
    zlib1g-dev libxslt1-dev libpq-dev nodejs && \
  apt-get purge -y --auto-remove software-properties-common && \
  rm -rf /var/lib/apt/lists/*

ADD ship.d /etc/ship.d
ADD . ${APP_DIR}

WORKDIR ${APP_DIR}
RUN eval ${build_proxy_env} && bundle install

ADD config/database.yml.production ${APP_DIR}/config/database.yml

ENV RAILS_ENV production
RUN bundle exec rake assets:precompile

# Note: this is temporary until we have a proper web server setup (not webrick)
ENV RAILS_SERVE_STATIC_FILES true

EXPOSE 3010

CMD ["run"]
