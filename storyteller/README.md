## Storyteller

- External name: _Socrata Perspectives_

### Requirements

* Ruby 2.3.1
* Postgresql 9.3+

### System dependencies

    brew update

    brew install awscli

Install `postgres`:

    brew install postgres

Install `rbenv` and `ruby`:

    brew install rbenv ruby-build
    rbenv install $(cat .ruby-version)

Install `n` and `node`:

    brew install n
    n $(cat .node-version)

Then install `npm` dependencies:

    npm install

### Configuration

#### Set up the database

Run `bin/setup` from within the storyteller root. This will install
dependencies and create and install the database and migrations. It will also
create a good starting `database.yml` for development and test.

#### AWS setup for S3

In order to be able to upload images in development mode, you need to have a
profile for your personal IAM user in the staging environment. This profile is
assumed to have the name `staging` by default; if your staging profile has
another name, edit `.env` (created by `bin/setup` above) and change the profile
argument that is used to set AWS env variables.

#### Multisite Setup

On your local development instance, you'll likely want to have a nice multi-site
setup. run `bin/setup_multisite` to setup pow and have it so that you can reach
your local storyteller instance with blah.dev, vertex.dev, etc.

### Run Servers and Jobs

Run all three processes in the same terminal window with foreman.

    bin/start_all_storyteller_services

#### Alternatively you can start each process separately

To start the Rails app:

    bin/start_rails

To start the webpack-dev-server:

    npm run watch

> Note: You **must** run the nginx configuration in ../dev-server.

We also have a delayed job queue for processing uploaded files. Everything but
uploading files (which also requires AWS S3 credentials) will work without this.
The jobs can be processed manually with a rake task:

    bundle exec rake jobs:work

### How to run the test suite

#### Setting up the test environment

    bin/test_setup

##### Running the Jenkins test script locally
login to your postgres instance and run the following commands *before* running `bin/test_setup`

      CREATE ROLE storyteller_su;
      ALTER ROLE storyteller_su WITH LOGIN;
      ALTER ROLE storyteller_su WITH CREATEDB;

logout and run the script `bin/test_setup`

#### tl;dr: Run all tests (the default rake task is "test")

    bundle exec rake

Coverage results are in the `coverage/` directory.

#### RSpec tests

    bundle exec rake spec

# To run just one rspec test:

    bundle exec rspec <path-to-file>

##### Special Firefox

If you need to run an outdated Firefox version for the sake of Selenium compatibility, the recommended
old version of Firefox to to use is 46.0 which can be downloaded
[here](https://ftp.mozilla.org/pub/firefox/releases/46.0/mac/en-US/Firefox%2046.0.dmg).

Set the environment variable `FIREFOX_BINARY_PATH` so Selenium can find the correct Firefox binary:

    export FIREFOX_BINARY_PATH=/Applications/Firefox.app/Contents/MacOS/firefox-bin

`NodeJS` requires that you put environment settings into an `.env` file, so
create such a file if you don't already have one and add the following:

    export FIREFOX_BINARY_PATH=/Applications/Firefox.app/Contents/MacOS/firefox-bin

You may also need to download `geckodriver` and move it to a directory on your
`PATH`. The tool can be downloaded
[here](https://github.com/mozilla/geckodriver/releases).

#### Javascript tests

We use Karma to test our Javascript.

    bundle exec rake karma

# Or to watch files and you work on tests:

    bundle exec rake karma:watch

### Code coverage

The `spec` and `karma` tasks generate code coverage reports. They can be found here:

#### Ruby

    coverage/ruby/index.html

#### JavaScript

    coverage/<browser name>/index.html

### Deployment

Deployment is done via marathon to AWS. Staging deployment is continuous
from the master branch.

See [Storyteller AWS Setup Instructions](https://docs.google.com/document/d/1ZTsUNw3JxbQozdjq69NdnOD1dLYMpzDfQsoolGV-Wb8/edit#heading=h.w14ab4sv58p0)
for deploying to a brand new environment.

If a deployment has any migrations that need to be run, they must be run
manually against the production databases. See below for example commands.

Migrations are not run as part of the automatic deployment scripts because
they are high risk, need to be supervised, and typically are run once.

There is a task for checking whether migrations need to be run.
See `rake aws:migrate:status` below.

### Deploy to RC, Prod, FedRAMP, EU

See the [Storyteller OpsDoc](https://docs.google.com/document/d/1Yo7VUCnDGlAImuIPnZhazoQ7heY2krUTD_iOxX0Q8MI)
for deployment instructions.

In order to deploy to the `fedramp-prod` environment, you need to get FedRAMP VPN setup and be able to
[access bastions](https://docs.google.com/document/d/1BNjUz3Q_DU2q1iDLeY5vk84GwXBDGj5vQQJdeBXpQ-Y/edit#)
(aka jump boxes).

See [Storyteller OpsDoc](https://docs.google.com/document/d/1ZTsUNw3JxbQozdjq69NdnOD1dLYMpzDfQsoolGV-Wb8/edit#heading=h.l0gnqlmtrqxj)
for additional FedRAMP deployment instructions.

### Migrations

Running rails database migrations against our production RDS
instances in AWS can be done with a handful of rake tasks.

    bundle exec rake aws:migrate[region,environment]        # Migrate database in AWS
    bundle exec rake aws:rollback[region,environment]       # Rollback database in AWS
    bundle exec rake aws:seed[region,environment]           # Seed database in AWS
    bundle exec rake aws:migrate:status[region,environment] # Check database migration status in AWS

Too see all AWS tasks run:

    bundle exec rake -T aws

Before running the migration rake tasks, ensure you have AWS admin access to staging/rc
and that you're connected to the VPN. You must also have the `aws_migrations` key in
your `database.yml` file, which can be found in `database.yml.sample`.

AWS admin credentials must be set up by an OPS team member.

To perform migrations against `staging` or `rc` in the `us-west-2` region:

    bundle exec rake aws:migrate[us-west-2,staging]
    bundle exec rake aws:migrate[us-west-2,rc]

Additionally, `rollback` and `seed` are supported.

    bundle exec rake aws:rollback[us-west-2,staging]
    bundle exec rake aws:seed[us-west-2,staging]

And migrating a different region might look like this:

    bundle exec rake aws:migrate[eu-west-1,eu-west-1-prod]

### Profiling

The `rack_mini_profiler` and `flamegraph` gems have been installed and are automatically
loaded in development mode.

The profiler tool adds a widget to the top left that profiles rendering and database calls.

To view the flamegraph for a page, append `?pp=flamegraph` to any url.

### Linting

The following command will run `eslint` on the javascript codebase:

    npm run lint [-- eslint_options]

# alternatively

    bundle exec rake lint:js

The configuration options for `eslint` can be found in `package.json` and
[eslint-base](https://github.com/socrata/eslint-base).

### Dependencies

- Ruby dependencies are via [bundler](http://bundler.io/).
- Javascript dependencies are via [npm](https://npmjs.org).
- Artifactory ([setup](https://docs.google.com/document/d/1KihQV3-UBfZEOKIInsQlloESR6NLck8RuP4BUKzX_Y8)).
