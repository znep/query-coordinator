# Socrata Utils

Useful utility functions and modules that we can share between different projects such as
`frontend`, `storyteller`, `socrata_site_chrome`, `frontend-visualizations`, etc.

*NOTE*: This package is DEPRECATED and is being generated only for the purposes of
intermediate migration steps.

## Installation and usage

The `socrata-utils` package is available in the artifactory npm registry.
> Note that in github it the project is called `frontend-utils`.

To configure `npm` to use the appropriate registry, run the following command:

    npm config set registry https://repo.socrata.com/artifactory/api/npm/npm-virtual

Then install using npm:

    npm install --save socrata-utils

The `npm` distribution includes a `dist` folder with `socrata.utils.js`. It should be included
on the page using `script` tag or using your favorite client-side build system.

This library depends on [Lodash](https://lodash.com). When using this library as a dependency
in another project, you must also include Lodash in your dependencies because it will not be
automatically installed.

This library exposes new capabilities in three ways:

1. Extending prototypes of native JS types
1. Adding new prototypes to global scope
1. Providing functions under a namespace

> **NOTE:** When contributing to this library, exercise caution when using either of the first
> two techniques! The namespace approach should be preferred in almost all cases.

## Publishing the package

Run this:

    npm install
    npm publish


## Testing locally with npm link

If you're developing locally and want to try out your changes using another project, say the
`frontend` for example, you can use `npm link` to link your work with the project you're
testing it in. For example, do link this package with the `frontend` you'd do something
like this: TBD

#### Command Quick Index

- `npm run test` to run the tests ("npm test" also works).
- `npm run watch` to automatically run the tests when files change. The tests can be debugged in
  a browser by visiting [http://localhost:9876/debug.html](http://localhost:9876/debug.html).
- `npm run build` to run webpack and generate output files in `dist`.
- `npm run release` to tag and publish a new version to the npm registry (after bumping the
  version in `package.json`).

## Contributing

If you are contributing to this library, run `npm install` to set up your environment.
