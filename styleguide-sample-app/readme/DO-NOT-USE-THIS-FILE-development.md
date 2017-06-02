# See EN-16712

## Development

#### What tools are we using?

1. [Middleman](https://middlemanapp.com/)
  - ERB templating and static website generation.

1. [Modular Scale](https://github.com/modularscale/modularscale-sass)
  - A singular scale and sizing library for styling.

1. [Bourbon](http://bourbon.io/) and [Neat](http://neat.bourbon.io)
  - Layout grids

1. [Prism](http://prismjs.com/)
  - Example page syntax highlighting

1. See our [package.json](https://github.com/socrata/styleguide/blob/master/package.json) for all of the JavaScript goodies. A few highlights include:
    - [React](https://github.com/facebook/react)
    - [Babel](https://github.com/babel/babel)
    - [Gulpjs](https://github.com/gulpjs/gulp)
    - [lodash](https://github.com/lodash/lodash)

#### Command Quick Index

    npm run test                    # Run the tests ("npm test" also works)
    npm run lint                    # Run the linter on all files
    npm run create-component Foo    # Create a new component called Foo
    npm run deploy                  # Deploys the styleguide
    npm run gulp                    # Builds the dist artifacts
    npm run version-bump-check      # Test the version in package.json is newer than master
    bundle exec middleman           # Runs middleman to generate the docs
    open http://localhost:4567      # View the middleman docs

## Everyday musings of a Styleguide developer

#### Working on the styleguide in an embedded application

Scenario:

You are working on a feature or fixing a bug and you want to test your changes locally in an embedded app, such as frontend or storyteller, prior to deploying a new version of the styleguide.

Use `npm link` to link the version that you're currently working on with another project that you're using to test it. For example if you're testing `socrata-components` using the `frontend` project, you'd do something like this:

```shell
cd $SOCRATA_HOME/styleguide;
NODE_ENV=production npm run gulp;
cd $SOCATA_HOME/styleguide/packages/socrata-components;
npm link;
cd $SOCRATA_HOME/frontend;
npm link socrata-components;
```

This will link a current version of `socrata-components`.

To build edits made in this repository, run the command

```shell
NODE_ENV=production npm run gulp
```

A `watch` command is also available to remove the tedium of rebuilding over and over by hand.

```shell
NODE_ENV=production npm run watch
```

#### Making a PR

Make sure your branch has a bumped version according to [semver](http://semver.org).

Open our `package.json` and bump the version in there or run:

    npm version MAJOR.MINOR.PATCH

replacing "MAJOR", "MINOR", and "PATCH" with the appropriate values.

Run the linter with:

    npm run lint

Open up a pull request (PR) on github at [styleguide](https://github.com/socrata/styleguide/compare).

Roll someone (`snu cr styleguide <your-PR-url>`) in `#socrata-styleguide` on Socrata's Slack!

#### Getting a list of gulp tasks

Check out our [gulpfile.js](https://github.com/socrata/styleguide/blob/master/gulpfile.js)!

New tasks can be added to the top-level `tasks` directory, which includes every task that correlates to gulp and _not_ general tools and tasks. General tools and tasks should be added to our top-level `tools` directory.

#### Linting JavaScript and SASS

Linting can be run using:

    npm run lint

- JavaScript linting uses [eslint-base](https://github.com/socrata/eslint-base) which builds upon Airbnb's linting rules.
- SASS linting uses [stylelint](https://github.com/stylelint/stylelint) with their [standard configuration library](https://github.com/stylelint/stylelint-config-standard).

There is a Jenkins job responsible for PR testing (see styleguide-pull-request-linter).

#### Testing JavaScript

JavaScript tests are in `test/js` and the suite runs through Karma and Mocha. When the component generation script is used to start a new component an empty test file will be available in `test/js/components/NewComponent`. You can run the tests with:

    npm test

There is a Jenkins job responsible for PR testing (see styleguide-pull-request-tester).

#### Releasing Styleguide
There are two parts to releasing styleguide:

1. Publish an NPM package to artifactory. This is happens automatically via Jenkins (the "styleguide-publisher" job) when you merge to master. :tada:

    If you need to run a manual release:

        npm run release

2. Deploy to  https://socrata.github.io/styleguide

    This is not automated. Run:

        npm run deploy

    This runs Middleman and makes a commit to `master` after building and placing files in `docs/`. Do note that the website may take a few seconds to minutes to update to the newest version. After running the command, please check the website for any hiccups. Other people rely on the Styleguide for showcasing prototypes.

#### Adding a React component
Use the React generation command to set up a new React component:

    npm run create-component MyReactComponent

This includes:

- JavaScript source files and structure,
- test files,
- templates for showcasing the component in our "Components" section of the Styleguide docs page,
- and automated inclusion of the new component into the "Guide Menu".

#### Adding icons to the Socrata-Icons font
There is a Sketch file located in `src/fonts/socrata-icons.sketch`. You can add new SVG icons to that file and then proceed to export each as individual SVGs. Keep in mind that the dimensions you should work within are 1024px by 1024px.

If you have Middleman running, then the icons will automatically update. To read more about what is involved in that task, see `tasks/font.js`.

If you'd like to update the font directly, simply run `gulp font`.
