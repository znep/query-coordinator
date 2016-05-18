# Socrata Styleguide
## Goals
- Provide a place to construct an experiment with styles destined for the Socrata Platform.
- Make it possible to quickly prototpye a design using styles and design patterns.
- Collaboration and sharing of UI components and patterns.

## Usage
Switch to the appropriate [release](https://github.com/socrata/styleguide/releases) branch, and use the files in `dist`, a folder in this project's root directory.

## Setup
This library uses the Middleman static site generator to to provide an asset pipeline, build tools, and a quick way to run a local environment.

1. Ensure you have `rbenv` ([installation](https://github.com/sstephenson/rbenv#installation)) installed with Ruby 2.2.2.
2. Clone the repo somewhere appropriate, e.g. `git clone https://github.com/socrata/styleguide`.
3. `bundle install`
4. `npm install`
5. `bundle exec middleman`
6. Open your favorite browser to look at [http://localhost:4567](http://localhost:4567).

### Adding icons to the Socrata-Icons font
There is a Sketch file located in `src/fonts`, `socrata-icons.sketch`. You can add new SVG icons to that file and then proceed to export each as individual SVGs. Keep in mind that the dimensions you should work within are 1024px by 1024px.

If you have Middleman running, then the icons will automatically update. To read more about what is involved in that task, see `tasks/font.js`.

If you'd like to update the font directly, simply run `gulp font`.

## Contributions
Anyone and everyone is welcome to submit a pull request with code and documentation. Fork the repository and work through the Setup section.

Once your bug fix or component is ready, open a PR, and we'll get to it as soon as possible.

### Cutting a new release
According to the rules of [semver](http://semver.org/), take these steps:

0. Fetch remote sources: `git fetch --all --prune`.
1. Check out the master branch: `git checkout master && git pull --rebase origin master`.
3. Update `package.json` with the new semantic version.
4. Commit the changes: `git commit -am "Major.Minor.Patch;" && git push origin release`.
5. Tag the release, push it: `git tag Major.Minor.Patch && git push --tags`.
6. Publish: `npm publish`. (This step requires [Artifactory](https://github.com/socrata/frontend#dependencies).)

### Deploying to socrata.github.io/styleguide
When a PR is successfully merged, an admin must run – from `master` — the deploy script at the base of the project.

`git checkout master && ./deploy.sh`

## Resources Used
1. [Middleman](https://middlemanapp.com/)
2. [Modular Scale](https://github.com/modularscale/modularscale-sass)
3. [Bourbon](http://bourbon.io/) and [Neat](http://neat.bourbon.io) (for layout grids)
4. [Prism](http://prismjs.com/) (for syntax highlighting)
5. See our `package.json` for all of the JavaScript goodies.
