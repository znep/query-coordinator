FROM socrata/rails4-deps:2.3.6

ENV APP_BASE_DIR /opt
ENV APP_DIR ${APP_BASE_DIR}/frontend
ENV HOME ${APP_DIR}
ENV GEM_DIR ${APP_BASE_DIR}/gems
ENV RAILS_SERVE_STATIC_FILES true
ENV UNICORN_LISTEN_PORT 3333

WORKDIR $APP_DIR

# We copy the .rbenv install from the build-worker_frontend to the frontend container in the
# frontend/bin/jenkins/build-frontend script. However, the rbenv install has absolute symlinks to
# /home/jenkins, as that's where it was originally installed. All these files are now in /opt/frontend,
# so symlink them.
RUN ln -s /opt/frontend /home/jenkins

# This step _extracts_ the contents of the tarball _into_ $APP_BASE_DIR, it does not copy the file itself.
ADD platform-ui.tgz $APP_BASE_DIR

RUN mkdir -p $APP_DIR && mkdir -p $APP_DIR/tmp && chown -R socrata:socrata $APP_DIR/tmp
RUN mkdir -p $APP_DIR && mkdir -p $APP_DIR/public/cache && chown -R socrata:socrata $APP_DIR/public/cache

COPY docker/ship.d/run /etc/ship.d/run
