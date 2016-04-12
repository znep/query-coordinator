# Socrata Styleguide
## Goals
- Provide a place to construct an experiment with styles destined for the Socrata Platform.
- Make it possible to quickly prototpye a design using styles and design patterns.
- Collaboration and sharing of UI components and patterns.

## Usage
Switch to the appropriate [release](https://github.com/socrata/styleguide/releases) branch, and use the files in `dist`, a folder in the project's root directory.

## Setup
This library uses the Middleman static site generator to to provide an asset pipeline, build tools, and a quick way to run a local environment.

1. Ensure you have `rbenv` ([installation](https://github.com/sstephenson/rbenv#installation)) installed with Ruby 2.2.2.
2. Clone the repo somewhere appropriate, e.g. `git clone https://github.com/socrata/styleguide`.
3. `bundle install`
4. `npm install`
5. `bundle exec middleman`
6. Open your favorite browser to look at [http://localhost:4567](http://localhost:4567).

### Adding icons to the Socrata-Icons font
In order to compile and update the icon font, additional setup is required. We are using the [fontcustom](https://github.com/FontCustom/fontcustom) gem, which in turn requires you to install _fontforge_ and _eot-utils_ to generate the font. **Review the fontcustom setup documentation before attempting to update the icon font**.

#### Updating the icon
1. Make sure you've installed the fontcustom required utilities
2. Add/remove/update the `.svg` file(s) in the `/src/fonts/svg/` folder
3. Open a terminal and cd to `styleguide/src/fonts`
4. Run `fontcustom compile -c .`
5. Restart middleman

## Contributions
Anyone and everyone is welcome to submit a pull request with code and documentation. Fork the repository and work through the Setup section.

Once your bug fix or component is ready, open a PR, and we'll get to it as soon as possible.

### Cutting a new release
When a significant amount of changes have been made, according to the rules of [semver](http://semver.org/), take these steps:

1. Checkout master: `git checkout master && git pull origin master`.
2. Update `package.json` with the new semver version.
3. Run `gulp dist` to update `/dist`.
4. Commit the changes: `git commit -am "Major.Minor.Patch;" && git push origin master`.
5. Tag the release, push it: `git tag Major.Minor.Patch && git push --tags`.
6. Publish: `npm publish`

### Deploying to socrata.github.io/styleguide
When a PR is successfully merged, an admin must run – from `master` — the deploy script at the base of the project.

`git checkout master && ./deploy.sh`

## Resources Used
1. [Middleman](https://middlemanapp.com/)
2. [Modular Scale](https://github.com/modularscale/modularscale-sass)
3. [Bourbon](http://bourbon.io/) and [Neat](http://neat.bourbon.io) (for layout grids)
4. [Prism](http://prismjs.com/) (for syntax highlighting)
5. [Font]
