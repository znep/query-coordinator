## Installation
This library uses [Middleman](https://middlemanapp.com), a Ruby-based static site generator, to provide an asset pipeline for documentation and a quick way to run a local environment.

1. Ensure you have `rbenv` ([installation](https://github.com/sstephenson/rbenv#installation)) installed with the version specified by `.ruby-version`.
  - `.ruby-version` is located in the root of this repository.
  - Install bundler for this version of Ruby: `gem install bundler`.
1. Ensure you have `nvm` ([installation](https://github.com/creationix/nvm#installation)) or `n` ([installation](https://github.com/tj/n#installation)) installed with the version specified by `.node-version` and activate it for this repository.
  - `.node-version` is located in the root of this repository.
1. Clone the repo somewhere appropriate, e.g. `git clone git@github.com:socrata/styleguide`.
1. `bundle install`
1. `npm install`
1. `bundle exec middleman`
1. Open your favorite browser to look at [http://localhost:4567](http://localhost:4567).
