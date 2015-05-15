# README

## Setup

### Requirements
* Ruby 2.2.2
* Postgresql 9.3+

### System dependencies

Install postgres:

```
brew install postgres
```

Install rbenv and ruby:

```
brew update
brew install rbenv ruby-build
rbenv install 2.2.2
```

### Configuration

To get started, run `bin/setup` from within the storyteller root. This will install
dependencies and create and install the database and migrations. It will also
create a good starting `database.yml` for development and test.

On your local development instance, you'll likely want to have a nice multi-site
setup. run `bin/setup_multisite` to setup pow and have it so that you can reach
your local storyteller instance with blah.dev, vertex.dev, etc.

## How to run the test suite

`bin/rake test`

## Services

As we add services (job queues, cache servers, search engines, etc.), document them here.

## Deployment

Deployment is done via marathon to AWS. Staging deployment is continuous from
the master branch.

https://docs.google.com/a/socrata.com/document/d/1LVjxsNdhd6V5XI4nfFb_9B0NJjWSadimaSh98FtaUy0/edit?usp=sharing
