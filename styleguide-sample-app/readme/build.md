## Building the docs
The files in the `docs` directory are generated automatically by this
[Jenkins Job](https://jenkins-build.socrata.com/job/styleguide-publisher/).

The job runs the [deploy.sh](https://github.com/socrata/styleguide/blob/master/deploy.sh)
script to build and publish the files. If you want to build the docs locally run:

    npm i
    bundle install
    bundle exec middleman build
    rm -rf docs/*
    cp -pr build/* docs

If you want to make any changes to the documentation, make the changes in the source files in the
[pages](https://github.com/socrata/styleguide/tree/master/pages) directory instead.
