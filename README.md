# Socrata Visualizations

Visualizations that we can share between frontend projects.

## Usage

`socrata-visualizations` is available in the artifactory npm registry.  To configure npm to use the
appropriate registry:

```sh
npm config set registry https://socrata.artifactoryonline.com/socrata/api/npm/npm-virtual
```

Then install using npm:

```sh
npm install --save socrata-visualizations
```

The npm distribution includes a `dist` folder with `socrata-visualizations.js` and
`socrata-visualizations.css`.  Both should be included on the page using `script` and `link` tags or
using your favorite client-side build system.

jQuery components are installed as jQuery plugins, which can be used like this:

```javascript
$('.my-visualization').socrataColumnChart(vif);
```

Raw components may be accessed via the `views` and `dataProviders` keys of the
`socrata-visualizations` object.  This object is available on the window
(`window.socrata.visualizations`) or by requiring it (`require('socrata-visualizations');`).

This library depends on [frontend-utils](https://github.com/socrata/frontend-utils),
[D3](http://d3js.org), [Lodash](https://lodash.com), and [jQuery](https://jquery.com). When using
this library as a dependency in another project, you must also include the non-Socrata libraries in
your dependencies because they will not be automatically installed.

## Contributing

If you are contributing to this library, run `npm install && bower install` to set up your environment.

Useful commands:

- `npm test` to run the tests.
- `npm run watch` to automatically run the tests when files change.  The tests can be debugged in
  a browser by visiting http://localhost:9876/debug.html.
- `npm run build` to run webpack and generate output files in `dist`.
- `npm publish` to publish a new version to the npm registry (after bumping the version in
  `package.json`).

## Examples

The `examples` directory contains demos that show how each supported visualization can be consumed.
