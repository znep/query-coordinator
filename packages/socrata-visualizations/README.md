# Socrata-Visualizations Legacy Package

Transitional package for socrata visualizations. On its way out in favor of direct inclusion
of `common/visualizations` and `common/authoring_workflow`.

*NOTE*: This package is DEPRECATED and is being generated only for the purposes of
intermediate migration steps.

## Installation and usage

The `socrata-visualizations` package is available in the artifactory npm registry.

To configure `npm` to use the appropriate registry, run the following command:

    npm config set registry https://repo.socrata.com/artifactory/api/npm/npm-virtual

Then install using npm:

    npm install --save socrata-visualizations

## Example Pages

Examples are provided for each visualization type and for the Authoring Experience.
To build them:

    npm install
    npm run build

The examples are now ready to view in the `examples/` folder - just open the `.html`
files in your web browser.

## Publishing the package

Run this:

    npm install
    npm publish


#### Command Quick Index

- `npm run build` to run webpack and generate output files in `dist`.
- `npm run release` to tag and publish a new version to the npm registry (after bumping the
  version in `package.json`).

## Contributing

If you are contributing to this library, run `npm install` to set up your environment.
