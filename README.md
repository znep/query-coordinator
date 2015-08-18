# README

## Setup

### Requirements
* Ruby 2.2.2
* Postgresql 9.3+

### System dependencies

```
brew update
```

Install postgres:

```
brew install postgres
```

Install rbenv and ruby:

```
brew install rbenv ruby-build
rbenv install 2.2.2
```

To run unit tests, install node and npm: https://nodejs.org/download/,
then install npm dependencies:

```
npm install
```

### Configuration

#### Set up the database

Run `bin/setup` from within the storyteller root. This will install
dependencies and create and install the database and migrations. It will also
create a good starting `database.yml` for development and test.

#### Multisite Setup

On your local development instance, you'll likely want to have a nice multi-site
setup. run `bin/setup_multisite` to setup pow and have it so that you can reach
your local storyteller instance with blah.dev, vertex.dev, etc.

## Run Server

`bin/start`

## How to run the test suite

### Setting up the test environment

`bin/test_setup`

### tl;dr: All tests

`bin/rake test`

Coverage results are in ```coverage/```

### Ruby tests

`bin/rake spec`

### Javascript tests

We use Karma to test our Javascript.

Run all Karma tests locally in PhantomJS:
`bin/rake karma`

Same, but watch for changes (while developing):
`bin/rake karma:watch`

## Code coverage
The ```spec``` and ```karma``` tasks generate code coverage reports. They can be found here:

* Ruby: ```coverage/ruby/index.html```
* JS: ```coverage/<browser name>/index.html```

## Services

As we add services (job queues, cache servers, search engines, etc.), document them here.

## Deployment

Deployment is done via marathon to AWS. Staging deployment is continuous from
the master branch.

https://docs.google.com/a/socrata.com/document/d/1LVjxsNdhd6V5XI4nfFb_9B0NJjWSadimaSh98FtaUy0/edit?usp=sharing

If a deployment has any migrations that need to be run, they must be run
manually against the production databases. See below for example commands.

Migrations are not run as part of the automatic deployment scripts because
they are high risk, need to be supervised, and typically are run once.

There is a task for checking whether migrations need to be run. See `rake aws:migrate:status` below.

### Migrations

Running rails database migrations against our production RDS
instances in AWS can be done with a handful of rake tasks.

```
$ bin/rake -T aws
rake aws:migrate[region,environment]   # Migrate database in AWS
rake aws:rollback[region,environment]  # Rollback database in AWS
rake aws:seed[region,environment]      # Seed database in AWS
rake aws:migrate:status[region,environment]  # Check database migration status in AWS
```

Before running the migration rake tasks, ensure you have AWS admin access to staging/rc
and that you're connected to the VPN. You must also have the `aws_migrations` key in
your `database.yml` file, which can be found in `database.yml.sample`.

AWS admin credentials must be set up by an OPS team member.

To perform migrations against `staging` or `rc` in the `us-west-2` region:

```
bin/rake aws:migrate[us-west-2,staging]
bin/rake aws:migrate[us-west-2,rc]
```

Additionally, `rollback` and `seed` are supported.

```
bin/rake aws:rollback[us-west-2,staging]
bin/rake aws:seed[us-west-2,staging]
```

And migrating a different region might look like this:

```
bin/rake aws:migrate[eu-west-1,staging]
```

## Profiling

The `rack_mini_profiler` and `flamegraph` gems have been installed and are automatically
loaded in development mode.

The profiler tool adds a widget to the top left that profiles rendering and database calls.

To view the flamegraph for a page, append `?pp=flamegraph` to any url.

## Linting

The following command will run `eslint` on the javascript codebase:

```
npm run lint [-- eslint_options]
```

The configuration options for `eslint` can be found in `package.json`. A rake task will also
lint the javascript codebase:

```
rake lint:js
```
