# Socrata Styleguide
## Goals
- Provide a place to construct an experiment with styles destined for the Socrata Platform.
- Make it possible to quickly prototpye a design using styles and design patterns.
- Collaboration and sharing of UI componets and patterns.

## Setup
This libarary uses the Middleman static site generator to to provide an asset pipeline, build tools, and a quick way to run a local environment.

2. Ensure you have `rbenv` ([installation](https://github.com/sstephenson/rbenv#installation)) installed with ruby 2.2.2.
1. Clone the repo somewhere appropriate, e.g. `git clone https://github.com/socrata/styleguide`.
3. `bundle install`
4. `bundle exec middleman`
5. Open your favorite browser to look at `http://localhost:4567`.

## Contributions
Anyone and everyone is welcome to submit a pull request with code and documentation. Fork the repository and work through the Setup section.

Once your bug fixes or component is ready, open a PR, and get we'll get to it as soon as possible.

### Deploying to socrata.github.io/styleguide
When a PR is successfully merged, an admin must run – from `master` – the deploy script at the base of the project.

`git checkout master && ./deploy.sh`

## Resources Used
1. Middleman
2. Modular Scale
3. Bourbon and Neat (for layout grids)
4. Prism (for syntax highlighting)
