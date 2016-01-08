FROM socrata/rails3-deps:1.9

ENV APP_BASE_DIR /opt
ENV APP_DIR ${APP_BASE_DIR}/frontend
ENV HOME ${APP_DIR}
ENV GEM_DIR ${APP_BASE_DIR}/gems
RUN mkdir -p $APP_DIR && mkdir -p $APP_DIR/tmp && chown socrata:socrata $APP_DIR/tmp
RUN mkdir -p $APP_DIR && mkdir -p $APP_DIR/public/cache && chown socrata:socrata $APP_DIR/public/cache
WORKDIR $APP_DIR
ADD frontend.tgz $APP_DIR
COPY docker/ship.d/run /etc/ship.d/run

EXPOSE 3000
