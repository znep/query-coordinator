FROM socrata/rails3-deps:1.9

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

ENV APP_BASE_DIR /opt
ENV APP_DIR ${APP_BASE_DIR}/frontend
ENV GEM_DIR ${APP_BASE_DIR}/gems
RUN mkdir -p $APP_DIR && mkdir -p $APP_DIR/tmp && chown socrata:socrata $APP_DIR/tmp
WORKDIR $APP_DIR
COPY . $APP_DIR
COPY docker/ship.d/run /etc/ship.d/run

RUN eval ${build_proxy_env} \
  && bundle install --path ${GEM_DIR} --without=development --deployment \
  && bundle exec rake assets:unminified

EXPOSE 3000
